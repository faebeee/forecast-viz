import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";

export type MappedTimeEntry = {
    id: number,
    projectId: number,
    projectCode: string,
    hours: number,
    notes: any,
    billable: boolean;
    isRunning: boolean;
}

export const getEntriesHandler = async (req: NextApiRequest, res: NextApiResponse<MappedTimeEntry[]>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send([]);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const userData = await harvest.getMe();
    const userId = userData.id;

    const entries = await getTimeEntriesForUser(harvest, userId, range.from, range.to);
    const mappedEntries: MappedTimeEntry[] = entries.map((e) => {
        return {
            id: e.id,
            projectId: e.project.id,
            projectName: e.project.name,
            projectCode: e.project.code,
            billable: e.billable,
            hours: e.hours,
            notes: e.notes,
            isRunning: e.is_running,
            date: e.spent_date,
        }
    });

    res.send(mappedEntries);
}
export default getEntriesHandler;
