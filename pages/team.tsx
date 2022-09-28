import { getHarvest } from "../src/server/get-harvest";
import { endOfWeek, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import { getForecast } from "../src/server/get-forecast";
import { MyProjectsPie } from "../src/components/my-projects-pie";
import { HoursPerUserPie } from "../src/components/hours-per-users-pie";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import cookies from "js-cookie";
import { FilterContext } from "../src/context/filter-context";
import { ContentHeader } from "../src/components/content-header";
import Image from "next/image";
import { useTeamStats } from "../src/hooks/use-team-stats";
import { TEAMS } from "../src/config";
import { useTeamHours } from "../src/hooks/use-team-hours";
import { useTeamEntries } from "../src/hooks/use-team-entries";
import dynamic from "next/dynamic";

//@ts-ignore
const PieChart = dynamic(() => import('reaviz').then(module => module.PieChart), { ssr: false });

export const getServerSideProps: GetServerSideProps = async ({ query, req }) => {
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
            }
        }
    }
    const api = getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const allPeople = await forecast.getPersons();
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);

    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;
    const teamId = myTeamEntry!.key;

    return {
        props: {
            from,
            to,
            userName: userData.first_name,
            hasTeamAccess,
            teamId,
        }
    }
}

export type EntriesProps = {
    from: string;
    to: string;
    userName?: string;
    hasTeamAccess?: boolean;
    teamId?: string
}


export const Index = ({
                          userName,
                          from,
                          to,
                          hasTeamAccess,
                          teamId,
                      }: EntriesProps) => {
    const router = useRouter();
    const [ dateRange, setDateRange ] = useState<[ Date, Date ]>([ !!from ? parse(from, DATE_FORMAT, new Date()) : startOfWeek(new Date()), !!to ? parse(to, DATE_FORMAT, new Date()) : endOfWeek(new Date()) ]);
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [ forecastAccountId, setForecastAccountId ] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');

    const teamStatsApi = useTeamStats();
    const teamHoursApi = useTeamHours();
    const teamEntriesApi = useTeamEntries();

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [ harvestToken ])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [ harvestAccountId ]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId)
    }, [ forecastAccountId ])

    useEffect(() => {
        teamStatsApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        teamHoursApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        teamEntriesApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
    }, [ dateRange ]);

    return <>
        <FilterContext.Provider value={ {
            dateRange,
            setDateRange,
            harvestAccountId,
            setHarvestAccountId,
            forecastAccountId,
            setForecastAccountId,
            harvestToken,
            setHarvestToken,
        } }>
            <Layout active={ 'team' } hasTeamAccess={ hasTeamAccess } userName={ userName }>
                <Box sx={ { flexGrow: 1, } }>
                    <Box p={ 4 }>
                        <ContentHeader title={ teamId ?? '' }>
                            <Box sx={ { width: 280 } }>
                                <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                            </Box>
                        </ContentHeader>

                        <Grid container spacing={ 10 }>
                            <Grid item xs={ 4 }>
                                <Card sx={ {
                                    minHeight: 200,
                                    position: 'relative'
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Members</Typography>
                                        <Typography variant={ 'h2' }>{ teamStatsApi.totalMembers }</Typography>
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/team.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid item xs={ 4 }>
                                <Card sx={ {
                                    position: 'relative',
                                    minHeight: 200
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Hours</Typography>
                                        <Typography variant={ 'h2' }>{ teamStatsApi.totalHours }</Typography>
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/time.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>
                            <Grid item xs={ 4 }>
                                <Card sx={ {
                                    minHeight: 200,
                                    position: 'relative'
                                } }
                                >
                                    <CardContent>
                                        <Typography variant={ 'body1' }>Team Projects</Typography>
                                        <Typography variant={ 'h2' }>{ teamStatsApi.totalProjects }</Typography>
                                    </CardContent>
                                    <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                        <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                    </Box>
                                </Card>
                            </Grid>

                            <Grid container spacing={ 10 } item xs={ 12 }>
                                <Grid item xs={ 12 } md={ 8 }>
                                    <Stack spacing={ 10 }>
                                        <Card>
                                            <CardContent>
                                                <Typography variant={ 'h5' }>Team Projects</Typography>
                                                <DataGrid
                                                    autoHeight
                                                    getRowId={ (r) => r.projectName }
                                                    rows={ teamHoursApi.hours ?? [] }
                                                    rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                                    columns={ [
                                                        { field: 'projectId', headerName: 'Project ID', width: 90 },
                                                        { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                                        { field: 'hours', headerName: 'Hours', flex: 1 },
                                                    ] }
                                                    disableSelectionOnClick
                                                    experimentalFeatures={ { newEditingApi: true } }/>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardContent>
                                                <Typography variant={ 'h5' }>Team Hours</Typography>
                                                <DataGrid
                                                    autoHeight
                                                    rows={ teamEntriesApi.entries }
                                                    rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                                    columns={ [
                                                        { field: 'user', headerName: 'User', flex: 1 },
                                                        { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                                        { field: 'hours', headerName: 'Hours', flex: 1 },
                                                        { field: 'hours_forecast', headerName: 'Forecast', flex: 1 },
                                                    ] }
                                                    disableSelectionOnClick
                                                    experimentalFeatures={ { newEditingApi: true } }/>
                                            </CardContent>
                                        </Card>
                                    </Stack>
                                </Grid>
                                <Grid item xs={ 12 } md={ 4 }>
                                    <Box sx={ { position: 'sticky', top: 10 } }>
                                        <PieChart height={400} data={ teamHoursApi.hours?.map((h) => ({
                                            key: h.projectName,
                                            data: h.hours,
                                        })) ?? [] }/>

                                        <PieChart height={400} data={ teamStatsApi.hoursPerUser?.map((h) => ({
                                            key: h.user,
                                            data: h.hours,
                                        })) ?? [] }/>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Layout>
        </FilterContext.Provider>
    </>;
}
export default Index;
