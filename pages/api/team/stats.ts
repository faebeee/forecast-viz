import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getHoursPerUser, getProjectsFromEntries, getTeamAssignments } from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { REDIS_CACHE_TTL, TEAMS } from "../../../src/config";
import { TimeEntry } from "../../../src/server/harvest-types";
import { getRedis } from "../../../src/server/redis";

export type GetTeamStatsHandlerResponse = {
    totalMembers: number;
    totalHours: number;
    totalProjects: number;
    hoursPerUser: HoursPerUserItem[];
}
export type HoursPerUserItem = {
    user: string, hours: number
}

export const getTeamStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamStatsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const userData = await harvest.getMe();
    const userId = userData.id;
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);

    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;
    if (!hasTeamAccess || !myTeamEntry) {
        res.status(403).send(null);
        return;
    }

    const teamId = myTeamEntry.key;
    const teamPeople = allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
        .map(p => p.harvest_user_id);

    const redisKey = `team/stats/${ teamId }-${ range.from }-${ range.to }`;

    const redis = await getRedis();
    if (redis) {
        const cachedResult = await redis.get(redisKey);
        if (!!cachedResult) {
            res.send(JSON.parse(cachedResult));
            return;
        }
    }

    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        harvest.getTimeEntriesForUsers(teamPeople, { from: range.from, to: range.to }),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ])
    const teamAssignments = getTeamAssignments(assignments, teamPeople);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const projectMap = forecast.getProjectsMap(projects);
    const totalProjects = getProjectsFromEntries(projectMap, entries, teamAssignments);
    const teamEntries = await harvest.getTimeEntriesForUsers(teamPeople, { from: range.from, to: range.to });

    const hoursPerUser = getHoursPerUser(teamEntries);


    const result = {
        totalHours,
        totalMembers: teamPeople.length,
        totalProjects: totalProjects.length,
        hoursPerUser,
    };

    if (redis) {
        await redis.set(redisKey, JSON.stringify(result));
        await redis.expire(redisKey, REDIS_CACHE_TTL);
    }
    res.send(result);
}
export default getTeamStatsHandler;
