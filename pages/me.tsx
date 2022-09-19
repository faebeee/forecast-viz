import {getHarvest} from "../src/server/get-harvest";
import {Project} from "../src/server/harvest-types";
import {endOfWeek, format, parse, startOfWeek} from 'date-fns';
import {GetServerSideProps} from "next";
import {Box, Card, CardContent, Grid, Typography} from "@mui/material";
import {DataGrid} from '@mui/x-data-grid';
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import {DATE_FORMAT, DateRangeWidget} from "../src/components/date-range-widget";
import {
    findAssignment,
    getMyAssignments,
    getProjectsFromEntries,
    MyEntries,
    SpentProjectHours
} from "../src/server/utils";
import {AssignmentEntry, getForecast} from "../src/server/get-forecast";
import {MyProjectsPie} from "../src/components/my-projects-pie";
import {get} from "lodash";
import {Layout} from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import {HoursPerDay, HoursPerDayCollectionItem} from "../src/type";
import {FilterContext} from "../src/context/filter-context";
import {useCallback, useEffect, useMemo, useState} from "react";
import cookies from "js-cookie";
import qs from "qs";
import {useRouter} from "next/router";
import {ContentHeader} from "../src/components/content-header";
import {useEntries} from "../src/hooks/use-entries";

export const getServerSideProps: GetServerSideProps = async ({query, req}): Promise<{ props: EntriesProps }> => {
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
                roles: [],
                projectHoursSpent: [],
                billableTotalHours: 0,
                myProjects: [],
                listOfProjectNames: [],
                hoursPerDay: [],
                userName: null,
                totalPlannedHours: 0,
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
    const entries = await api.getTimeEntries({userId: userId, from, to});
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;
    const billableTotalHours = entries.filter(e => e.billable).reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(entries);


    const myAssignments = getMyAssignments(assignments, userId);
    const totalPlannedHours = myAssignments.reduce((acc, assignment) => acc + (assignment.totalHours ?? 0), 0);
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
            return acc + (assignment.totalHours ?? 0);
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
            myProjects,
            billableTotalHours,
            userName: userData.first_name,
            listOfProjectNames,
            hasTeamAccess,
            totalPlannedHours,
            myAssignments,
            hoursPerDay: Object.entries(hoursPerDay).map(([key, value]) => {
                return {
                    date: key,
                    ...value
                }
            }).reverse() as HoursPerDayCollectionItem[],
        }
    }
}


export type EntriesProps = {
    myProjects: Project[];
    from: string;
    to: string;
    userName?: string | null;
    billableTotalHours: number;
    projectHoursSpent: SpentProjectHours[];
    roles?: { key: string, name: string }[];
    hoursPerDay: HoursPerDayCollectionItem[],
    listOfProjectNames: string[];
    hasTeamAccess?: boolean;
    totalPlannedHours: number;
    myAssignments?: AssignmentEntry[];
}


export const Index = ({
                          projectHoursSpent,
                          billableTotalHours,
                          myProjects,
                          userName,
                          hoursPerDay,
                          listOfProjectNames,
                          from,
                          to,
                          hasTeamAccess,
                          totalPlannedHours,
                          myAssignments,
                      }: EntriesProps) => {
    const router = useRouter();
    const [dateRange, setDateRange] = useState<[Date, Date]>([!!from ? parse(from, DATE_FORMAT, new Date()) : startOfWeek(new Date()), !!to ? parse(to, DATE_FORMAT, new Date()) : endOfWeek(new Date())]);
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [forecastAccountId, setForecastAccountId] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');
    const {entries, load} = useEntries();
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId)
    }, [forecastAccountId])

    const query = useMemo(() => qs.stringify({
        from: format(dateRange[0] ?? new Date(), DATE_FORMAT),
        to: format(dateRange[1] ?? new Date(), DATE_FORMAT),
    }), [dateRange, harvestToken, harvestAccountId, forecastAccountId,]);

    useEffect(() => {
        load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT))
    }, [dateRange]);

    const executeSearch = useCallback(() => {
        const url = `me/?${query}`;
        router.push(url, url)
    }, [router, query]);

    useEffect(() => {
        executeSearch()
    }, [dateRange]);

    return <>
        <FilterContext.Provider value={{
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
        }}>
            <Layout hasTeamAccess={hasTeamAccess} userName={userName} active={'me'}>
                <Box sx={{flexGrow: 1,}}>
                    <Box p={4}>
                        <ContentHeader title={'My Dashboard'}>
                            <Box sx={{width: 280}}>
                                <DateRangeWidget dateRange={dateRange} onChange={setDateRange}/>
                            </Box>
                        </ContentHeader>

                        <Grid container spacing={10}>
                            <Grid item container spacing={10}>
                                <Grid item xs={4}>
                                    <Card sx={{
                                        position: 'relative',
                                        minHeight: '200px',
                                    }}
                                    >
                                        <CardContent>
                                            <Typography variant={'body1'}>My Hours</Typography>
                                            <Typography variant={'h2'}>{totalHours}</Typography>
                                            <Box sx={{position: 'absolute', bottom: 24, right: 24}}>
                                                <Image src={'/illu/work.svg'} width={128} height={128}/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{
                                        position: 'relative',
                                        minHeight: '200px',
                                    }}
                                    >
                                        <CardContent>
                                            <Typography variant={'body1'}>Planned Hours</Typography>
                                            <Typography variant={'h2'}>{totalPlannedHours}</Typography>
                                            <Box sx={{position: 'absolute', bottom: 24, right: 24}}>
                                                <Image src={'/illu/time.svg'} width={128} height={128}/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={4}>
                                    <Card sx={{
                                        position: 'relative',
                                        minHeight: 200
                                    }}
                                    >
                                        <CardContent>
                                            <Typography variant={'body1'}>My Projects</Typography>
                                            <Typography variant={'h2'}>{myProjects.length}</Typography>
                                            <Box sx={{position: 'absolute', bottom: 24, right: 24}}>
                                                <Image src={'/illu/projects.svg'} width={128} height={128}/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={10} item xs={12}>
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={2} variant={'h5'}>My Hours</Typography>

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
                                        <MyProjectsPie<SpentProjectHours> entries={projectHoursSpent} value={'hours'}
                                                                          label={'projectName'}/>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={2} variant={'h5'}>My Forcecast</Typography>

                                            <DataGrid
                                                autoHeight
                                                rowsPerPageOptions={[5, 10, 20, 50, 100]}
                                                rows={myAssignments ?? []}
                                                columns={[
                                                    {
                                                        field: 'project.id',
                                                        headerName: 'Project ID',
                                                        renderCell: ({row, field}) => get(row, field)
                                                    },
                                                    {
                                                        field: 'project.name',
                                                        headerName: 'Project Name',
                                                        flex: 1,
                                                        renderCell: ({row, field}) => get(row, field)
                                                    },
                                                    {
                                                        field: 'days',
                                                        headerName: 'Days',
                                                    },
                                                    {
                                                        field: 'hoursPerDay',
                                                        headerName: 'hoursPerDay',
                                                    },
                                                    {
                                                        field: 'totalHours',
                                                        headerName: 'totalHours',
                                                    },
                                                    {
                                                        field: 'start_date',
                                                        headerName: 'Start Date',
                                                    },
                                                    {
                                                        field: 'end_date',
                                                        headerName: 'End Date',
                                                    },
                                                ]}
                                                disableSelectionOnClick
                                                experimentalFeatures={{newEditingApi: true}}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{position: 'sticky', top: 10}}>
                                        <MyProjectsPie<AssignmentEntry> entries={myAssignments ?? []}
                                                                        value={'totalHours'}
                                                                        label={(payload) => (!!payload.project?.code ? payload.project?.code : payload.project?.name) ?? '???'}/>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={2} variant={'h5'}>My Entries</Typography>

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
                                                    {field: 'isRunning', headerName: 'Running', flex: 1},
                                                    {field: 'date', headerName: 'Date', flex: 1},
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
        </FilterContext.Provider>
    </>;
}
export default Index;
