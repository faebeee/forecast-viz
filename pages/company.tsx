import { getHarvest } from "../src/server/get-harvest";
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
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
import dynamic from "next/dynamic";
import { PieChartProps } from "reaviz/dist/src/PieChart/PieChart";
import { useCompanyStats } from "../src/hooks/use-company-stats";
import { useCompanyHours } from "../src/hooks/use-company-hours";
import { GridlineSeriesProps } from "reaviz";
import { useCompanyTeamsStats } from "../src/hooks/use-company-team-stats";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });
//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });
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
    const statsApi = useCompanyStats();
    const teamsStats = useCompanyTeamsStats();

    useEffect(() => {
        statsApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT))
            .then(() => {
                return teamsStats.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
            });
    })

    return <>
        <Layout hasTeamAccess={ hasTeamAccess ?? false } userName={ userName ?? '' } active={ 'company' }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <ContentHeader title={ 'Company Dashboard' }>
                        <Box sx={ { width: 280 } }>
                            <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                        </Box>
                    </ContentHeader>

                    <Box pb={ 5 }>
                        <Typography variant={ 'caption' }>
                            This dashboard consumes a lot of data from the API. Therefore you might reach the
                            API
                            limit
                            of req/sec.
                            So be patient and retry you luck in 15mins.
                        </Typography>
                    </Box>

                    <Grid container spacing={ 10 }>
                        <Grid item xs={ 12 } md={ 4 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Members</Typography>
                                    <Typography variant={ 'h2' }>{ statsApi.totalMembers }</Typography>
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/team-work.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={ 12 } md={ 4 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Projects</Typography>
                                    <Typography variant={ 'h2' }>{ statsApi.totalProjects }</Typography>
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={ 12 } md={ 4 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Hours</Typography>
                                    <Typography
                                        variant={ 'h2' }>{ round(statsApi.totalHours ?? 0, 2) }</Typography>
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/work-team.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item lg={ 12 } xl={ 4 }>
                            <Typography variant={ 'body1' }>Hours per project</Typography>
                            <PieChart height={ 600 }
                                series={ <PieArcSeries
                                    cornerRadius={ 4 }
                                    padAngle={ 0.02 }
                                    padRadius={ 200 }
                                    doughnut={ true }
                                /> }
                                data={ (statsApi.hoursPerProject ?? []).map((h) => ({
                                    key: h.name,
                                    data: h.hours
                                })) ?? [] }/>
                        </Grid>


                        <Grid item lg={ 12 } xl={ 4 }>
                            <Typography variant={ 'body1' }>Hours per roles</Typography>
                            <PieChart height={ 600 }
                                series={ <PieArcSeries
                                    cornerRadius={ 4 }
                                    padAngle={ 0.02 }
                                    padRadius={ 200 }
                                    doughnut={ true }
                                /> }
                                data={ (teamsStats.roleStats ?? []).map((h) => ({
                                    key: h.name,
                                    data: h.hours
                                })) ?? [] }/>
                        </Grid>

                        <Grid item lg={ 12 } xl={ 4 }>
                            <Typography variant={ 'body1' }>Hours per team</Typography>
                            <PieChart height={ 600 }
                                series={ <PieArcSeries
                                    cornerRadius={ 4 }
                                    padAngle={ 0.02 }
                                    padRadius={ 200 }
                                    doughnut={ true }
                                /> }
                                data={ (teamsStats.teamStats ?? []).map((h) => ({
                                    key: h.name,
                                    data: h.hours
                                })) ?? [] }/>
                        </Grid>

                        <Grid item lg={ 12 } xl={ 6 }>
                            <Typography variant={ 'body1' }>Members per role</Typography>
                            <PieChart height={ 600 }
                                series={ <PieArcSeries
                                    cornerRadius={ 4 }
                                    padAngle={ 0.02 }
                                    padRadius={ 200 }
                                    doughnut={ true }
                                /> }
                                data={ (teamsStats.roleStats ?? []).map((h) => ({
                                    key: h.name,
                                    data: h.members
                                })) ?? [] }/>
                        </Grid>
                        
                        <Grid item lg={ 12 } xl={ 6 }>
                            <Typography variant={ 'body1' }>Members per team</Typography>
                            <PieChart height={ 600 }
                                series={ <PieArcSeries
                                    cornerRadius={ 4 }
                                    padAngle={ 0.02 }
                                    padRadius={ 200 }
                                    doughnut={ true }
                                /> }
                                data={ (teamsStats.teamStats ?? []).map((h) => ({
                                    key: h.name,
                                    data: h.members
                                })) ?? [] }/>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Index;
