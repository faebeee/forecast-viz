import { format, startOfWeek } from 'date-fns';
import { Box, Card, CardActions, CardContent, CircularProgress, Grid, Typography } from "@mui/material";
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import { round } from "lodash";
import { Layout } from "../src/components/layout";
import { useFilterContext } from "../src/context/filter-context";
import { useEffect } from "react";
import { ContentHeader } from "../src/components/content-header";
import dynamic from "next/dynamic";
import { PieChartProps } from "reaviz/dist/src/PieChart/PieChart";
import { useCompanyTeamsStats } from "../src/hooks/use-company-team-stats";
import mixpanel from "mixpanel-browser";
import {DATE_FORMAT} from "../src/context/formats";
import {useRouter} from "next/router";
import {useCompanyStats, useMe} from "../src/hooks/use-remote";

//@ts-ignore
const PieChart = dynamic<PieChartProps>(() => import('reaviz').then(module => module.PieChart), { ssr: false });
//@ts-ignore
const PieArcSeries = dynamic(() => import('reaviz').then(module => module.PieArcSeries), { ssr: false });


export const Company = () => {
    const { dateRange } = useFilterContext();
    const apiParams = {
        from: format(dateRange[0] ?? new Date(), DATE_FORMAT),
        to: format(dateRange[1] ?? new Date(), DATE_FORMAT)
    }

    const statsApi = useCompanyStats(apiParams);

    const teamsStats = useCompanyTeamsStats();
    const router = useRouter()
    const me  = useMe()

    useEffect(() => {
        teamsStats.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        const from = router.query.from as string ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), DATE_FORMAT);
        const to = router.query.to as string ?? format(new Date(), DATE_FORMAT);

        if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
            mixpanel.track('filter', {
                'page': "company",
                range: { from, to },
            });
        }
    }, [ dateRange ])

    return <>
        <Layout hasAdminAccess={ me.data?.hasAdminAccess } userName={ me.data?.userName ?? '' } active={ 'company' }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <ContentHeader title={ 'Company Dashboard' }>
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
                        <Grid item lg={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Hours</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography
                                            variant={ 'h2' }>{ round(statsApi.data?.totalHours ?? 0, 2) }</Typography>
                                    }
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/work-team.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item lg={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: 200
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Team Billable Hours</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading && statsApi.data?.hours &&
                                        <Typography
                                            variant={ 'h2' }>{ round(100 / (statsApi.data?.hours.billable + statsApi.data?.hours.nonBillable) * statsApi.data?.hours.billable, 1) }%</Typography>
                                    }
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/team-work.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                                { !statsApi.isLoading && statsApi.data?.hours && <CardActions>
                                    Billable/Non
                                    Billable: { round(statsApi.data?.hours.billable, 1) }/{ round(statsApi.data?.hours.nonBillable, 1) }
                                </CardActions> }
                            </Card>
                        </Grid>

                        <Grid item lg={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Members</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography variant={ 'h2' }>{ statsApi.data?.totalMembers }</Typography>
                                    }
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/team-work.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item lg={ 6 } xl={ 3 }>
                            <Card sx={ {
                                position: 'relative',
                                minHeight: '200px',
                            } }
                            >
                                <CardContent>
                                    <Typography variant={ 'body1' }>Company Projects</Typography>
                                    { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
                                    { !statsApi.isLoading &&
                                        <Typography variant={ 'h2' }>{ statsApi.data?.totalProjects }</Typography>
                                    }
                                </CardContent>
                                <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                    <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={ 12 } lg={ 4 }>
                            <Typography variant={ 'body1' }>Hours per project</Typography>
                            { statsApi.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !statsApi.isLoading &&
                                <PieChart height={ 600 }
                                    series={ <PieArcSeries
                                        cornerRadius={ 4 }
                                        padAngle={ 0.02 }
                                        padRadius={ 200 }
                                        doughnut={ true }
                                    /> }
                                    data={ (statsApi.data?.hoursPerProject ?? []).map((h) => ({
                                        key: h.name,
                                        data: h.hours
                                    })) ?? [] }/>
                            }
                        </Grid>


                        <Grid item xs={ 12 } lg={ 4 }>
                            <Typography variant={ 'body1' }>Hours per roles</Typography>
                            { teamsStats.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !teamsStats.isLoading &&
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
                            }
                        </Grid>

                        <Grid item xs={ 12 } lg={ 4 }>
                            <Typography variant={ 'body1' }>Hours per team</Typography>
                            { teamsStats.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !teamsStats.isLoading &&
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
                            }
                        </Grid>

                        <Grid item xs={ 12 } lg={ 4 }>
                            <Typography variant={ 'body1' }>Members per role</Typography>
                            { teamsStats.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !teamsStats.isLoading &&
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
                            }
                        </Grid>

                        <Grid item xs={ 12 } lg={ 4 }>
                            <Typography variant={ 'body1' }>Members per team</Typography>
                            { teamsStats.isLoading && <CircularProgress color={ 'primary' }/> }
                            { !teamsStats.isLoading &&
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
                            }
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Company;
