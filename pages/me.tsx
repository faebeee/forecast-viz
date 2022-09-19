import { getHarvest } from "../src/server/get-harvest";
import { endOfWeek, format, parse, startOfWeek } from 'date-fns';
import { GetServerSideProps } from "next";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Image from 'next/image';
import "react-datepicker/dist/react-datepicker.css";
import { DATE_FORMAT, DateRangeWidget } from "../src/components/date-range-widget";
import { findAssignment, SpentProjectHours } from "../src/server/utils";
import { AssignmentEntry, getForecast } from "../src/server/get-forecast";
import { MyProjectsPie } from "../src/components/my-projects-pie";
import { get } from "lodash";
import { Layout } from "../src/components/layout";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { FilterContext } from "../src/context/filter-context";
import { useEffect, useMemo, useState } from "react";
import cookies from "js-cookie";
import qs from "qs";
import { useRouter } from "next/router";
import { ContentHeader } from "../src/components/content-header";
import { useEntries } from "../src/hooks/use-entries";
import { useStats } from "../src/hooks/use-stats";
import { useAssignments } from "../src/hooks/use-assignments";
import { useHours } from "../src/hooks/use-hours";
import { ProjectHours } from "./api/me/hours";

export const getServerSideProps: GetServerSideProps = async ({ query, req }): Promise<{ props: EntriesProps }> => {
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
                userName: null,
            }
        }
    }
    const api = getHarvest(token, account);
    const forecast = getForecast(token, forecastAccount);
    const userData = await api.getMe();
    const userId = userData.id;

    const allPeople = await forecast.getPersons();
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;

    return {
        props: {
            from,
            to,
            userName: userData.first_name,
            hasTeamAccess,
        }
    }
}


export type EntriesProps = {
    from: string;
    to: string;
    userName?: string | null;
    hasTeamAccess?: boolean;
}


export const Index = ({
                          userName,
                          from,
                          to,
                          hasTeamAccess,
                      }: EntriesProps) => {
    const router = useRouter();
    const [ dateRange, setDateRange ] = useState<[ Date, Date ]>([ !!from ? parse(from, DATE_FORMAT, new Date()) : startOfWeek(new Date()), !!to ? parse(to, DATE_FORMAT, new Date()) : endOfWeek(new Date()) ]);
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [ forecastAccountId, setForecastAccountId ] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');
    const { entries, load } = useEntries();
    const statsApi = useStats();
    const assignmentsApi = useAssignments();
    const hoursApi = useHours();

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
    }), [ dateRange, harvestToken, harvestAccountId, forecastAccountId, ]);

    useEffect(() => {
        load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        statsApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        assignmentsApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
        hoursApi.load(format(dateRange[0] ?? new Date(), DATE_FORMAT), format(dateRange[1] ?? new Date(), DATE_FORMAT));
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
        } }>
            <Layout hasTeamAccess={ hasTeamAccess } userName={ userName } active={ 'me' }>
                <Box sx={ { flexGrow: 1, } }>
                    <Box p={ 4 }>
                        <ContentHeader title={ 'My Dashboard' }>
                            <Box sx={ { width: 280 } }>
                                <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
                            </Box>
                        </ContentHeader>

                        <Grid container spacing={ 10 }>
                            <Grid item container spacing={ 10 }>
                                <Grid item xs={ 4 }>
                                    <Card sx={ {
                                        position: 'relative',
                                        minHeight: '200px',
                                    } }
                                    >
                                        <CardContent>
                                            <Typography variant={ 'body1' }>My Hours</Typography>
                                            <Typography variant={ 'h2' }>{ statsApi.totalHours }</Typography>
                                            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                                <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 4 }>
                                    <Card sx={ {
                                        position: 'relative',
                                        minHeight: '200px',
                                    } }
                                    >
                                        <CardContent>
                                            <Typography variant={ 'body1' }>Planned Hours</Typography>
                                            <Typography variant={ 'h2' }>{ statsApi.totalPlannedHours }</Typography>
                                            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                                <Image src={ '/illu/time.svg' } width={ 128 } height={ 128 }/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 4 }>
                                    <Card sx={ {
                                        position: 'relative',
                                        minHeight: 200
                                    } }
                                    >
                                        <CardContent>
                                            <Typography variant={ 'body1' }>My Projects</Typography>
                                            <Typography variant={ 'h2' }>{ statsApi.totalProjects }</Typography>
                                            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                                                <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Grid container spacing={ 10 } item xs={ 12 }>
                                <Grid item xs={ 12 } md={ 8 }>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={ 2 } variant={ 'h5' }>My Hours</Typography>

                                            <DataGrid
                                                autoHeight
                                                getRowId={ (r) => r.id }
                                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                                rows={ hoursApi.hours ?? [] }
                                                columns={ [
                                                    { field: 'id', headerName: 'Project ID', width: 90 },
                                                    { field: 'name', headerName: 'Project Name', flex: 1 },
                                                    { field: 'code', headerName: 'Project Code', flex: 1 },
                                                    { field: 'hoursSpent', headerName: 'Spent', flex: 1 },
                                                    { field: 'hoursPlanned', headerName: 'Planned', flex: 1 },
                                                ] }
                                                disableSelectionOnClick
                                                experimentalFeatures={ { newEditingApi: true } }
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 12 } md={ 4 }>
                                    <Box sx={ { position: 'sticky', top: 10 } }>
                                        <MyProjectsPie<ProjectHours> entries={ hoursApi.hours ?? [] }
                                            value={ 'hours' }
                                            label={ 'name' }/>
                                    </Box>
                                </Grid>
                                <Grid item xs={ 12 } md={ 8 }>
                                    <Card>
                                        <CardContent>
                                            <Typography mb={ 2 } variant={ 'h5' }>My Forcecast</Typography>

                                            <DataGrid
                                                autoHeight
                                                rowsPerPageOptions={ [ 5, 10, 20, 50, 100 ] }
                                                rows={ assignmentsApi.assignments ?? [] }
                                                columns={ [
                                                    {
                                                        field: 'project.id',
                                                        headerName: 'Project ID',
                                                        renderCell: ({ row, field }) => get(row, field)
                                                    },
                                                    {
                                                        field: 'project.name',
                                                        headerName: 'Project Name',
                                                        flex: 1,
                                                        renderCell: ({ row, field }) => get(row, field)
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
                                                ] }
                                                disableSelectionOnClick
                                                experimentalFeatures={ { newEditingApi: true } }
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={ 12 } md={ 4 }>
                                    <Box sx={ { position: 'sticky', top: 10 } }>
                                        <MyProjectsPie<AssignmentEntry> entries={ assignmentsApi.assignments ?? [] }
                                            value={ 'totalHours' }
                                            label={ (payload) => (!!payload.project?.code ? payload.project?.code : payload.project?.name) ?? '???' }/>
                                    </Box>
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
