import {getHarvest} from "../src/server/get-harvest";
import uniq from "lodash/uniq";
import {GetMe, GetProjectBudget, TimeEntry} from "../src/server/harvest-types";
import {useCallback, useEffect, useState} from "react";
import cookies from 'js-cookie';
import {useRouter} from "next/router";
import {endOfWeek, format, startOfWeek} from 'date-fns';
import {NextApiRequest, NextApiResponse} from "next";
import {
    Card,
    CardContent, Container,
    Grid,
    Table, TableBody, TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import {DataGrid} from '@mui/x-data-grid';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {DATE_FORMAT, DateRangeWidget} from "../src/components/date-range-widget";
import {Header} from "../src/components/header";

type TeamEntry = {
    userId: number;
    userName: string;
    projectName: string;
    projectId: number;
    hours: number
}

export const getServerSideProps = async (req: NextApiRequest, res: NextApiResponse) => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.query.token as string;
    const account = parseInt(req.query.account as string);

    if (!token || !account) {
        return {
            props: {
                entries: [],
                hoursTotal: 0,
                totalEntries: 0,
                projects: [],
                totalProjects: 0,
                from,
                to,
                projectHoursSpent: [],
                activeAssignments: [],
            }
        }
    }
    const api = getHarvest(token, account);
    const userData = await api.getMe();
    const userId = userData.id;


    const entries = await api.getTimeEntries({userId: userId, from, to});
    const teamEntries = await api.getTimeEntriesForUsers([1903105, 1903105], {from, to})

    const teamHours = teamEntries.reduce((acc, entry) => {
        if (!acc[entry.user.id]) {
            acc[entry.user.id] = {
                user: entry.user.name,
                projects: {}
            }
        }

        if (!acc[entry.user.id].projects[entry.project.id]) {
            acc[entry.user.id].projects[entry.project.id] = {
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.user.id].projects[entry.project.id].hours += entry.hours;

        return acc;
    }, {})

    const teamProjectHours = teamEntries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.project.id].hours += entry.hours;

        return acc;
    }, {})

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
        }
    }
}

export type EntriesProps = {
    teamEntries: TimeEntry[];
    from: string;
    to: string;
    projectHoursSpent: { projectId: number, projectName: string, hours: number }[];
    teamHours: { user: string, projects: Record<string, { name: string, hours: number }> }[]
    teamProjectHours: Record<string, { name: string, hours: number }>
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';

export const Index = ({projectHoursSpent, from, to, teamHours, teamProjectHours}: EntriesProps) => {
    const router = useRouter();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(from), new Date(to)]);
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);

    const changeDateRange = useCallback(() => {
        const url = `/?from=${format(dateRange[0] ?? new Date(), DATE_FORMAT)}&to=${format(dateRange[1] ?? new Date(), DATE_FORMAT)}&token=${harvestToken}&account=${harvestAccountId}`
        router.push(url, url)
    }, [dateRange, harvestToken, harvestAccountId]);

    return <>

        <Container>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant={'h2'}>Settings</Typography>
                    <div>
                        <TextField variant={'filled'}
                                   label={'Harvest Access Token'}
                                   fullWidth
                                   value={harvestToken}
                                   onChange={(e) => setHarvestToken(e.target.value)}/>
                    </div>
                    <div>
                        <TextField variant={'filled'}
                                   fullWidth
                                   label={'Harvest Account Id'}
                                   value={harvestAccountId}
                                   onChange={(e) => setHarvestAccountId(e.target.value)}/>
                    </div>
                    <DateRangeWidget dateRange={dateRange} onClose={changeDateRange} onChange={setDateRange}/>
                </Grid>

                <Grid item xs={6}>
                    <Typography variant={'h2'}>My Hours</Typography>
                    <DataGrid
                        autoHeight
                        getRowId={(r) => r.projectId}
                        rows={projectHoursSpent}
                        columns={[
                            {field: 'projectId', headerName: 'ID', width: 90},
                            {field: 'projectName', headerName: 'Project Name', flex: 1},
                            {field: 'hours', headerName: 'Hours', flex: 1},
                        ]}
                        disableSelectionOnClick
                        experimentalFeatures={{newEditingApi: true}}
                    />
                </Grid>

                <Grid item xs={6}>
                    <Typography variant={'h2'}>Team Projects</Typography>
                    <DataGrid
                        autoHeight
                        getRowId={(r) => r.name}
                        rows={teamProjectHours}
                        columns={[
                            {field: 'name', headerName: 'Project Name', flex: 1},
                            {field: 'hours', headerName: 'Hours', flex: 1},
                        ]}
                        disableSelectionOnClick
                        experimentalFeatures={{newEditingApi: true}}
                    />

                    <Typography variant={'h2'}>My Team</Typography>
                    <TableContainer>
                        {teamHours.map((entry) => {
                            return <Table>
                                <TableBody>
                                    {Object.values(entry.projects).map((e) => {
                                        return <TableRow>
                                            <TableCell align="left">{entry.user}</TableCell>
                                            <TableCell align="left">{e.name}</TableCell>
                                            <TableCell align="right">{e.hours}</TableCell>
                                        </TableRow>
                                    })}
                                </TableBody>
                            </Table>
                        })}
                    </TableContainer>
                </Grid>
            </Grid>
        </Container>
    </>;

}
export default Index;
