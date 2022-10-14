import { getHarvest } from "../src/server/get-harvest";
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import { getForecast } from "../src/server/get-forecast";
import { round } from "lodash";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { useFilterContext } from "../src/context/filter-context";
import { useEffect } from "react";
import { ContentHeader } from "../src/components/content-header";
import { useEntries } from "../src/hooks/use-entries";
import { useStats } from "../src/hooks/use-stats";
import { useAssignments } from "../src/hooks/use-assignments";
import { useHours } from "../src/hooks/use-hours";
import dynamic from "next/dynamic";
import { PieChartProps } from "reaviz/dist/src/PieChart/PieChart";
import { BarSparklineChartProps } from "reaviz/dist/src/Sparkline/BarSparklineChart";
import { useCurrentStats } from "../src/hooks/use-current-stats";
import { GridlineSeriesProps } from "reaviz";
import { GridRenderCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { SpentProjectHours } from "../src/server/utils";
import { StatusIndicator } from "../src/components/status-indicator";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });
//@ts-ignore
const BarSparklineChart = dynamic<BarSparklineChartProps>(() => import('reaviz').then(module => module.BarSparklineChart), { ssr: false });
//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });
//@ts-ignore
const LinearGauge = dynamic(() => import('reaviz').then(module => module.LinearGauge), { ssr: false });
//@ts-ignore
const BarChart = dynamic<BarChartProps>(() => import('reaviz').then(module => module.BarChart), { ssr: false });
//@ts-ignore
const GridlineSeries = dynamic<GridlineSeriesProps>(() => import('reaviz').then(module => module.GridlineSeries), { ssr: false });
export const getServerSideProps: GetServerSideProps = async ({ query, req }): Promise<{ props: EntriesProps }> => {
    const from = query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.cookies[COOKIE_HARV_TOKEN_NAME] as string;
    const account = parseInt(req.cookies[COOKIE_HARV_ACCOUNTID_NAME] as string);
    const forecastAccount = parseInt(req.cookies[COOKIE_FORC_ACCOUNTID_NAME] as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                userName: null,
            }
        }
    }
    const api = await getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const allPeople = await forecast.getPersons();
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;

    return {
        props: {
            from,
            to,
            userName: userData.first_name,
            hasTeamAccess,
        }
    }
}


export type EntriesProps = {
    from: string;
    to: string;
    userName?: string | null;
    hasTeamAccess?: boolean;
}


export const Index = ({
                          userName,
                          from,
                          to,
                          hasTeamAccess,
                      }: EntriesProps) => {
    const { dateRange, setDateRange } = useFilterContext();
    const { entries, load } = useEntries();
    const currentStatsApi = useCurrentStats();
    const statsApi = useStats();
    const assignmentsApi = useAssignments();
    const hoursApi = useHours();

    useEffect(() => {
        const from = format(dateRange[0] ?? new Date(), DATE_FORMAT)
        const to = format(dateRange[1] ?? new Date(), DATE_FORMAT)
        load(from, to);
        statsApi.load(from, to);
        assignmentsApi.load(from, to);
        hoursApi.load(from, to);
        currentStatsApi.load();
    }, [ dateRange ]);

    return <>

        <Layout hasTeamAccess={ hasTeamAccess ?? false } userName={ userName ?? '' } active={ 'me' }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <ContentHeader title={ 'My Dashboard' }>
                        <Box sx={ { width: 280 } }>
                            <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                        </Box>
                    </ContentHeader>

                    <Grid container spacing={ 10 }>
                        <Grid item container spacing={ 10 }>
                            <Grid item xs={ 6 } xl={ 3 }>
                                <Card sx={ {
                                    position: 'relative',
                                    minHeight: '200px',
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Todays Hours</Typography>
                                        <Typography
                                            variant={ 'h2' }>
                                            { round(currentStatsApi.totalHours ?? 0, 1) }
                                            <Typography variant={ 'body2' } component={ 'span' }>
                                                of { round(currentStatsApi.totalPlannedHours ?? 0, 1) }
                                            </Typography>
                                        </Typography>
                                        <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                            <Image src={ '/illu/wip.svg' } width={ 128 } height={ 128 }/>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={ 6 } xl={ 3 }>
                                <Card sx={ {
                                    position: 'relative',
                                    minHeight: '200px',
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>My Hours</Typography>
                                        <Typography
                                            variant={ 'h2' }>{ round(statsApi.totalHours ?? 0, 1) }
                                            <Typography variant={ 'body2' } component={ 'span' }>
                                                avg { round(statsApi.avgPerDay ?? 0, 1) }h per day</Typography>
                                        </Typography>
                                        <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                            <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={ 6 } xl={ 3 }>
                                <Card sx={ {
                                    position: 'relative',
                                    minHeight: '200px',
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Planned Hours</Typography>
                                        <Typography
                                            variant={ 'h2' }>{ round(statsApi.totalPlannedHours ?? 0, 1) }</Typography>
                                        <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                            <Image src={ '/illu/time.svg' } width={ 128 } height={ 128 }/>
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
                                        <Typography variant={ 'body1' }>My Projects</Typography>
                                        <Typography variant={ 'h2' }>{ statsApi.totalProjects }</Typography>
                                        <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                            <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid item xs={ 12 } lg={ 6 }>
                            <Typography variant={ 'body1' }>Hours spent</Typography>
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
                                })) ?? [] }/>
                        </Grid>

                        <Grid item xs={ 12 } lg={ 6 }>
                            <Typography variant={ 'body1' }>Hours planned</Typography>
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
                        </Grid>

                        <Grid item xs={ 12 } lg={ 12 }>
                            <Typography variant={ 'body1' }>Hours per day</Typography>
                            <BarChart
                                height={ 300 }
                                // @ts-ignore
                                gridlines={ <GridlineSeries line={ null }/> }
                                data={ statsApi.hoursPerDay.map((entry) => ({
                                    key: entry.date,
                                    data: entry.hours
                                })) }/>
                        </Grid>

                        <Grid item lg={ 12 }>
                            <Typography mb={ 2 } variant={ 'h5' }>My Hours</Typography>

                            <DataGrid
                                autoHeight
                                rows={ entries }
                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                columns={ [
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

                        <Grid item lg={ 12 }>
                            <Typography mb={ 2 } variant={ 'h5' }>My Forcecast</Typography>

                            <DataGrid
                                autoHeight
                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                rows={ assignmentsApi.assignments ?? [] }
                                columns={ [
                                    {
                                        field: 'id',
                                        headerName: 'Project ID',
                                    },
                                    {
                                        field: 'name',
                                        headerName: 'Project Name',
                                        flex: 1,
                                    },
                                    {
                                        field: 'code',
                                        headerName: 'Project Code',
                                        flex: 1,
                                    },
                                    {
                                        field: 'days',
                                        headerName: 'Days',
                                    },
                                    {
                                        field: 'hoursPerDay',
                                        headerName: 'hoursPerDay',
                                    },
                                    {
                                        field: 'totalHours',
                                        headerName: 'totalHours',
                                    },
                                    {
                                        field: 'startDate',
                                        headerName: 'Start Date',
                                    },
                                    {
                                        field: 'endDate',
                                        headerName: 'End Date',
                                    },
                                ] }
                                disableSelectionOnClick
                                experimentalFeatures={ { newEditingApi: true } }
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Index;
