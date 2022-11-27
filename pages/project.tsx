import { getHarvest } from "../src/server/get-harvest";
import { format, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import {
    Autocomplete,
    Box,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { Forecast, getForecast } from "../src/server/get-forecast";
import { debounce, round } from "lodash";
import { Layout } from "../src/components/layout";
import { useFilterContext } from "../src/context/filter-context";
import { useEffect, useState } from "react";
import { ContentHeader } from "../src/components/content-header";
import dynamic from "next/dynamic";
import { PieChartProps } from "reaviz/dist/src/PieChart/PieChart";
import { GridRenderCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { SpentProjectHours } from "../src/server/utils";
import { StatusIndicator } from "../src/components/status-indicator";
import { TEAMS } from "../src/config";
import { BillableHoursStats } from "../src/components/stats/billable-hours-stats";
import { SpentPlannedStats } from "../src/components/stats/spent-planned-stats";
import mixpanel from "mixpanel-browser";
import { DATE_FORMAT } from "../src/context/formats";
import { withServerSideSession } from "../src/server/with-session";
import {
    useAssignments,
    useEntries,
    useEntriesDetailed,
    useHours,
    useProjects, useStats
} from "../src/hooks/use-remote";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });

//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });


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
        const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
        const teamId = myTeamEntry!.key;
        const teamPeople = allPeople
            .filter((p) => p.roles.includes(teamId!) && !p.archived)


        return {
            props: {
                from,
                to,
                persons: teamPeople,
                userName: req.session.userName,
                hasAdminAccess: req.session.hasAdminAccess ?? false,
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


export const Project = ({
                            userName,
                            hasAdminAccess,
                            persons,
                        }: EntriesProps) => {
    const [ userId, setUID ] = useState('');
    const { dateRange } = useFilterContext();
    const from = format(dateRange[0] ?? new Date(), DATE_FORMAT)
    const to = format(dateRange[1] ?? new Date(), DATE_FORMAT)
    const [ selectedProject, setSelectedProject ] = useState<null | { label: string, id: number | string }>(null);

    const apiParams  = {
        from, to, uid: userId, projectId: selectedProject?.id.toString()
    }

    const statsApi = useStats(apiParams);
    const entriesApi = useEntries(apiParams);
    const assignmentsApi = useAssignments(apiParams);
    const detailedEntriesApi = useEntriesDetailed(apiParams);
    const hoursApi = useHours(apiParams);
    const projectsApi = useProjects(apiParams, {projects: []});


    const debounceLoad = debounce(() => {
        if (!userId || !selectedProject?.id) {
            return;
        }
        if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
            mixpanel.track('filter', {
                'page': "project",
                project: selectedProject?.label,
                range: { from, to },
            });
        }
    }, 200)

    useEffect(() => {
        debounceLoad();
    }, [ dateRange, userId, selectedProject ]);

    return <>
        <Layout hasAdminAccess={ hasAdminAccess } userName={ userName ?? '' } active={ 'project' }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <ContentHeader title={ 'Dashboard' }>
                        { hasAdminAccess &&
                            <FormControl sx={ { width: 280, mr: 1 } }>
                                <InputLabel>Select User</InputLabel>
                                <Select label={ 'Select User' } value={ userId }
                                    onChange={ (e) => setUID(e.target.value) }>
                                    { persons.map((p) => (
                                        <MenuItem key={ p.id }
                                            value={ p.harvest_user_id }>{ p.first_name } { p.last_name }</MenuItem>)) }
                                </Select>
                            </FormControl>
                        }
                        <Autocomplete
                            options={ projectsApi.data?.projects.map((p) => ({
                                label: `${ p.code } - ${ p.name }`,
                                id: p.harvest_id ?? p.id as number
                            })) ?? [] }
                            sx={ { width: 300 } }
                            onChange={ (event, data) => setSelectedProject(data) }
                            renderInput={ (params) => <TextField { ...params } label="Project"/> }
                        />
                    </ContentHeader>
                    { userId && <Grid container spacing={ 10 }>

                        <Grid item xs={ 6 } xl={ 6 }>
                            <SpentPlannedStats { ...apiParams } />

                        </Grid>

                        <Grid item xs={ 6 } xl={ 6 }>
                            <BillableHoursStats { ...apiParams } />
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
                                    data={ (hoursApi.data ?? []).map((h) => ({
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
                                    data={ (statsApi.data?.hoursPerTask ?? []).map((h) => ({
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
                                    data={ (assignmentsApi.data?.assignments ?? []).map((h) => ({
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
                                rows={ entriesApi.data?.entries ?? [] }
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
                                disableSelectionOnClick/>
                        </Grid>

                        <Grid item xs={ 12 }>
                            <Typography mb={ 2 } variant={ 'h5' }>Entries</Typography>

                            <DataGrid
                                autoHeight
                                loading={ detailedEntriesApi.isLoading }
                                rows={ detailedEntriesApi.data ?? [] }
                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                columns={ [
                                    { field: 'spent', headerName: 'Date', flex: 1 },
                                    { field: 'task', headerName: 'Task', flex: 1 },
                                    { field: 'notes', headerName: 'Notes', flex: 1 },
                                    { field: 'billable', headerName: 'Billable', flex: 1 },
                                    { field: 'hours', headerName: 'Hours', flex: 1 },

                                ] }
                                disableSelectionOnClick/>
                        </Grid>
                    </Grid> }
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Project;
