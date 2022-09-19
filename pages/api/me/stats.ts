import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getMyAssignments, getProjectsFromEntries } from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";

export type GetStatsHandlerResponse = {
    totalHours: number;
    totalPlannedHours: number;
    totalProjects: number
}

export const getStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetStatsHandlerResponse | null>) => {
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
    const [ entries, assignments ] = await Promise.all([
        await harvest.getTimeEntries({ userId: userId, from: range.from, to: range.to }),
        await forecast.getAssignments(range.from, range.to)
    ])
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);

    const totalProjects = getProjectsFromEntries(entries).length;

    const myAssignments = getMyAssignments(assignments, userId);
    const totalPlannedHours = myAssignments.reduce((acc, assignment) => acc + (assignment.totalHours ?? 0), 0);


    res.send({
        totalHours,
        totalPlannedHours,
        totalProjects
    });
}
export default getStatsHandler;
