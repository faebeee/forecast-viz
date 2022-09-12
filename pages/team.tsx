import { getHarvest } from "../src/server/get-harvest";
import { Project, TimeEntry } from "../src/server/harvest-types";
import { endOfWeek, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import {
    getHoursPerUser,
    getProjectsFromEntries,
    getTeamHoursEntries,
    getTeamProjectHours,
    SpentProjectHours
} from "../src/server/utils";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import cookies from "js-cookie";
import qs from "qs";
import { FilterContext } from "../src/context/filter-context";
import { ContentHeader } from "../src/components/content-header";

type TeamEntry = {
    userId: number;
    userName: string;
    projectName: string;
    projectId: number;
    hours: number
}

const TEAMS = [
    {
        name: "Team Eis",
        key: 'Projektteam 1',
    },
    {
        name: "Team Zwei",
        key: 'Projektteam 2',
    },
    {
        name: "Team Drüü",
        key: 'Projektteam 3',
    },
];

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
                teamEntries: [],
                roles: TEAMS,
                teamProjectHours: [],
                teamProjectHourEntries: [],
                totalTeamMembers: null,
                teamAmountOfProjects: 0,
                billableTotalHours: 0,
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
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);

    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;


    if (!myTeamEntry) {
        return {
            props: {
                from,
                to,
                hasTeamAccess,
                teamEntries: [],
                roles: TEAMS,
                teamProjectHours: [],
                teamProjectHourEntries: [],
                totalTeamMembers: null,
                teamAmountOfProjects: 0,
                billableTotalHours: 0,
                totalTeamHours: null,
                teamProjects: [],
                hoursPerUser: [],
            }
        }
    }
    const teamId = myTeamEntry.key;

    const teamPeople = allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
        .map(p => p.harvest_user_id);

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

    const billableTotalHours = Object.values(teamProjectHours).filter(e => e.billable).reduce((acc, entry) => {
        return acc + entry.hours;
    }, 0);

    return {
        props: {
            from,
            to,
            teamEntries,
            hoursPerUser,
            billableTotalHours,
            teamProjectHours: Object.values(teamProjectHours),
            totalTeamMembers: teamPeople.length ?? null,
            teamAmountOfProjects: 0,
            totalTeamHours,
            teamProjectHourEntries,
            teamProjects: allTeamProjects,
            userName: userData.first_name,
            teamId,
            hasTeamAccess,
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
    billableTotalHours: number;
    userName?: string;
    selectedTeamId?: string | null;
    teamProjects: Project[];
    hoursPerUser: { user: string, hours: number }[];
    teamId?: '';
    hasTeamAccess?: boolean
}


export const Index = ({
                          teamProjectHours,
                          teamProjectHourEntries,
                          totalTeamMembers,
                          totalTeamHours,
                          teamProjects,
                          hoursPerUser,
                          userName,
                          billableTotalHours,
                          selectedTeamId,
                          from,
                          to,
                          hasTeamAccess,
                          teamId = '',
                      }: EntriesProps) => {
    const router = useRouter();
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
        const url = `team/?${ query }`;
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
            <Layout active={ 'team' } hasTeamAccess={ hasTeamAccess } userName={ userName }>
                <Box sx={ { flexGrow: 1, } }>
                    <Box p={ 4 }>
                        <ContentHeader title={ teamId }>
                            <Box sx={ { width: 280 } }>
                                <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                            </Box>
                        </ContentHeader>

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
        </FilterContext.Provider>
    </>;
}
export default Index;
