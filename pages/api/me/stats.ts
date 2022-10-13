import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { filterActiveAssignments, getMyAssignments, getProjectsFromEntries } from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { differenceInBusinessDays, parse } from "date-fns";
import { DATE_FORMAT } from "../../../src/components/date-range-widget";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";

export type GetStatsHandlerResponse = {
    totalHours: number;
    totalPlannedHours: number;
    totalProjects: number;
    avgPerDay: number;
    hoursPerDay: HourPerDayEntry[]
}

export const getStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetStatsHandlerResponse | null>) => {
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

    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        getTimeEntriesForUser(harvest, userId, range.from, range.to),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ])

    const rangeDays = differenceInBusinessDays(parse(range.to, DATE_FORMAT, new Date()), parse(range.from, DATE_FORMAT, new Date())) + 1
    const projectMap = forecast.getProjectsMap(projects);
    const activeAssignments = filterActiveAssignments(projectMap, assignments);
    const myAssignments = getMyAssignments(activeAssignments, userId);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(projectMap, entries, myAssignments);
    const totalProjects = myProjects.length;

    const totalPlannedHours = myAssignments.reduce((acc, assignment) => acc + (assignment.totalHours ?? 0), 0);

    const hoursPerDay: HourPerDayEntry[] = Object.values<{ date: string, hours: number }>(entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, {} as Record<string, HourPerDayEntry>)).reverse();

    const result = {
        totalHours,
        totalPlannedHours,
        totalProjects,
        hoursPerDay,
        avgPerDay: (totalHours / rangeDays),
    }

    res.send(result);
}
export default getStatsHandler;
