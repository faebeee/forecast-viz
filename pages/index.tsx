import {getHarvest} from "../src/server/get-harvest";
import {Project, TimeEntry} from "../src/server/harvest-types";
import {useCallback, useEffect, useState} from "react";
import cookies from 'js-cookie';
import {useRouter} from "next/router";
import {endOfWeek, format, startOfWeek} from 'date-fns';
import {NextApiRequest, NextApiResponse} from "next";
import {
    Button,
    Card, CardActions,
    CardContent,
    Container,
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
import {DataGrid} from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import {DATE_FORMAT, DateRangeWidget} from "../src/components/date-range-widget";
import {
    findAssignment,
    getProjectsFromEntries,
    getTeamHours,
    getTeamHoursEntries,
    getTeamProjectHours
} from "../src/server/utils";
import {getForecast} from "../src/server/get-forecast";
import {StatsRow} from "../src/components/stats-row";

type TeamEntry = {
    userId: number;
    userName: string;
    projectName: string;
    projectId: number;
    hours: number
}

const FABS = 1903105;
const THIBI = 2977071;
const VALESKA = 3837962;
const DAVID = 4239999;
const SAMUEL = 4238574;
const ABHI = 3862657;
const DENNIS = 3263781;

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

    const assignments = await forecast.getAssignments(from);

    const entries = await api.getTimeEntries({userId: userId, from, to});
    const teamEntries = await api.getTimeEntriesForUsers(teamPeople, {from, to});

    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(entries);
    const allTeamProjects = getProjectsFromEntries(teamEntries);
    const teamHours = getTeamHours(teamEntries);
    const teamProjectHours = getTeamProjectHours(teamEntries);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);
    const totalTeamHours = Object.values(teamProjectHours).reduce((acc, entry) => {
        return acc + entry.hours;
    }, 0);

    const projectHoursSpent = entries.reduce((acc, entry) => {
        const projectName = !!entry.project.code ? entry.project.code : entry.project.name;
        const projectId = entry.project.id;
        const assignment = findAssignment(assignments, entry.project.id, entry.user.id);

        if (!acc[projectId]) {
            acc[projectId] = {
                projectName,
                projectId,
                hours: 0,
                hours_forecast: assignment?.allocation ?? 0,
            }
        }

        acc[projectId].hours += entry.hours;

        return acc;
    }, {} as Record<string, { projectName: string, projectId: number, hours: number, hours_forecast: number }>);

    return {
        props: {
            projectHoursSpent: Object.values(projectHoursSpent),
            from,
            to,
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

export type EntriesProps = {
    teamEntries: TimeEntry[];
    myProjects: Project[];
    from: string;
    to: string;
    totalHours: number;
    projectHoursSpent: { projectId: number, projectName: string, hours: number, hours_forecast: number }[];
    teamProjectHours: { name: string, hours: number }[];
    teamAmountOfProjects: number;
    teamProjectHourEntries: { id: string, user: string, project: string, hours: number, hours_forecast: number }[];
    totalTeamMembers: number | null;
    totalTeamHours: number | null;
    teamProjects: Project[];
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';
const COOKIE_FORC_ACCOUNTID_NAME = 'forecast-account-id';

export const Index = ({
                          projectHoursSpent,
                          from,
                          to,
                          teamProjectHours,
                          teamProjectHourEntries,
                          totalTeamMembers,
                          totalTeamHours,
                          teamProjects,
                          totalHours,
                          myProjects,
                      }: EntriesProps) => {
    const router = useRouter();
    const [selectedTeam, setTeam] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(from), new Date(to)]);
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [forecastAccountId, setForecastAccountId] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId)
    }, [forecastAccountId])

    const refreshRoute = useCallback(() => {
        const url = `/?from=${format(dateRange[0] ?? new Date(), DATE_FORMAT)}&to=${format(dateRange[1] ?? new Date(), DATE_FORMAT)}&token=${harvestToken}&account=${harvestAccountId}&faccount=${forecastAccountId}&team=${selectedTeam}`
        router.push(url, url)
    }, [dateRange, harvestToken, harvestAccountId, selectedTeam, forecastAccountId,]);

    return <>
        <Container>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant={'h2'}>Settings</Typography>
                            <Typography variant={'body1'}>
                                Create accesstokens <Link href={'https://id.getharvest.com/developers'}
                                                          target={'_blank'}>
                                here
                            </Link>
                            </Typography>
                            <Stack spacing={2}>
                                <TextField variant={'outlined'}
                                           label={'Harvest Access Token'}
                                           fullWidth
                                           value={harvestToken}
                                           onChange={(e) => setHarvestToken(e.target.value)}/>

                                <TextField variant={'outlined'}
                                           fullWidth
                                           label={'Harvest Account Id'}
                                           value={harvestAccountId}
                                           onChange={(e) => setHarvestAccountId(e.target.value)}/>

                                <TextField variant={'outlined'}
                                           fullWidth
                                           label={'Forecast Account Id'}
                                           value={forecastAccountId}
                                           onChange={(e) => setForecastAccountId(e.target.value)}/>

                                <DateRangeWidget dateRange={dateRange} onChange={setDateRange}/>

                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Team</InputLabel>
                                    <Select
                                        value={selectedTeam}
                                        label="Team"
                                        onChange={(e) => setTeam(e.target.value)}>
                                        {TEAMS.map((team) => <MenuItem key={team.key}
                                                                       value={team.key}>{team.name}</MenuItem>)}

                                    </Select>
                                </FormControl>
                            </Stack>
                        </CardContent>
                        <CardActions>
                            <Button color={'primary'}
                                    size={'large'}
                                    variant={'contained'}
                                    onClick={refreshRoute}>Search</Button>
                        </CardActions>
                    </Card>
                </Grid>
                <StatsRow totalHours={totalHours} totalProjects={myProjects.length}
                          totalTeamHours={totalTeamHours ?? 0}
                          teamProjects={teamProjects.length}
                          totalTeamMembers={totalTeamMembers ?? 0}/>
                <Grid container spacing={2} item xs={12}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant={'h5'}>My Hours</Typography>
                                <DataGrid
                                    autoHeight
                                    getRowId={(r) => r.projectId}
                                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                    rows={projectHoursSpent}
                                    columns={[
                                        {field: 'projectId', headerName: 'Project ID', width: 90},
                                        {field: 'projectName', headerName: 'Project Name', flex: 1},
                                        {field: 'hours', headerName: 'Hours', flex: 1},
                                        {field: 'hours_forecast', headerName: 'Forecast', flex: 1},
                                    ]}
                                    disableSelectionOnClick
                                    experimentalFeatures={{newEditingApi: true}}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant={'h5'}>Team Projects</Typography>
                                <DataGrid
                                    autoHeight
                                    getRowId={(r) => r.name}
                                    rows={teamProjectHours}
                                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                    columns={[
                                        {field: 'id', headerName: 'Project ID', width: 90},
                                        {field: 'name', headerName: 'Project Name', flex: 1},
                                        {field: 'hours', headerName: 'Hours', flex: 1},
                                    ]}
                                    disableSelectionOnClick
                                    experimentalFeatures={{newEditingApi: true}}/>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant={'h5'}>Team Hours</Typography>
                                <DataGrid
                                    autoHeight
                                    rows={teamProjectHourEntries}
                                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                    columns={[
                                        {field: 'user', headerName: 'User', flex: 1},
                                        {field: 'project', headerName: 'Project Name', flex: 1},
                                        {field: 'hours', headerName: 'Hours', flex: 1},
                                        {field: 'hours_forecast', headerName: 'Forecast', flex: 1},
                                    ]}
                                    disableSelectionOnClick
                                    experimentalFeatures={{newEditingApi: true}}/>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    </>
        ;

}
export default Index;
