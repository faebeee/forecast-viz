import { getHarvest } from "../src/server/get-harvest";
import { differenceInBusinessDays, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import {
    Box,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { Forecast, getForecast } from "../src/server/get-forecast";
import { debounce, round } from "lodash";
import { Layout } from "../src/components/layout";
import { useFilterContext } from "../src/context/filter-context";
import { useEffect, useMemo, useState } from "react";
import { ContentHeader } from "../src/components/content-header";
import { useEntries } from "../src/hooks/use-entries";
import { useStats } from "../src/hooks/use-stats";
import { useAssignments } from "../src/hooks/use-assignments";
import { useHours } from "../src/hooks/use-hours";
import dynamic from "next/dynamic";
import { PieChartProps } from "reaviz/dist/src/PieChart/PieChart";
import { useCurrentStats } from "../src/hooks/use-current-stats";
import { GridRenderCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { SpentProjectHours } from "../src/server/utils";
import { StatusIndicator } from "../src/components/status-indicator";
import { TEAMS } from "../src/config";
import { getAdminAccess } from "../src/server/has-admin-access";
import { HistoryLineChart } from "../src/components/chart/history-line-chart";
import { StatsApiContext } from "../src/context/stats-api-context";
import { TotalHoursStats } from "../src/components/stats/total-hours-stats";
import { WeeklyCapacityStats } from "../src/components/stats/weekly-capacity-stats";
import { ProjectsStats } from "../src/components/stats/projects-stats";
import { BillableHoursStats } from "../src/components/stats/billable-hours-stats";
import { CurrentStatsApiContext } from "../src/context/current-stats-api-context";
import { RemainingCapacityStats } from "../src/components/stats/remaining-capacity-stats";
import { TotalOvertimeStats } from "../src/components/stats/total-overtime-stats";
import { LastEntryStats } from "../src/components/stats/last-entry-stats";
import { useEntriesDetailed } from "../src/hooks/use-entries-detailed";
import mixpanel from "mixpanel-browser";
import {DATE_FORMAT} from "../src/context/formats";
import {withServerSideSession} from "../src/server/with-session";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });

//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });
//@ts-ignore
const RadialAreaChart = dynamic(() => import('reaviz').then(module => module.RadialAreaChart), { ssr: false });
//@ts-ignore
const RadialAreaSeries = dynamic(() => import('reaviz').then(module => module.RadialAreaSeries), { ssr: false });
//@ts-ignore
const RadialAxis = dynamic(() => import('reaviz').then(module => module.RadialAxis), { ssr: false });
//@ts-ignore
const RadialArea = dynamic(() => import('reaviz').then(module => module.RadialArea), { ssr: false });
//@ts-ignore
const RadialGradient = dynamic(() => import('reaviz').then(module => module.RadialGradient), { ssr: false });


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({ query, req }): Promise<{ props: EntriesProps }> => {
        const from = query.from as string ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), DATE_FORMAT);
        const to = query.to as string ?? format(new Date(), DATE_FORMAT);

        const api = await getHarvest(req.session.accessToken!, req.session.harvestId);
        const forecast = getForecast(req.session.accessToken!, req.session.forecastId!);
        const userData = await api.getMe();
        const userId = userData.id;

        const allPeople = await forecast.getPersons();
        const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
        const hasAdminAccess = getAdminAccess(myDetails?.roles ?? []) ?? false;
        const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
        const teamId = myTeamEntry!.key;
        const teamPeople = allPeople
            .filter((p) => p.roles.includes(teamId!) && !p.archived)

        return {
            props: {
                from,
                to,
                persons: teamPeople,
                userName: userData.first_name,
                hasAdminAccess,
            }
        }
    }
)

export type EntriesProps = {
    from: string;
    to: string;
    persons: Forecast.Person[];
    userName?: string | null;
    hasAdminAccess?: boolean;
}


export const Index = ({
                          userName,
                          from,
                          to,
                          hasAdminAccess,
                          persons,
                      }: EntriesProps) => {
    const [ userId, setUID ] = useState('');
    const { dateRange } = useFilterContext();
    const entriesApi = useEntries();
    const entriesDetailedApi = useEntriesDetailed();
    const currentStatsApi = useCurrentStats();
    const statsApi = useStats();
    const assignmentsApi = useAssignments();
    const hoursApi = useHours();

    const amountOfDays = useMemo(() => differenceInBusinessDays(dateRange[1], dateRange[0]) + 1, [ dateRange ]);

    const debounceLoad = debounce(() => {
        const from = format(dateRange[0] ?? new Date(), DATE_FORMAT)
        const to = format(dateRange[1] ?? new Date(), DATE_FORMAT)
        if (!userId) {
            return;
        }
        entriesApi.load(from, to, userId);
        entriesDetailedApi.load(from, to, userId);
        statsApi.load(from, to, userId);
        assignmentsApi.load(from, to, userId);
        hoursApi.load(from, to, userId);
        currentStatsApi.load(userId);

        if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
            mixpanel.track('filter', {
                'page': "user",
                range: { from, to },
            });
        }
    }, 200)

    useEffect(() => {
        debounceLoad();
    }, [ dateRange, userId ]);


    return <>
        <CurrentStatsApiContext.Provider value={ currentStatsApi }>
            <StatsApiContext.Provider value={ statsApi }>
                <Layout hasAdminAccess={ hasAdminAccess } userName={ userName ?? '' } active={ 'user' }>
                    <Box sx={ { flexGrow: 1, } }>
                        <Box p={ 4 }>
                            <ContentHeader title={ 'Dashboard' }>
                                { hasAdminAccess &&
                                    <FormControl sx={ { width: 280 } }>
                                        <InputLabel>Select User</InputLabel>
                                        <Select label={ 'Select User' } value={ userId }
                                            onChange={ (e) => setUID(e.target.value) }>
                                            { persons.map((p) => (
                                                <MenuItem key={ p.id }
                                                    value={ p.harvest_user_id }>{ p.first_name } { p.last_name }</MenuItem>)) }
                                        </Select>
                                    </FormControl>
                                }
                            </ContentHeader>
                            { userId && <Grid container spacing={ 10 }>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <TotalHoursStats amountOfDays={ amountOfDays }/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <RemainingCapacityStats amountOfDays={ amountOfDays }/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <TotalOvertimeStats amountOfDays={ amountOfDays }/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <BillableHoursStats/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <LastEntryStats/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <ProjectsStats/>
                                </Grid>

                                <Grid item xs={ 6 } xl={ 4 }>
                                    <WeeklyCapacityStats/>
                                </Grid>
                                <Grid item xs={ 6 } xl={ 8 }></Grid>

                                <Grid item xs={ 12 } xl={ 6 }>
                                    <Typography variant={ 'body1' }>Reported Hours</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !statsApi.isLoading &&
                                        <RadialAreaChart
                                            data={ statsApi.hoursPerDay?.filter((e) => e.hours > 0)
                                                .map((h, index) => ({
                                                    id: index.toString(),
                                                    key: parse(h.date, DATE_FORMAT, new Date()),
                                                    data: h.hours,
                                                })) ?? [] }
                                            height={ 400 }
                                            series={ <RadialAreaSeries
                                                area={ <RadialArea gradient={ <RadialGradient/> }/> }
                                                interpolation={ 'linear' }/> }
                                            axis={ <RadialAxis
                                                // @ts-ignore
                                                type="category"/> }
                                        />
                                    }
                                </Grid>
                                <Grid item xs={ 12 } xl={ 6 }>
                                    <Typography variant={ 'body1' }>Reported Overtime</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !statsApi.isLoading &&
                                        <RadialAreaChart
                                            data={ statsApi.overtimePerDay?.filter((e) => e.hours > 0)
                                                .map((h, index) => ({
                                                    id: index.toString(),
                                                    key: parse(h.date, DATE_FORMAT, new Date()),
                                                    data: h.hours,
                                                })) ?? [] }
                                            height={ 400 }
                                            series={ <RadialAreaSeries
                                                area={ <RadialArea gradient={ <RadialGradient/> }/> }
                                                interpolation={ 'linear' }/> }
                                            axis={ <RadialAxis
                                                // @ts-ignore
                                                type="category"/> }
                                        />
                                    }
                                </Grid>

                                <Grid item xs={ 12 } lg={ 12 }>
                                    <Typography variant={ 'body1' }>Hours per day</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !statsApi.isLoading && <HistoryLineChart/> }
                                </Grid>

                                <Grid item xs={ 12 } lg={ 4 }>
                                    <Typography variant={ 'body1' }>Hours spent</Typography>
                                    { hoursApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !hoursApi.isLoading &&
                                        <PieChart height={ 600 }
                                            series={ <PieArcSeries
                                                cornerRadius={ 4 }
                                                padAngle={ 0.02 }
                                                padRadius={ 200 }
                                                doughnut={ true }
                                            /> }
                                            data={ (hoursApi.hours ?? []).map((h) => ({
                                                key: h.name ?? h.code ?? '?',
                                                data: h.hoursSpent
                                            })) ?? [] }/> }
                                </Grid>


                                <Grid item xs={ 12 } lg={ 4 }>
                                    <Typography variant={ 'body1' }>Hours spent per task</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !statsApi.isLoading &&
                                        <PieChart height={ 600 }
                                            series={ <PieArcSeries
                                                cornerRadius={ 4 }
                                                padAngle={ 0.02 }
                                                padRadius={ 200 }
                                                doughnut={ true }
                                            /> }
                                            data={ (statsApi.hoursPerTask ?? []).map((h) => ({
                                                key: h.task,
                                                data: h.hours ?? 0
                                            })) ?? [] }/>
                                    }
                                </Grid>

                                <Grid item xs={ 12 } lg={ 4 }>
                                    <Typography variant={ 'body1' }>Hours planned</Typography>
                                    { assignmentsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                    { !assignmentsApi.isLoading &&
                                        <PieChart height={ 600 }
                                            series={ <PieArcSeries
                                                cornerRadius={ 4 }
                                                padAngle={ 0.02 }
                                                padRadius={ 200 }
                                                doughnut={ true }
                                            /> }
                                            data={ (assignmentsApi.assignments ?? []).map((h) => ({
                                                key: h.name ?? h.code ?? '?',
                                                data: h.totalHours ?? 0
                                            })) ?? [] }/>
                                    }
                                </Grid>

                                <Grid item xs={ 12 }>
                                    <Typography mb={ 2 } variant={ 'h5' }>Entries</Typography>

                                    <DataGrid
                                        autoHeight
                                        loading={ entriesApi.isLoading }
                                        rows={ entriesApi.entries }
                                        rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                        columns={ [
                                            { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                            {
                                                field: 'nonBillableHours', headerName: 'Non Billable Hours', flex: 1,
                                                renderCell: (data: GridRenderCellParams<SpentProjectHours>) => <>{ round(data.row[data.field] as number, 2) }</>
                                            },
                                            {
                                                field: 'hours', headerName: 'Hours', flex: 1,
                                                renderCell: (data: GridRenderCellParams<SpentProjectHours>) => <>{ round(data.row[data.field] as number, 2) }</>
                                            },
                                            {
                                                field: 'hours_forecast', headerName: 'Forecast', flex: 1,
                                                renderCell: (data: GridRenderCellParams<SpentProjectHours>) => <>{ round(data.row[data.field] as number, 2) }</>
                                            },
                                            {
                                                field: 'hours_delta', headerName: 'Delta', flex: 1,
                                                renderCell: (data: GridRenderCellParams<SpentProjectHours>) => <>{ round(data.row[data.field] as number, 2) }</>
                                            },
                                            {
                                                field: 'hours_delta_percentage', headerName: 'Delta %', flex: 1,
                                                renderCell: (data: GridRenderCellParams<SpentProjectHours>) => <>
                                                    <StatusIndicator value={ data.row[data.field] as number }/>
                                                </>
                                            },
                                        ] }
                                        disableSelectionOnClick
                                        experimentalFeatures={ { newEditingApi: true } }/>
                                </Grid>
                                <Grid item xs={ 12 }>
                                    <Typography mb={ 2 } variant={ 'h5' }>Entries</Typography>

                                    <DataGrid
                                        autoHeight
                                        loading={ entriesDetailedApi.isLoading }
                                        rows={ entriesDetailedApi.entries }
                                        rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                        columns={ [
                                            { field: 'client', headerName: 'Client', flex: 1 },
                                            { field: 'projectCode', headerName: 'Project Code', flex: 1 },
                                            { field: 'task', headerName: 'Task', flex: 1 },
                                            { field: 'notes', headerName: 'Notes', flex: 1 },
                                            { field: 'hours', headerName: 'Hours', flex: 1 },

                                        ] }
                                        disableSelectionOnClick/>
                                </Grid>
                            </Grid> }
                        </Box>
                    </Box>
                </Layout>
            </StatsApiContext.Provider>
        </CurrentStatsApiContext.Provider>
    </>
        ;
}
export default Index;
