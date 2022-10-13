import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getProjectsFromEntries, getTeamAssignments } from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { REDIS_CACHE_TTL } from "../../../src/config";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { orderBy } from "lodash";
import { getRedis } from "../../../src/server/redis";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";

export type GetCompanyStatsHandlerResponse = {
    totalMembers: number;
    totalHours: number;
    totalProjects: number;
    hoursPerDay: HourPerDayEntry[];
    hoursPerProject: HoursPerProjectEntry[];
}

export type HoursPerProjectEntry = {
    name: string,
    hours: number;
}

export const getCompanyStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetCompanyStatsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const peopleIds = allPeople.map((p) => p.harvest_user_id);


    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        getTimeEntriesForUsers(harvest, peopleIds, range.from, range.to),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ])

    const teamAssignments = getTeamAssignments(assignments, peopleIds);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const projectMap = forecast.getProjectsMap(projects);
    const totalProjects = getProjectsFromEntries(projectMap, entries, teamAssignments);

    const hoursPerProject = entries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                name: entry.project.code || entry.project.name || 'UNKNOWN',
                hours: 0,
            }
        }
        acc[entry.project.id].hours += entry.hours;
        return acc;
    }, {} as Record<string, HoursPerProjectEntry>);

    const hoursPerDay = entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, {} as Record<string, HourPerDayEntry>);


    const result = {
        totalHours,
        hoursPerProject: Object.values(hoursPerProject),
        hoursPerDay: orderBy(Object.values(hoursPerDay), 'date'),
        totalMembers: peopleIds.length,
        totalProjects: totalProjects.length,
    };

    res.send(result);
}
export default getCompanyStatsHandler;
