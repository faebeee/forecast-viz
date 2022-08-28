import { getHarvest } from "../src/server/get-harvest";
import { Project, TimeEntry } from "../src/server/harvest-types";
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { NextApiRequest, NextApiResponse } from "next";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT } from "../src/components/date-range-widget";
import {
    getHoursPerUser,
    getProjectsFromEntries,
    getTeamHoursEntries,
    getTeamProjectHours,
    MyEntries,
    SpentProjectHours
} from "../src/server/utils";
import { getForecast } from "../src/server/get-forecast";
import { MyProjectsPie } from "../src/components/my-projects-pie";
import { HoursPerUserPie } from "../src/components/hours-per-users-pie";
import { Layout } from "../src/components/layout";

type TeamEntry = {
    userId: number;
    userName: string;
    projectName: string;
    projectId: number;
    hours: number
}


export const getServerSideProps = async (req: NextApiRequest, res: NextApiResponse): Promise<{ props: EntriesProps }> => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.query.token as string;
    const teamId = !!req.query.team ? req.query.team as string : null;
    const account = parseInt(req.query.account as string);
    const forecastAccount = parseInt(req.query.faccount as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                teamEntries: [],
                roles: [],
                teamProjectHours: [],
                teamProjectHourEntries: [],
                totalTeamMembers: null,
                teamAmountOfProjects: 0,
                totalTeamHours: null,
                teamProjects: [],
                hoursPerUser: [],
            }
        }
    }
    const api = getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const allPeople = await forecast.getPersons();
    // @ts-ignore
    const isMemberOfTeam = !!teamId ? allPeople
        .find(p => p.harvest_user_id === userId)?.roles?.includes(teamId) : false;
    const teamPeople = isMemberOfTeam ? allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
        .map(p => p.harvest_user_id) : [];

    const assignments = await forecast.getAssignments(from, to);
    // const roles = await api.getRoles();

    const teamEntries = await api.getTimeEntriesForUsers(teamPeople, { from, to });

    const allTeamProjects = getProjectsFromEntries(teamEntries);
    const teamProjectHours = getTeamProjectHours(teamEntries);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);
    const hoursPerUser = getHoursPerUser(teamEntries);
    const totalTeamHours = Object.values(teamProjectHours).reduce((acc, entry) => {
        return acc + entry.hours;
    }, 0);

    return {
        props: {
            from,
            to,
            teamEntries,
            hoursPerUser,
            teamProjectHours: Object.values(teamProjectHours),
            totalTeamMembers: teamPeople.length ?? null,
            teamAmountOfProjects: 0,
            totalTeamHours,
            teamProjectHourEntries,
            teamProjects: allTeamProjects,
        }
    }
}

export type EntriesProps = {
    teamEntries: TimeEntry[];
    from: string;
    to: string;
    teamProjectHours: SpentProjectHours[];
    teamAmountOfProjects: number;
    teamProjectHourEntries: SpentProjectHours[];
    totalTeamMembers: number | null;
    totalTeamHours: number | null;
    teamProjects: Project[];
    hoursPerUser: { user: string, hours: number }[]
    roles?: { key: string, name: string }[]
}


export const Index = ({
                          teamProjectHours,
                          teamProjectHourEntries,
                          totalTeamMembers,
                          totalTeamHours,
                          teamProjects,
                          hoursPerUser,
                      }: EntriesProps) => {
    return <>
        <Layout sub={ '/team' }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <Grid container spacing={ 4 }>
                        <Grid item xs={ 4 }>
                            <Card>
                                <CardContent>
                                    <Typography variant={ 'h5' }>Team Members</Typography>
                                    <Typography variant={ 'body1' }>{ totalTeamMembers }</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={ 4 }>
                            <Card>
                                <CardContent>
                                    <Typography variant={ 'h5' }>Team Hours</Typography>
                                    <Typography variant={ 'body1' }>{ totalTeamHours }</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={ 4 }>
                            <Card>
                                <CardContent>
                                    <Typography variant={ 'h5' }>Team Projects</Typography>
                                    <Typography variant={ 'body1' }>{ teamProjects.length }</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid container spacing={ 2 } item xs={ 12 }>
                            <Grid item xs={ 12 } md={ 8 }>
                                <Card>
                                    <CardContent>
                                        <Typography variant={ 'h5' }>Team Projects</Typography>
                                        <DataGrid
                                            autoHeight
                                            getRowId={ (r) => r.projectName }
                                            rows={ teamProjectHours }
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
                            </Grid>
                            <Grid item xs={ 12 } md={ 4 }>
                                <Box sx={ { position: 'sticky', top: 10 } }>
                                    <MyProjectsPie entries={ teamProjectHours }/>
                                    <HoursPerUserPie entries={ hoursPerUser }/>
                                </Box>
                            </Grid>
                            <Grid item xs={ 12 } md={ 12 }>
                                <Card>
                                    <CardContent>
                                        <Typography variant={ 'h5' }>Team Hours</Typography>
                                        <DataGrid
                                            autoHeight
                                            rows={ teamProjectHourEntries }
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
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Layout>
    </>;
}
export default Index;
