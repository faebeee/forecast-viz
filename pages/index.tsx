import {getHarvest} from "../src/server/get-harvest";
import {Project} from "../src/server/harvest-types";
import {differenceInDays, endOfWeek, format, startOfWeek} from 'date-fns';
import {NextApiRequest, NextApiResponse} from "next";
import {Box, Card, CardContent, Grid, Typography} from "@mui/material";
import {DataGrid} from '@mui/x-data-grid';
import "react-datepicker/dist/react-datepicker.css";
import {DATE_FORMAT} from "../src/components/date-range-widget";
import {findAssignment, getProjectsFromEntries, MyEntries, SpentProjectHours} from "../src/server/utils";
import {getForecast} from "../src/server/get-forecast";
import {MyProjectsPie} from "../src/components/my-projects-pie";
import {get} from "lodash";
import {Layout} from "../src/components/layout";

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
    const account = parseInt(req.query.account as string);
    const forecastAccount = parseInt(req.query.faccount as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                entries: [],
                roles: [],
                projectHoursSpent: [],
                totalHours: 0,
                billableTotalHours: 0,
                myProjects: [],
            }
        }
    }
    const api = getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const assignments = await forecast.getAssignments(from, to);

    const entries = await api.getTimeEntries({userId: userId, from, to});

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
        }
    });

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
            billableTotalHours,
            userName: userData.first_name,
        }
    }
}


export type EntriesProps = {
    entries: MyEntries[];
    myProjects: Project[];
    from: string;
    to: string;
    userName?: string;
    totalHours: number;
    billableTotalHours: number;
    projectHoursSpent: SpentProjectHours[];
    roles?: { key: string, name: string }[]
}


export const Index = ({
                          projectHoursSpent,
                          totalHours,
                          billableTotalHours,
                          myProjects,
                          entries,
                          userName,
                      }: EntriesProps) => {
    return <>
        <Layout userName={userName}>

            <Box sx={{flexGrow: 1,}}>
                <Box p={4}>
                    <Typography sx={{marginBottom: 4}} variant={"h3"}>My Dashboard</Typography>
                    <Grid container spacing={4}>
                        <Grid item container spacing={2}>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant={'h5'}>My Hours</Typography>
                                        <Typography variant={'body1'}>{totalHours}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant={'h5'}>My Projects</Typography>
                                        <Typography variant={'body1'}>{myProjects.length}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} item xs={12}>
                            <Grid item xs={12} md={8}>
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
                            <Grid item xs={12} md={4}>
                                <Box sx={{position: 'sticky', top: 10}}>
                                    <MyProjectsPie entries={projectHoursSpent}/>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant={'h5'}>My Entries</Typography>

                                        <DataGrid
                                            autoHeight
                                            rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                            rows={entries}
                                            columns={[
                                                {
                                                    field: 'projectId',
                                                    headerName: 'Project ID',
                                                    width: 90,
                                                    renderCell: ({row, field}) => get(row, field)
                                                },
                                                {
                                                    field: 'projectCode',
                                                    headerName: 'Project Code',
                                                    width: 90,
                                                    renderCell: ({row, field}) => get(row, field)
                                                },
                                                {
                                                    field: 'projectName',
                                                    headerName: 'Project Name',
                                                    flex: 1,
                                                    renderCell: ({row, field}) => get(row, field)
                                                },
                                                {field: 'notes', headerName: 'Notes', flex: 1},
                                                {field: 'hours', headerName: 'Hours', flex: 1},
                                            ]}
                                            disableSelectionOnClick
                                            experimentalFeatures={{newEditingApi: true}}
                                        />
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
