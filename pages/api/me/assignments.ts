import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getMyAssignments, getProjectsFromEntries } from "../../../src/server/utils";
import { AssignmentEntry, getForecast } from "../../../src/server/get-forecast";

export type GetAssignmentsHandlerResponse = {
    assignments: GetAssignmentsHandlerEntry[]
}

export type GetAssignmentsHandlerEntry = {
    name?: string;
    id: number;
    code?: string;
    hoursPerDay: number;
    totalHours: number;
    days: number;
    startDate: string;
    endDate: string;
}

export const getAssignmentsHandler = async (req: NextApiRequest, res: NextApiResponse<GetAssignmentsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);

    const userData = await harvest.getMe();
    const userId = userData.id;
    const assignments = await forecast.getAssignments(range.from, range.to);
    const myAssignments = getMyAssignments(assignments, userId);

    const map: Record<number, GetAssignmentsHandlerEntry> = {};
    myAssignments.forEach((a) => {
        if (!a.project?.harvest_id) {
            return;
        }
        if (!map[a.project.harvest_id]) {
            map[a.project.harvest_id] = {
                name: a.project?.name,
                code: a.project?.code,
                id: a.project?.harvest_id,
                hoursPerDay: 0,
                totalHours: 0,
                days: 0,
                startDate: a.start_date,
                endDate: a.end_date,
            }
        }

        map[a.project.harvest_id].hoursPerDay! += a.hoursPerDay ?? 0;
        map[a.project.harvest_id].totalHours! += a.totalHours ?? 0;
        map[a.project.harvest_id]!.days! += a.days ?? 0;
    })

    res.send({
        assignments: Object.values(map),
    });
}

export default getAssignmentsHandler;
