import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";
import {withApiRouteSession} from "../../../src/server/with-session";
import {excludeLeaveTasks} from "../../../src/server/utils";

export type SimpleTimeEntry = {
    id: number;
    client: string;
    notes: string;
    projectName: string;
    projectCode: string;
    hours: number;
    billable: boolean;
    task: string;
    spent: string;
}

export type GetEntriesDetailedHandlerResponse = {
    entries: SimpleTimeEntry[];
}
export const getEntriesDetailedHandler = async (req: NextApiRequest, res: NextApiResponse<GetEntriesDetailedHandlerResponse>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send({ entries: [] });
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const userData = await harvest.getMe();
    const userId = req.query.uid ? parseInt(req.query.uid as string) : userData.id;
    const projectId = req.query['project_id'] ? parseInt(req.query['project_id'] as string) : undefined;
    const entries = await getTimeEntriesForUser(harvest, userId, range.from, range.to, projectId);
    const filteredEntries = excludeLeaveTasks(entries)
    const flattedEntries: SimpleTimeEntry[] = filteredEntries.map((e) => ({
        id: e.id,
        client: e.client.name,
        notes: e.notes,
        projectName: e.project.name,
        projectCode: e.project.code,
        hours: e.hours,
        billable: e.billable,
        task: e.task.name,
        spent: e.spent_date,
    }))

    const result = {
        entries: flattedEntries,
    };

    res.send(result);
}
export default withApiRouteSession(getEntriesDetailedHandler);
