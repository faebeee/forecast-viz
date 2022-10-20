import { getHarvest } from "../src/server/get-harvest";
import { differenceInBusinessDays, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT } from "../src/components/date-range-widget";
import { Forecast, getForecast } from "../src/server/get-forecast";
import { debounce, round } from "lodash";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
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
import { LineChartProps, LineProps, LineSeriesProps } from "reaviz";
import { GridRenderCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { SpentProjectHours } from "../src/server/utils";
import { StatusIndicator } from "../src/components/status-indicator";
import { TEAMS } from "../src/config";
import { getAdminAccess } from "../src/server/has-admin-access";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });
//@ts-ignore
const LineChart = dynamic<Partial<LineChartProps>>(() => import('reaviz').then(module => module.LineChart), { ssr: false });
//@ts-ignore
const LineSeries = dynamic<Partial<LineSeriesProps>>(() => import('reaviz').then(module => module.LineSeries), { ssr: false });
//@ts-ignore
const Line = dynamic<Partial<LineProps>>(() => import('reaviz').then(module => module.Line), { ssr: false });
//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });


export const getServerSideProps: GetServerSideProps = async ({ query, req }): Promise<{ props: EntriesProps }> => {
    const from = query.from as string ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), DATE_FORMAT);
    const to = query.to as string ?? format(new Date(), DATE_FORMAT);
    const token = req.cookies[COOKIE_HARV_TOKEN_NAME] as string;
    const account = parseInt(req.cookies[COOKIE_HARV_ACCOUNTID_NAME] as string);
    const forecastAccount = parseInt(req.cookies[COOKIE_FORC_ACCOUNTID_NAME] as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                userName: null,
                persons: [],
            }
        }
    }
    const api = await getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
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
    const { dateRange, setDateRange } = useFilterContext();
    const entriesApi = useEntries();
    const currentStatsApi = useCurrentStats();
    const statsApi = useStats();
    const assignmentsApi = useAssignments();
    const hoursApi = useHours();
    const todaysOvertime = useMemo(() => {
        if (!currentStatsApi.totalHours || !statsApi.avgPerDay) {
            return 0;
        }
        return currentStatsApi.totalHours - statsApi.avgPerDay;
    }, [ currentStatsApi.totalHours, statsApi.avgPerDay ]);

    const totalOvertime = useMemo(() => {
        if (!statsApi.totalHours || !statsApi.totalPlannedHours) {
            return 0;
        }
        return statsApi.totalHours - statsApi.totalPlannedHours;
    }, [ statsApi.totalHours, statsApi.totalPlannedHours ]);

    const debounceLoad = debounce(() => {
        const from = format(dateRange[0] ?? new Date(), DATE_FORMAT)
        const to = format(dateRange[1] ?? new Date(), DATE_FORMAT)
        if (!userId) {
            return;
        }
        entriesApi.load(from, to, userId);
        statsApi.load(from, to, userId);
        assignmentsApi.load(from, to, userId);
        hoursApi.load(from, to, userId);
        currentStatsApi.load(userId);
    }, 200)

    useEffect(() => {
        debounceLoad();
    }, [ dateRange, userId ]);

    const amountOfDays = useMemo(() => differenceInBusinessDays(dateRange[1], dateRange[0]) + 1, [ dateRange ]);

    return <>
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
                    <Grid container spacing={ 10 }>
                        <Grid item xs={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Todays Hours</Typography>
                                    { currentStatsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !currentStatsApi.isLoading &&
                                        <Typography
                                            variant={ 'h2' }>
                                            { round(currentStatsApi.totalHours ?? 0, 1) }
                                            <Typography variant={ 'body2' } component={ 'span' }>
                                                of { round(currentStatsApi.totalPlannedHours ?? 0, 1) } planned hours
                                            </Typography>
                                        </Typography> }
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/wip.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </CardContent>
                                { !currentStatsApi.isLoading && <CardActions>
                                    Overtime: { round(todaysOvertime, 2) }
                                </CardActions> }
                            </Card>
                        </Grid>

                        <Grid item xs={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Total Hours</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography
                                            variant={ 'h2' }>{ round(statsApi.totalHours ?? 0, 1) }
                                            <Typography variant={ 'body2' } component={ 'span' }>
                                                of { round(statsApi.totalPlannedHours ?? 0, 1) } planned hours
                                            </Typography>
                                        </Typography> }
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </CardContent>
                                { !statsApi.isLoading && <CardActions>
                                    Overtime: { round(totalOvertime, 2) }
                                </CardActions> }
                            </Card>
                        </Grid>

                        <Grid item xs={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: 200
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Total Projects</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography
                                            variant={ 'h2' }>{ statsApi.totalProjects }
                                        </Typography>
                                    }
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: 200
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Total Billable hours</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography
                                            variant={ 'h2' }>
                                            { round(statsApi.billableHoursPercentage, 1) }%
                                        </Typography>
                                    }
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </CardContent>
                                { !statsApi.isLoading && <CardActions>
                                    <Typography
                                        variant={ 'caption' }>
                                        Billable/Non
                                        billable: { round(statsApi.billableHours, 1) }/{ round(statsApi.nonBillableHours, 1) }
                                    </Typography>
                                </CardActions> }
                            </Card>
                        </Grid>


                        <Grid item xs={ 12 } lg={ 12 }>
                            <Typography variant={ 'body1' }>Hours per day</Typography>
                            { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !statsApi.isLoading && <>
                                <LineChart
                                    height={ 300 }
                                    gridlines={ null }
                                    series={
                                        <LineSeries
                                            type="grouped"
                                            line={ <Line strokeWidth={ 4 }/> }
                                        />
                                    }
                                    data={ [
                                        {
                                            key: 'Planned Hours',
                                            data: statsApi.hoursPerDay.map((entry, index) => ({
                                                key: parse(entry.date, DATE_FORMAT, new Date()),
                                                id: entry.date,
                                                data: (statsApi.totalPlannedHours ?? 0) / amountOfDays
                                            }))
                                        },
                                        {
                                            key: 'Average Hours',
                                            data: statsApi.hoursPerDay.map((entry, index) => ({
                                                key: parse(entry.date, DATE_FORMAT, new Date()),
                                                id: entry.date,
                                                data: statsApi.avgPerDay ?? 0
                                            }))
                                        },
                                        {
                                            key: 'Tracked Hours',
                                            data: statsApi.hoursPerDay.map((entry, index) => ({
                                                key: parse(entry.date, DATE_FORMAT, new Date()),
                                                id: entry.date,
                                                data: entry.hours
                                            }))
                                        }
                                    ] }/>
                            </> }
                        </Grid>

                        <Grid item xs={ 12 } lg={ 6 }>
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

                        <Grid item xs={ 12 } lg={ 6 }>
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
                    </Grid>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Index;
