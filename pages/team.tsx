import { getHarvest } from "../src/server/get-harvest";
import { endOfWeek, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import {
    Autocomplete,
    Box,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel, MenuItem,
    Select,
    Stack, TextField,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import { Forecast, getForecast } from "../src/server/get-forecast";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import cookies from "js-cookie";
import { FilterContext, useFilterContext } from "../src/context/filter-context";
import { ContentHeader } from "../src/components/content-header";
import Image from "next/image";
import { useTeamStats } from "../src/hooks/use-team-stats";
import { TEAMS } from "../src/config";
import { useTeamHours } from "../src/hooks/use-team-hours";
import { useTeamEntries } from "../src/hooks/use-team-entries";
import dynamic from "next/dynamic";
import { round } from "lodash";
import { GridRenderCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { SpentProjectHours } from "../src/server/utils";
import { StatusIndicator } from "../src/components/status-indicator";
import { getAdminAccess } from "../src/server/has-admin-access";
import { HistoryLineChart } from "../src/components/chart/history-line-chart";
import { TeamHistoryLineChart } from "../src/components/chart/team-history-line-chart";
import { TeamStatsApiContext } from "../src/context/team-stats-api-context";

//@ts-ignore
const PieChart = dynamic(() => import('reaviz').then(module => module.PieChart), { ssr: false });
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


export const getServerSideProps: GetServerSideProps = async ({ query, req }) => {
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
                projects: [],
            }
        }
    }
    const api = await getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const allPeople = await forecast.getPersons();
    const projects = await forecast.getProjects();
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
    const hasAdminAccess = getAdminAccess(myDetails?.roles ?? []) ?? false;

    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const teamId = myTeamEntry!.key;

    return {
        props: {
            from,
            to,
            userName: userData.first_name,
            teamId,
            hasAdminAccess,
            projects,
        }
    }
}

export type EntriesProps = {
    from: string;
    to: string;
    userName?: string;
    teamId?: string;
    hasAdminAccess?: boolean;
    projects: Forecast.Project[]
}


export const Index = ({
                          userName,
                          from,
                          to,
                          teamId,
                          hasAdminAccess,
                          projects
                      }: EntriesProps) => {
    const router = useRouter();
    const { dateRange } = useFilterContext();
    const [ selectedProject, setSelectedProject ] = useState<null | { label: string, id: number | string }>(null);

    const teamStatsApi = useTeamStats();
    const teamHoursApi = useTeamHours();
    const teamEntriesApi = useTeamEntries();

    useEffect(() => {
        teamStatsApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT), selectedProject?.id as number);
        teamHoursApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT), selectedProject?.id as number);
        teamEntriesApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT), selectedProject?.id as number);
    }, [ dateRange, selectedProject ]);

    return <>
        <TeamStatsApiContext.Provider value={ teamStatsApi }>
            <Layout hasAdminAccess={ hasAdminAccess } active={ 'team' } userName={ userName }>
                <Box sx={ { flexGrow: 1, } }>
                    <Box p={ 4 }>
                        <ContentHeader title={ teamId ?? '' }>
                            <Autocomplete
                                options={ projects.map((p) => ({
                                    label: `${ p.code } - ${ p.name }`,
                                    id: p.harvest_id ?? p.id as number
                                })) }
                                sx={ { width: 300 } }
                                onChange={ (event, data) => setSelectedProject(data) }
                                renderInput={ (params) => <TextField { ...params } label="Project"/> }
                            />
                        </ContentHeader>

                        <Grid container spacing={ 10 }>
                            <Grid item xs={ 6 } xl={ 4 }>
                                <Card sx={ {
                                    position: 'relative',
                                    minHeight: 200
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Hours</Typography>
                                        { teamStatsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                        { !teamStatsApi.isLoading &&
                                            <Typography
                                                variant={ 'h2' }>{ round(teamStatsApi.totalHours ?? 0, 1) }</Typography>
                                        }
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/co-work.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid item xs={ 6 } xl={ 4 }>
                                <Card sx={ {
                                    minHeight: 200,
                                    position: 'relative'
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Projects</Typography>
                                        { teamStatsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                        { !teamStatsApi.isLoading &&
                                            <Typography variant={ 'h2' }>{ teamStatsApi.totalProjects }</Typography>
                                        }
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid item xs={ 6 } xl={ 4 }>
                                <Card sx={ {
                                    minHeight: 200,
                                    position: 'relative'
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Members</Typography>
                                        { teamStatsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                        { !teamStatsApi.isLoading &&
                                            <Typography variant={ 'h2' }>{ teamStatsApi.totalMembers }</Typography>
                                        }
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/team.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid item xs={ 12 }>
                                { !teamStatsApi.isLoading && <TeamHistoryLineChart/> }
                            </Grid>

                            <Grid item xs={ 12 } lg={ 6 }>
                                <Typography variant={ 'body1' }>Project Hours</Typography>
                                { teamHoursApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                { !teamHoursApi.isLoading &&
                                    <PieChart height={ 600 }
                                        series={ <PieArcSeries
                                            cornerRadius={ 4 }
                                            padAngle={ 0.02 }
                                            padRadius={ 200 }
                                            doughnut={ true }
                                        /> }
                                        data={ teamHoursApi.hours?.map((h, index) => ({
                                            id: index.toString(),
                                            key: h.projectName,
                                            data: h.hours,
                                        })) ?? [] }/>
                                }
                            </Grid>

                            <Grid item xs={ 12 } lg={ 6 }>
                                <Typography variant={ 'body1' }>Hours spent per task</Typography>
                                { teamStatsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                { !teamStatsApi.isLoading &&
                                    <PieChart height={ 600 }
                                        series={ <PieArcSeries
                                            cornerRadius={ 4 }
                                            padAngle={ 0.02 }
                                            padRadius={ 200 }
                                            doughnut={ true }
                                        /> }
                                        data={ (teamStatsApi.hoursPerTask ?? []).map((h) => ({
                                            key: h.task,
                                            data: h.hours ?? 0
                                        })) ?? [] }/>
                                }
                            </Grid>

                            <Grid item xs={ 12 } lg={ 6 }>
                                <Typography variant={ 'body1' }>Spent Hours</Typography>
                                { teamStatsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                { !teamStatsApi.isLoading &&
                                    <RadialAreaChart
                                        data={ teamStatsApi.hoursPerUser?.map((h, index) => ({
                                            id: index.toString(),
                                            key: h.user,
                                            data: h.hours,
                                        })) ?? [] }
                                        height={ 600 }
                                        series={ <RadialAreaSeries
                                            area={ <RadialArea gradient={ <RadialGradient/> }/> }
                                            interpolation={ 'linear' }/> }
                                        axis={ <RadialAxis
                                            // @ts-ignore
                                            type="category"/> }
                                    />
                                }
                            </Grid>

                            <Grid item xs={ 12 } lg={ 6 }>
                                <Typography variant={ 'body1' }>Planned Hours</Typography>
                                { teamStatsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                                { !teamStatsApi.isLoading &&
                                    <RadialAreaChart
                                        data={ teamStatsApi.plannedHoursPerUser?.map((h, index) => ({
                                            id: index.toString(),
                                            key: h.user,
                                            data: h.hours,
                                        })) ?? [] }
                                        height={ 600 }
                                        series={ <RadialAreaSeries
                                            area={ <RadialArea gradient={ <RadialGradient/> }/> }
                                            interpolation={ 'linear' }/> }
                                        axis={ <RadialAxis
                                            // @ts-ignore
                                            type="category"/> }
                                    />
                                }
                            </Grid>

                            <Grid item xs={ 12 }>
                                <Typography variant={ 'h5' }>Team Hours</Typography>
                                <DataGrid
                                    autoHeight
                                    loading={ teamEntriesApi.isLoading }
                                    rows={ teamEntriesApi.entries }
                                    rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                    columns={ [
                                        { field: 'userId', headerName: 'User ID', flex: 1 },
                                        { field: 'user', headerName: 'User', flex: 1 },
                                        { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                        { field: 'billable', headerName: 'Billable', flex: 1 },
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
                                <Typography variant={ 'h5' }>Team Projects</Typography>
                                <DataGrid
                                    autoHeight
                                    getRowId={ (r) => r.projectName }
                                    loading={ teamHoursApi.isLoading }
                                    rows={ teamHoursApi.hours ?? [] }
                                    rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                    columns={ [
                                        { field: 'projectId', headerName: 'Project ID', width: 90 },
                                        { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                        { field: 'hours', headerName: 'Hours', flex: 1 },
                                    ] }
                                    disableSelectionOnClick
                                    experimentalFeatures={ { newEditingApi: true } }/>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Layout>
        </TeamStatsApiContext.Provider>
    </>;
}
export default Index;
