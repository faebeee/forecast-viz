import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    billableHourPercentage, BillableHours, excludeLeaveTasks,
    filterEntriesForUser, getBillableHours,
    getHoursPerTask,
    getHoursPerUser,
    getHoursPerUserHistory,
    getProjectsFromEntries,
    getTeamAssignments, getTeamHoursEntries, HourPerTaskObject
} from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import {DEFAULT_CACHE_TTL, TEAMS} from "../../../src/config";
import { TimeEntry } from "../../../src/server/harvest-types";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";
import { parse } from "date-fns";
import {DATE_FORMAT} from "../../../src/context/formats";
import {withApiRouteSession} from "../../../src/server/with-session";
import {round} from "lodash";
import { getAdminAccess } from "../../../src/server/has-admin-access";
import {getCache} from "../../../src/server/services/cache";

export type GetTeamStatsHandlerResponse = {
    totalMembers: number;
    totalHours: number;
    totalProjects: number;
    hoursPerUser: HoursPerUserItem[];
    plannedHoursPerUser: HoursPerUserItem[];
    hoursPerUserHistory: HoursPerUserItemHistory[];
    hoursPerTask: HourPerTaskObject[];
    hours: BillableHours,
    statsPerUser: { user: string, lastEntryDate: string, billableRate: number }[]
}
export type HoursPerUserItemHistory = {
    user: string;
    entries: Record<string, number>;
}
export type HoursPerUserItem = {
    user: string, hours: number
}

export const getTeamStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamStatsHandlerResponse | null>) => {
    const projectId = req.query['project_id'] ? parseInt(req.query['project_id'] as string) : undefined;
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const userData = await harvest.getMe();
    const userId = userData.id;
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);

    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const hasTeamAccess = getAdminAccess(myDetails?.roles ?? []);
    if (!hasTeamAccess || !myTeamEntry) {
        res.status(403).send(null);
        return;
    }

    const teamId = myTeamEntry.key;
    const teamPeople = allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
    const teamPeopleIds = teamPeople
        .map(p => p.harvest_user_id);

    const cacheKey = `team/stats/${ teamId }-${ range.from }-${ range.to }-${ projectId }`;

    const cache = getCache();
    const cachedResult = await cache.get(cacheKey)
    if (!!cachedResult) {
        res.send(cachedResult as GetTeamStatsHandlerResponse);
        return;
    }

    const fromDate = parse(range.from, DATE_FORMAT, new Date());
    const toDate = parse(range.to, DATE_FORMAT, new Date());

    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        getTimeEntriesForUsers(harvest, teamPeopleIds, range.from, range.to, projectId),
        forecast.getAssignments(range.from, range.to, projectId),
        forecast.getProjects(),
    ])
    const teamAssignments = getTeamAssignments(assignments, teamPeopleIds);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const projectMap = forecast.getProjectsMap(projects);
    const totalProjects = getProjectsFromEntries(projectMap, entries, teamAssignments);
    const teamEntries = await harvest.getTimeEntriesForUsers(teamPeopleIds, {
        from: range.from,
        to: range.to,
        project_id: projectId
    });

    const hoursPerUser = getHoursPerUser(teamEntries);
    const hoursPerUserHistory = getHoursPerUserHistory(teamEntries, fromDate, toDate);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);

    const plannedHoursPerUser = teamProjectHourEntries.reduce((accumulator, entry) => {
        if (!accumulator.has(entry.userId)) {
            accumulator.set(entry.userId, { user: entry.user, hours: 0 });
        }
        const a = accumulator.get(entry.userId);
        accumulator.set(entry.userId, { user: entry.user, hours: a!.hours + entry.hours_forecast });

        return accumulator;
    }, new Map<number, HoursPerUserItem>());

    const attendanceEntries = excludeLeaveTasks(entries)
    const billableHours = getBillableHours(attendanceEntries)

    const hoursPerTask = getHoursPerTask(entries);

    const statsPerUser = teamPeople.map((person) => {
        const usersEntries = filterEntriesForUser(entries, person.harvest_user_id);
        const lastEntryDate = usersEntries[0]?.spent_date ?? '?';
        const attendanceEntries = excludeLeaveTasks(usersEntries)
        const billableHoursPerUser = getBillableHours(attendanceEntries);
        const billableRatePerUser = billableHourPercentage(billableHoursPerUser)
        return {
            user: `${ person.first_name } ${ person.last_name }`,
            lastEntryDate,
            billableRate: round(billableRatePerUser, 2)
        }
    })

    const result = {
        totalHours,
        totalMembers: teamPeopleIds.length,
        totalProjects: totalProjects.length,
        hoursPerUser,
        hoursPerUserHistory,
        plannedHoursPerUser: Array.from(plannedHoursPerUser.values()),
        hoursPerTask,
        hours: billableHours,
        statsPerUser,
    };

    cache.set(cacheKey, result, DEFAULT_CACHE_TTL)

    res.send(result);
}
export default withApiRouteSession(getTeamStatsHandler);
