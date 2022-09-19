import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { TimeEntry } from "../../../src/server/harvest-types";
import { AssignmentEntry, getForecast } from "../../../src/server/get-forecast";
import { getMyAssignments } from "../../../src/server/utils";

export type GetHoursHandlerResponse = ProjectHours[];
export type ProjectHours = {
    hoursSpent: number;
    hoursPlanned: number;
    name?: string;
    code?: string;
    id: number;
}

export const getHoursHandler = async (req: NextApiRequest, res: NextApiResponse<GetHoursHandlerResponse>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send([]);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const userData = await harvest.getMe();
    const userId = userData.id;
    const [ entries, assignments ]: [ TimeEntry[], AssignmentEntry[] ] = await Promise.all([
        harvest.getTimeEntries({ userId: userId, from: range.from, to: range.to }),
        forecast.getAssignments(range.from, range.to)
    ]);
    const myAssignments = getMyAssignments(assignments, userId);

    const projectMap: Record<number, ProjectHours> = {};
    entries.forEach((e) => {
        if (!projectMap[e.project?.id]) {
            projectMap[e.project?.id] = {
                hoursSpent: 0,
                hoursPlanned: 0,
                name: e.project?.name,
                code: e.project.code,
                id: e.project.id,
            }
        }
    });

    myAssignments.forEach((e) => {
        if (e.project?.harvest_id && !projectMap[e.project?.harvest_id]) {
            projectMap[e.project?.harvest_id] = {
                hoursSpent: 0,
                hoursPlanned: 0,
                name: e.project?.name,
                code: e.project?.code,
                id: e.project?.id,
            }
        }
    });

    entries.forEach((e) => {
        projectMap[e.project?.id].hoursSpent += e.hours;
    });

    myAssignments.forEach((e) => {
        if (!e.project?.harvest_id) {
            return;
        }
        projectMap[e.project.harvest_id].hoursPlanned += e.totalHours ?? 0;
    });

    res.send(Object.values(projectMap));
}
export default getHoursHandler;
