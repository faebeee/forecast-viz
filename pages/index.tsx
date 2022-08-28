import { getHarvest } from "../src/server/get-harvest";
import { Project, TimeEntry } from "../src/server/harvest-types";
import { useCallback, useEffect, useState } from "react";
import cookies from 'js-cookie';
import { useRouter } from "next/router";
import { differenceInDays, endOfWeek, format, startOfWeek } from 'date-fns';
import { NextApiRequest, NextApiResponse } from "next";
import {
    Box,
    Button,
    Card, CardActions,
    CardContent,
    Container, Drawer,
    FormControl,
    Grid,
    InputLabel, Link,
    MenuItem,
    Select, Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import {
    findAssignment,
    getProjectsFromEntries,
    getTeamHours,
    getTeamHoursEntries,
    getTeamProjectHours
} from "../src/server/utils";
import { getForecast } from "../src/server/get-forecast";
import { StatsRow } from "../src/components/stats-row";
import { Settings } from "../src/components/settings";
import { MyProjectsPie } from "../src/components/my-projects-pie";
import { get } from "lodash";

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
                entries: [],
                teamEntries: [],
                projectHoursSpent: [],
                teamProjectHours: [],
                teamProjectHourEntries: [],
                totalTeamMembers: null,
                teamAmountOfProjects: 0,
                totalHours: 0,
                totalTeamHours: null,
                teamProjects: [],
                myProjects: [],
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

    const entries = await api.getTimeEntries({ userId: userId, from, to });
    const teamEntries = await api.getTimeEntriesForUsers(teamPeople, { from, to });

    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(entries);
    const myEntries:MyEntries[] = entries.map((e) => {
        return {
            id: e.id,
            projectId: e.project.id,
            projectName: e.project.name,
            projectCode: e.project.code,
            hours: e.hours,
            notes: e.notes,
        }
    });
    const allTeamProjects = getProjectsFromEntries(teamEntries);
    const teamProjectHours = getTeamProjectHours(teamEntries);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);
    const totalTeamHours = Object.values(teamProjectHours).reduce((acc, entry) => {
        return acc + entry.hours;
    }, 0);

    const projectHoursSpent = entries.reduce((acc, entry) => {
        const projectName = !!entry.project.code ? entry.project.code : entry.project.name;
        const projectId = entry.project.id;
        const _assignments = findAssignment(assignments, entry.project.id, entry.user.id);
        const assignmentHours = _assignments.reduce((acc, assignment) => {
            const days = (!!assignment?.start_date && !!assignment?.end_date) ? differenceInDays(new Date(assignment?.end_date), new Date(assignment?.start_date)) : 0;
            return acc + (days + 1) * (assignment?.allocation / 60 / 60)
        }, 0)
        if (!acc[projectId]) {
            acc[projectId] = {
                id: entry.user.id,
                projectId,
                user: entry.user.name,
                projectName,
                hours: 0,
                hours_forecast: assignmentHours,
            }
        }


        acc[projectId].hours += entry.hours;

        return acc;
    }, {} as Record<string, SpentProjectHours>);

    return {
        props: {
            projectHoursSpent: Object.values(projectHoursSpent),
            from,
            to,
            entries: myEntries,
            teamEntries,
            myProjects,
            totalHours,
            teamProjectHours: Object.values(teamProjectHours),
            totalTeamMembers: teamPeople.length ?? null,
            teamAmountOfProjects: 0,
            totalTeamHours,
            teamProjectHourEntries,
            teamProjects: allTeamProjects,
        }
    }
}

export type MyEntries = {
    id: number,
    projectId: number,
    projectCode: string,
    hours: number,
    notes: any,
}

export type SpentProjectHours = {
    id: string | number,
    projectId: number,
    user: string,
    notes?: any,
    projectName: string,
    hours: number,
    hours_forecast: number
}

export type EntriesProps = {
    teamEntries: TimeEntry[];
    entries: MyEntries[];
    myProjects: Project[];
    from: string;
    to: string;
    totalHours: number;
    projectHoursSpent: SpentProjectHours[];
    teamProjectHours: SpentProjectHours[];
    teamAmountOfProjects: number;
    teamProjectHourEntries: SpentProjectHours[];
    totalTeamMembers: number | null;
    totalTeamHours: number | null;
    teamProjects: Project[];
}

const drawerWidth = 340;


export const Index = ({
                          projectHoursSpent,
                          teamProjectHours,
                          teamProjectHourEntries,
                          totalTeamMembers,
                          totalTeamHours,
                          teamProjects,
                          totalHours,
                          myProjects,
                          entries,
                      }: EntriesProps) => {
    return <>
        <Box sx={ { display: 'flex' } }>
            <Box sx={ { flexGrow: 1, } }>
                <Box p={ 4 }>
                    <Grid container spacing={ 4 }>
                        <StatsRow totalHours={ totalHours } totalProjects={ myProjects.length }
                            totalTeamHours={ totalTeamHours ?? 0 }
                            teamProjects={ teamProjects.length }
                            totalTeamMembers={ totalTeamMembers ?? 0 }/>
                        <Grid container spacing={ 2 } item xs={ 12 }>
                            <Grid item xs={ 12 }>
                                <Card>
                                    <CardContent>
                                        <Typography variant={ 'h5' }>My Entries</Typography>

                                        <DataGrid
                                            autoHeight
                                            rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                            rows={ entries }
                                            columns={ [
                                                {
                                                    field: 'projectId',
                                                    headerName: 'Project ID',
                                                    width: 90,
                                                    renderCell: ({ row, field }) => get(row, field)
                                                },
                                                {
                                                    field: 'projectCode',
                                                    headerName: 'Project Code',
                                                    width: 90,
                                                    renderCell: ({ row, field }) => get(row, field)
                                                },
                                                {
                                                    field: 'projectName',
                                                    headerName: 'Project Name',
                                                    flex: 1,
                                                    renderCell: ({ row, field }) => get(row, field)
                                                },
                                                { field: 'notes', headerName: 'Notes', flex: 1 },
                                                { field: 'hours', headerName: 'Hours', flex: 1 },
                                            ] }
                                            disableSelectionOnClick
                                            experimentalFeatures={ { newEditingApi: true } }
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={ 12 } md={ 8 }>
                                <Card>
                                    <CardContent>
                                        <Typography variant={ 'h5' }>My Hours</Typography>

                                        <DataGrid
                                            autoHeight
                                            getRowId={ (r) => r.projectId }
                                            rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                            rows={ projectHoursSpent }
                                            columns={ [
                                                { field: 'projectId', headerName: 'Project ID', width: 90 },
                                                { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                                { field: 'notes', headerName: 'Notes', flex: 1 },
                                                { field: 'hours', headerName: 'Hours', flex: 1 },
                                                { field: 'hours_forecast', headerName: 'Forecast', flex: 1 },
                                            ] }
                                            disableSelectionOnClick
                                            experimentalFeatures={ { newEditingApi: true } }
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={ 12 } md={ 4 }>
                                <Box sx={ { position: 'sticky', top: 10 } }>
                                    <MyProjectsPie entries={ projectHoursSpent }/>
                                </Box>
                            </Grid>
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
            <Drawer
                open
                anchor={ 'right' }
                variant={ 'permanent' }
                PaperProps={ {
                    sx: { width: drawerWidth }
                } }
                sx={ {
                    width: drawerWidth,
                    flexShrink: 0,
                } }>
                <Settings/>
            </Drawer>
        </Box>
    </>;
}
export default Index;
