import { getHarvest } from "../src/server/get-harvest";
import uniq from "lodash/uniq";
import get from "lodash/get";
import { TimeEntry } from "../src/server/harvest-types";
import { useEffect, useState } from "react";
import cookies from 'js-cookie';
import { useRouter } from "next/router";
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { NextApiRequest, NextApiResponse } from "next";
import { Card, CardContent, TextField, Typography } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import { Box } from "@mui/system";

const DATE_FORMAT = 'yyyy-MM-dd';

export const getServerSideProps = async (req: NextApiRequest, res: NextApiResponse) => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    const token = req.query.token as string;
    const account = parseInt(req.query.account as string);
    const userId = parseInt(req.query.userid as string);

    if (!token || !account) {
        return {
            props: {
                from,
                to,
                projectHoursSpent: []
            }
        }
    }
    const api = getHarvest(token, account);

    const entries = await api.getTimeEntries({ userId, from, to });

    const projects = uniq(entries.reduce((acc, entry) => {
        acc.push(entry.project.name)
        return acc;
    }, [] as string[]));

    const projectHoursSpent = entries.reduce((acc, entry) => {
        const projectName = entry.project.name;
        const projectId = entry.project.id
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
            totalEntries: entries.length,
            projects,
            totalProjects: projects.length,
            from,
            to
        }
    }
}

export type EntriesProps = {
    entries: TimeEntry[];
    totalEntries: number;
    projects: string[];
    totalProjects: number;
    hoursTotal: number;
    from: string;
    to: string;
    projectHoursSpent: { projectId: number, projectName: string, hours: number }[];
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';
const COOKIE_HARV_USERID_NAME = 'harvest-user-id';

export const Index = ({ projectHoursSpent, from, to, hoursTotal, totalProjects, entries }: EntriesProps) => {
    const router = useRouter();
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [ harvestUserId, setHarvestUserId ] = useState<string>(cookies.get(COOKIE_HARV_USERID_NAME) ?? '');
    const [ dateRange, setDateRange ] = useState<[ Date | null, Date | null ]>([ new Date(from), new Date(to) ]);
    console.log(entries);
    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [ harvestToken ])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [ harvestAccountId ]);

    useEffect(() => {
        cookies.set(COOKIE_HARV_USERID_NAME, harvestUserId)
    }, [ harvestUserId ]);

    useEffect(() => {
        const url = `/?from=${ format(dateRange[0] ?? new Date(), DATE_FORMAT) }&to=${ format(dateRange[1] ?? new Date(), DATE_FORMAT) }&token=${ harvestToken }&account=${ harvestAccountId }&userid=${ harvestUserId }`
        router.push(url, url)
    }, [ dateRange ])

    return <div>
        <Card>
            <Typography variant={ 'h2' }>Settings</Typography>
            <CardContent>
                <div>
                    <TextField label={ 'Harvest Access Token' } fullWidth value={ harvestToken }
                        onChange={ (e) => setHarvestToken(e.target.value) }/>
                </div>
                <div>
                    <TextField fullWidth label={ 'Harvest Account Id' } value={ harvestAccountId }
                        onChange={ (e) => setHarvestAccountId(e.target.value) }/>
                </div>
            </CardContent>
        </Card>

        <Card>
            <Typography variant={ 'h2' }>Filters</Typography>
            <CardContent>
                <TextField fullWidth value={ harvestUserId } label={ 'Harvest User Id' }
                    onChange={ (e) => setHarvestUserId(e.target.value) }/>

                <DateRangePicker
                    value={ dateRange }
                    onChange={ (newValue) => setDateRange(newValue) }
                    renderInput={ (startProps, endProps) => (
                        <>
                            <TextField { ...startProps } />
                            <Box sx={ { mx: 2 } }> to </Box>
                            <TextField { ...endProps } />
                        </>
                    ) }
                />
            </CardContent>
        </Card>

        <Card>
            <Typography variant={ 'h2' }>Totals</Typography>
            <CardContent>

                { hoursTotal } { totalProjects }
            </CardContent>
        </Card>


        <Card>
            <Typography variant={ 'h2' }>Data</Typography>
            <CardContent>
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

        <Card>
            <Typography variant={ 'h2' }>Data</Typography>
            <CardContent>
                <DataGrid
                    autoHeight
                    getRowId={ (r: TimeEntry) => r.id }
                    rows={ entries }
                    columns={ [
                        { field: 'id', headerName: 'ID', width: 90 },
                        {
                            field: 'task.name',
                            headerName: 'Task Name',
                            flex: 1,
                            renderCell: ({ field, row }) => <>{ get(row, field) }</>
                        },
                        {
                            field: 'client.name',
                            headerName: 'Client Name',
                            flex: 1,
                            renderCell: ({ field, row }) => <>{ get(row, field) }</>
                        },
                        {
                            field: 'project.code',
                            headerName: 'Project Code',
                            flex: 1,
                            renderCell: ({ field, row }) => <>{ get(row, field) }</>
                        },
                        {
                            field: 'project.name',
                            headerName: 'Project Name',
                            flex: 1,
                            renderCell: ({ field, row }) => <>{ get(row, field) }</>
                        },
                        { field: 'notes', headerName: 'Notes', flex: 1 },
                        { field: 'hours', headerName: 'Hours', width: 90 },

                    ] }
                    disableSelectionOnClick
                    experimentalFeatures={ { newEditingApi: true } }
                />
            </CardContent>
        </Card>
    </div>;

}
export default Index;
