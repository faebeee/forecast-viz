import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getMyAssignments, getProjectsFromEntries } from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";

export type GetStatsHandlerResponse = {
    totalHours: number;
    totalPlannedHours: number;
    totalProjects: number
    hoursPerDay: { date: string, hours: number }[]
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
    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        await harvest.getTimeEntries({ userId: userId, from: range.from, to: range.to }),
        await forecast.getAssignments(range.from, range.to),
        await forecast.getProjects(),
    ])
    const myAssignments = getMyAssignments(assignments, userId);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(projects, entries, myAssignments);
    const totalProjects = myProjects.length;
    const totalPlannedHours = myAssignments.reduce((acc, assignment) => acc + (assignment.totalHours ?? 0), 0);
    const hoursPerDay: { date: string, hours: number }[] = Object.values<{ date: string, hours: number }>(entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, {} as Record<string, { date: string, hours: number }>)).reverse();


    res.send({
        totalHours,
        totalPlannedHours,
        totalProjects,
        hoursPerDay
    });
}
export default getStatsHandler;
