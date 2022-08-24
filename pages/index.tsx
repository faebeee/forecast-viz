import { getHarvest } from "../src/server/get-harvest";
import { TimeEntry } from "../src/server/harvest-types";
import { useCallback, useEffect, useState } from "react";
import cookies from 'js-cookie';
import { useRouter } from "next/router";
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { NextApiRequest, NextApiResponse } from "next";
import {
    Button,
    Card,
    CardContent,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
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
import { getTeamHours, getTeamProjectHours } from "../src/server/utils";

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

const TEAMS = [
    {
        name: "Team Drüü",
        key: 'team3',
        members: [ VALESKA, THIBI, FABS ]
    }
];

export const getServerSideProps = async (req: NextApiRequest, res: NextApiResponse): Promise<{ props: EntriesProps }> => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.query.token as string;
    const teamId = !!req.query.team ? req.query.team as string : null;
    const account = parseInt(req.query.account as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                teamEntries: [],
                projectHoursSpent: [],
                teamProjectHours: [],
                teamHours: [],
                teamAmountOfMembers: 0,
                teamAmountOfProjects: 0,
                teamAmountOfHours: 0,
            }
        }
    }
    const api = getHarvest(token, account);
    const userData = await api.getMe();
    const userId = userData.id;
    const team = TEAMS.find((team) => team.key === teamId);
    const isMemberOfTeam = team?.members.includes(userId);

    const entries = await api.getTimeEntries({ userId: userId, from, to });
    const teamEntries = isMemberOfTeam && team ? await api.getTimeEntriesForUsers(team.members, { from, to }) : []

    const teamHours = getTeamHours(teamEntries);
    const teamProjectHours = getTeamProjectHours(teamEntries);

    const projectHoursSpent = entries.reduce((acc, entry) => {
        const projectName = !!entry.project.code ? entry.project.code : entry.project.name;
        const projectId = entry.project.id;

        if (!acc[projectId]) {
            acc[projectId] = {
                projectName,
                projectId,
                hours: 0,
            }
        }

        acc[projectId].hours += entry.hours;

        return acc;
    }, {} as Record<string, { projectName: string, projectId: number, hours: number }>);

    return {
        props: {
            projectHoursSpent: Object.values(projectHoursSpent),
            from,
            to,
            teamEntries,
            teamHours: Object.values(teamHours),
            teamProjectHours: Object.values(teamProjectHours),
            teamAmountOfMembers: team?.members.length ?? 0,
            teamAmountOfProjects: 0,
            teamAmountOfHours: 0,
        }
    }
}

export type EntriesProps = {
    teamEntries: TimeEntry[];
    from: string;
    to: string;
    projectHoursSpent: { projectId: number, projectName: string, hours: number }[];
    teamHours: { user: string, projects: Record<string, { name: string, hours: number }> }[]
    teamProjectHours: { name: string, hours: number }[];
    teamAmountOfMembers: number;
    teamAmountOfProjects: number;
    teamAmountOfHours: number;
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';

export const Index = ({ projectHoursSpent, from, to, teamHours, teamProjectHours }: EntriesProps) => {
    const router = useRouter();
    const [ selectedTeam, setTeam ] = useState<string | null>(null);
    const [ dateRange, setDateRange ] = useState<[ Date | null, Date | null ]>([ new Date(from), new Date(to) ]);
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [ harvestToken ])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [ harvestAccountId ]);

    const refreshRoute = useCallback(() => {
        const url = `/?from=${ format(dateRange[0] ?? new Date(), DATE_FORMAT) }&to=${ format(dateRange[1] ?? new Date(), DATE_FORMAT) }&token=${ harvestToken }&account=${ harvestAccountId }&team=${ selectedTeam }`
        router.push(url, url)
    }, [ dateRange, harvestToken, harvestAccountId, selectedTeam ]);

    return <>
        <Container>
            <Grid container spacing={ 2 }>
                <Grid item xs={ 12 }>
                    <Card>
                        <CardContent>
                            <Typography variant={ 'h2' }>Settings</Typography>
                            <div>
                                <TextField variant={ 'outlined' }
                                    label={ 'Harvest Access Token' }
                                    fullWidth
                                    value={ harvestToken }
                                    onChange={ (e) => setHarvestToken(e.target.value) }/>
                            </div>
                            <div>
                                <TextField variant={ 'outlined' }
                                    fullWidth
                                    label={ 'Harvest Account Id' }
                                    value={ harvestAccountId }
                                    onChange={ (e) => setHarvestAccountId(e.target.value) }/>
                            </div>
                            <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>

                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label">Team</InputLabel>
                                <Select
                                    value={ selectedTeam }
                                    label="Team"
                                    onChange={ (e) => setTeam(e.target.value) }>
                                    { TEAMS.map((team) => <MenuItem key={ team.key }
                                        value={ team.key }>{ team.name }</MenuItem>) }

                                </Select>
                            </FormControl>

                            <Button color={ 'primary' }
                                size={ 'large' }
                                variant={ 'contained' }
                                onClick={ refreshRoute }>Search</Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={ 6 }>
                    <Card>
                        <CardContent>
                            <Typography variant={ 'h2' }>My Hours</Typography>
                            <DataGrid
                                autoHeight
                                getRowId={ (r) => r.projectId }
                                rows={ projectHoursSpent }
                                columns={ [
                                    { field: 'projectId', headerName: 'ID', width: 90 },
                                    { field: 'projectName', headerName: 'Project Name', flex: 1 },
                                    { field: 'hours', headerName: 'Hours', flex: 1 },
                                ] }
                                disableSelectionOnClick
                                experimentalFeatures={ { newEditingApi: true } }
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={ 6 }>
                    <Card>
                        <CardContent>
                            <Typography variant={ 'h2' }>Team Projects</Typography>
                            <DataGrid
                                autoHeight
                                getRowId={ (r) => r.name }
                                rows={ teamProjectHours }
                                columns={ [
                                    { field: 'name', headerName: 'Project Name', flex: 1 },
                                    { field: 'hours', headerName: 'Hours', flex: 1 },
                                ] }
                                disableSelectionOnClick
                                experimentalFeatures={ { newEditingApi: true } }
                            />
                        </CardContent>
                    </Card>

                    <Card sx={ { mt: 2 } }>
                        <CardContent>
                            { teamHours.length > 0 && <><Typography variant={ 'h2' }>My Team</Typography>
                                <TableContainer>
                                    { teamHours.map((entry, index) => {
                                        return <Table key={ index }>
                                            <TableBody>
                                                { Object.values(entry.projects).map((e, index) => {
                                                    return <TableRow key={ index }>
                                                        <TableCell align="left">{ entry.user }</TableCell>
                                                        <TableCell align="left">{ e.name }</TableCell>
                                                        <TableCell align="right">{ e.hours }</TableCell>
                                                    </TableRow>
                                                }) }
                                            </TableBody>
                                        </Table>
                                    }) }
                                </TableContainer>
                            </> }
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    </>;

}
export default Index;
