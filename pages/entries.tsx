import {getHarvest} from "../src/server/get-harvest";
import uniq from "lodash/uniq";
import {TimeEntry} from "../src/server/harvest-types";
import {Table, Panel, Input} from 'rsuite';
import {useEffect, useState} from "react";
import cookies from 'js-cookie';
import {DateRangePicker} from 'rsuite';
import {useRouter} from "next/router";
import {format} from 'date-fns';
import Cookies from 'cookies'
import {NextApiRequest, NextApiResponse} from "next";


export const getServerSideProps = async (req: NextApiRequest, res: NextApiResponse) => {
    const {from, to} = req.query;
    const token = null;
    const account = null;
    const userId = 1903105

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

    const entries = await api.getTimeEntries({userId, from, to});

    const projects = uniq(entries.reduce((acc, entry) => {
        acc.push(entry.project.name)
        return acc;
    }, []));

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
    }, {});

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
    projectHoursSpent: unknown[];
}

const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';

export const Entries = ({projectHoursSpent, from, to}: EntriesProps) => {
    const router = useRouter();
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME));
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME));
    const [dateRange, setDateRange] = useState([new Date(from), new Date(to)]);

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);

    useEffect(() => {
        router.push(`/entries?from=${format(dateRange[0], 'yyyy-MM-dd')}&to=${format(dateRange[1], 'yyyy-MM-dd')}`)
    }, [dateRange])


    return <div>
        <Panel header="Time spent on Projects" shaded>
            <Input value={harvestToken} placeholder={'Harvest Access Token'}
                   onChange={(e) => setHarvestToken(e as string)}/>
            <Input value={harvestAccountId} placeholder={'Harvest Account Id'}
                   onChange={(e) => setHarvestAccountId(e as string)}/>

            <DateRangePicker value={dateRange} onChange={setDateRange}/>
        </Panel>


        <Panel header="Time spent on Projects" shaded>
            <Table
                autoHeight
                data={projectHoursSpent}>
                <Table.Column flexGrow={1}>
                    <Table.HeaderCell>ID</Table.HeaderCell>
                    <Table.Cell dataKey="projectId"/>
                </Table.Column>

                <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Project</Table.HeaderCell>
                    <Table.Cell dataKey="projectName"/>
                </Table.Column>

                <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Hours</Table.HeaderCell>
                    <Table.Cell dataKey="hours"/>
                </Table.Column>
            </Table>
        </Panel>
    </div>;

}
export default Entries;
