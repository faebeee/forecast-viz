import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getMyAssignments } from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";

export type GetAssignmentsHandlerResponse = {
    assignments: GetAssignmentsHandlerEntry[]
}

export type GetAssignmentsHandlerEntry = {
    name?: string;
    id?: number | string;
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
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);

    const userData = await harvest.getMe();
    const userId = userData.id;

    const assignments = await forecast.getAssignments(range.from, range.to);
    const myAssignments = getMyAssignments(assignments, userId);

    const map: Record<number | string, GetAssignmentsHandlerEntry> = {};
    myAssignments.forEach((a) => {
        const key = a.project?.harvest_id ?? a.project?.name;
        if (!key) {
            return;
        }
        if (!map[key]) {
            map[key] = {
                name: a.project?.name,
                code: a.project?.code,
                id: a.project?.harvest_id ?? a.project?.name,
                hoursPerDay: 0,
                totalHours: 0,
                days: 0,
                startDate: a.start_date,
                endDate: a.end_date,
            }
        }

        map[key].hoursPerDay! += a.hoursPerDay ?? 0;
        map[key].totalHours! += a.totalHours ?? 0;
        map[key]!.days! += a.days ?? 0;
    })

    const result = {
        assignments: Object.values(map),
    }

    res.send(result);
}

export default getAssignmentsHandler;
