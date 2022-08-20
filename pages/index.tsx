import {getHarvest} from "../src/server/get-harvest";
import uniq from "lodash/uniq";
import {GetMe, GetProjectBudget, TimeEntry} from "../src/server/harvest-types";
import {useEffect, useState} from "react";
import cookies from 'js-cookie';
import {useRouter} from "next/router";
import {endOfWeek, format, startOfWeek} from 'date-fns';
import {NextApiRequest, NextApiResponse} from "next";
import {Card, CardContent, Grid, TextField, Typography} from "@mui/material";
import {DataGrid} from '@mui/x-data-grid';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DATE_FORMAT = 'yyyy-MM-dd';

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

    const entries = await api.getTimeEntries({userId, from, to});
    const assignments = await api.getProjectBudget({userId, from, to});

    const projects = uniq(entries.reduce((acc, entry) => {
        acc.push(entry.project.id)
        return acc;
    }, [] as number[]));

    const activeAssignments = assignments.filter((assignment) => projects.includes(assignment.project_id));

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

    const hoursTotal = entries.reduce((acc, entry) => {
        return acc + entry.hours;
    }, 0);

    return {
        props: {
            entries,
            hoursTotal,
            projectHoursSpent: Object.values(projectHoursSpent),
            projects,
            from,
            to,
            userData,
            activeAssignments,
        }
    }
}

export type EntriesProps = {
    entries: TimeEntry[];
    totalEntries: number;
    projects: string[];
    from: string;
    to: string;
    projectHoursSpent: { projectId: number, projectName: string, hours: number }[];
    userData: GetMe.GetMeResponse;
    activeAssignments: GetProjectBudget.Result[]
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';

export const Index = ({projectHoursSpent, from, to, activeAssignments}: EntriesProps) => {
    const router = useRouter();
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(from), new Date(to)]);

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);


    useEffect(() => {
        const url = `/?from=${format(dateRange[0] ?? new Date(), DATE_FORMAT)}&to=${format(dateRange[1] ?? new Date(), DATE_FORMAT)}&token=${harvestToken}&account=${harvestAccountId}`
        router.push(url, url)
    }, [dateRange])

    return <>
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <Card>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6}>
                <Card>
                    <CardContent>
                        <Typography variant={'h2'}>Filters</Typography>
                        <DatePicker
                            selectsRange
                            startDate={dateRange[0]}
                            endDate={dateRange[1]}
                            dateFormat={DATE_FORMAT}
                            customInput={<TextField variant={'filled'} fullWidth/>}
                            onChange={(d) => setDateRange(d as [Date, Date])}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6}>
                <Card>
                    <CardContent>
                        <Typography variant={'h2'}>Hours Spent</Typography>
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
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6}>
                <Card>
                    <CardContent>
                        <Typography variant={'h2'}>Projects</Typography>
                        <DataGrid
                            autoHeight
                            getRowId={(r) => r.project_id}
                            rows={activeAssignments}
                            columns={[
                                {field: 'project_name', headerName: 'Project Name', flex: 1},
                                {field: 'client_name', headerName: 'Client Name', flex: 1},
                                {field: 'budget_by', headerName: 'Budget Type', flex: 1},
                                {field: 'budget', headerName: 'Budget', flex: 1},
                                {field: 'budget_spent', headerName: 'Spent', flex: 1},
                                {field: 'budget_remaining', headerName: 'Remaining', flex: 1},

                            ]}
                            disableSelectionOnClick
                            experimentalFeatures={{newEditingApi: true}}
                        />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    </>;

}
export default Index;
