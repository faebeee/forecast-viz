import { getHarvest } from "../src/server/get-harvest";
import { Project } from "../src/server/harvest-types";
import { differenceInDays, endOfWeek, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import { findAssignment, getProjectsFromEntries, MyEntries, SpentProjectHours } from "../src/server/utils";
import { getForecast } from "../src/server/get-forecast";
import { MyProjectsPie } from "../src/components/my-projects-pie";
import { get } from "lodash";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { HoursPerDay, HoursPerDayCollectionItem } from "../src/type";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS } from "../src/config";
import { FilterContext } from "../src/context/filter-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import cookies from "js-cookie";
import qs from "qs";
import { useRouter } from "next/router";
import { ContentHeader } from "../src/components/content-header";

type TeamEntry = {
    userId: number;
    userName: string;
    projectName: string;
    projectId: number;
    hours: number
}


export const getServerSideProps: GetServerSideProps = async ({ query, req }): Promise<{ props: EntriesProps }> => {
    const from = query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.cookies[COOKIE_HARV_TOKEN_NAME] as string;
    const account = parseInt(req.cookies[COOKIE_HARV_ACCOUNTID_NAME] as string);
    const forecastAccount = parseInt(req.cookies[COOKIE_FORC_ACCOUNTID_NAME] as string);
    const teamId = !!query.team ? query.team as string : null;

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                entries: [],
                roles: [],
                selectedTeamId: teamId,
                projectHoursSpent: [],
                totalHours: 0,
                billableTotalHours: 0,
                myProjects: [],
                listOfProjectNames: [],
                hoursPerDay: [],
                userName: null,
            }
        }
    }
    const api = getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const assignments = await forecast.getAssignments(from, to);
    const allPeople = await forecast.getPersons();
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
    const entries = await api.getTimeEntries({ userId: userId, from, to });
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const billableTotalHours = entries.filter(e => e.billable).reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(entries);
    const myEntries: MyEntries[] = entries.map((e) => {
        return {
            id: e.id,
            projectId: e.project.id,
            projectName: e.project.name,
            projectCode: e.project.code,
            billable: e.billable,
            hours: e.hours,
            notes: e.notes,
            isRunning: e.is_running,
            date: e.spent_date,
        }
    });

    const listOfProjectNames = entries.reduce((acc, entry) => {
        if (!acc.includes(entry.project.name)) {
            acc.push(entry.project.name);
        }
        return acc;
    }, [] as string[]);
    const hoursPerDay = entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = {};
        }
        if (!acc[entry.spent_date][entry.project.name]) {
            acc[entry.spent_date][entry.project.name] = 0;
        }

        acc[entry.spent_date][entry.project.name] += entry.hours;
        return acc;
    }, {} as HoursPerDay)

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
                billable: entry.billable,
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
            myProjects,
            totalHours,
            selectedTeamId: teamId,
            billableTotalHours,
            userName: userData.first_name,
            listOfProjectNames,
            hasTeamAccess,
            hoursPerDay: Object.entries(hoursPerDay).map(([ key, value ]) => {
                return {
                    date: key,
                    ...value
                }
            }).reverse() as HoursPerDayCollectionItem[],
        }
    }
}


export type EntriesProps = {
    entries: MyEntries[];
    myProjects: Project[];
    from: string;
    to: string;
    selectedTeamId?: string | null;
    userName?: string | null;
    totalHours: number;
    billableTotalHours: number;
    projectHoursSpent: SpentProjectHours[];
    roles?: { key: string, name: string }[];
    hoursPerDay: HoursPerDayCollectionItem[],
    listOfProjectNames: string[];
    hasTeamAccess?: boolean
}


export const Index = ({
                          projectHoursSpent,
                          totalHours,
                          billableTotalHours,
                          myProjects,
                          entries,
                          userName,
                          hoursPerDay,
                          listOfProjectNames,
                          selectedTeamId,
                          from,
                          to,
                          hasTeamAccess,
                      }: EntriesProps) => {
    const router = useRouter();
    const [ teamId, setTeamId ] = useState<string>(selectedTeamId ?? '');
    const [ dateRange, setDateRange ] = useState<[ Date, Date ]>([ !!from ? parse(from, DATE_FORMAT, new Date()) : startOfWeek(new Date()), !!to ? parse(to, DATE_FORMAT, new Date()) : endOfWeek(new Date()) ]);
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [ forecastAccountId, setForecastAccountId ] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [ harvestToken ])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [ harvestAccountId ]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId)
    }, [ forecastAccountId ])

    const query = useMemo(() => qs.stringify({
        from: format(dateRange[0] ?? new Date(), DATE_FORMAT),
        to: format(dateRange[1] ?? new Date(), DATE_FORMAT),
        token: harvestToken,
        account: harvestAccountId,
        faccount: forecastAccountId,
        team: teamId,
    }), [ dateRange, harvestToken, harvestAccountId, forecastAccountId, teamId, ]);

    const executeSearch = useCallback(() => {
        const url = `me/?${ query }`;
        router.push(url, url)
    }, [ router, query ]);

    useEffect(() => {
        executeSearch()
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
            executeSearch,
            queryString: query,
        } }>
            <Layout hasTeamAccess={ hasTeamAccess } userName={ userName } active={ 'me' }>
                <Box sx={ { flexGrow: 1, } }>
                    <Box p={ 4 }>
                        <ContentHeader title={ 'My Dashboard' }>
                            <Box sx={ { width: 280 } }>
                                <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                            </Box>
                        </ContentHeader>

                        <Grid container spacing={ 4 }>
                            <Grid item container spacing={ 2 }>
                                <Grid item xs={ 6 }>
                                    <Card>
                                        <CardContent>
                                            <Typography variant={ 'h5' }>My Hours</Typography>
                                            <Typography variant={ 'body1' }>{ totalHours }</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 6 }>
                                    <Card>
                                        <CardContent>
                                            <Typography variant={ 'h5' }>My Projects</Typography>
                                            <Typography variant={ 'body1' }>{ myProjects.length }</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={ 2 } item xs={ 12 }>
                                <Grid item xs={ 12 } md={ 6 }>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={ 2 } variant={ 'h5' }>My Hours</Typography>

                                            <DataGrid
                                                autoHeight
                                                getRowId={ (r) => r.projectId }
                                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                                rows={ projectHoursSpent }
                                                columns={ [
                                                    { field: 'projectId', headerName: 'Project ID', width: 90 },
                                                    { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                                    { field: 'hours', headerName: 'Hours', flex: 1 },
                                                    { field: 'hours_forecast', headerName: 'Forecast', flex: 1 },
                                                ] }
                                                disableSelectionOnClick
                                                experimentalFeatures={ { newEditingApi: true } }
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 12 } md={ 6 }>
                                    <Box sx={ { position: 'sticky', top: 10 } }>
                                        <MyProjectsPie entries={ projectHoursSpent }/>
                                    </Box>
                                </Grid>
                                <Grid item xs={ 12 }>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={ 2 } variant={ 'h5' }>My hours per day</Typography>
                                            <ResponsiveContainer width="100%" height={ 400 }>
                                                <BarChart
                                                    height={ 400 }
                                                    data={ hoursPerDay }
                                                >
                                                    <Tooltip/>
                                                    <CartesianGrid strokeDasharray="6 6"/>
                                                    <XAxis dataKey="date"/>
                                                    <YAxis/>
                                                    { listOfProjectNames.map((projectName, index) => (
                                                        <Bar key={ projectName } dataKey={ projectName } stackId="a"
                                                            fill={ COLORS[index] }/>)) }
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 12 }>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={ 2 } variant={ 'h5' }>My Entries</Typography>

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
                                                    { field: 'isRunning', headerName: 'Running', flex: 1 },
                                                    { field: 'date', headerName: 'Date', flex: 1 },
                                                    { field: 'hours', headerName: 'Hours', flex: 1 },
                                                ] }
                                                disableSelectionOnClick
                                                experimentalFeatures={ { newEditingApi: true } }
                                            />
                                        </CardContent>
                                    </Card>
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
