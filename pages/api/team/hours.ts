import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    getMyAssignments,
    getProjectsFromEntries,
    getTeamProjectHours,
    SpentProjectHours
} from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";
import { REDIS_CACHE_TTL, TEAMS } from "../../../src/config";
import { getRedis } from "../../../src/server/redis";

export type GetTeamHoursHandlerResponse = {
    hours: SpentProjectHours[];
}

export const getTeamHoursHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamHoursHandlerResponse | null>) => {
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
    const teamId = myTeamEntry!.key;
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;

    if (!hasTeamAccess || !myTeamEntry) {
        res.status(403).send(null);
        return;
    }

    const redisKey = `team/hours/${ teamId }-${ range.from }-${ range.to }`;

    const redis = await getRedis();
    if (redis) {
        const cachedResult = await redis.get(redisKey);
        if (!!cachedResult) {
            res.send(JSON.parse(cachedResult));
            return;
        }
    }

    const teamPeople = allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
        .map(p => p.harvest_user_id);
    const teamEntries = await harvest.getTimeEntriesForUsers(teamPeople, { from: range.from, to: range.to });
    const teamProjectHours = getTeamProjectHours(teamEntries);

    const result = {
        hours: Object.values(teamProjectHours),
    };

    if (redis) {
        await redis.set(redisKey, JSON.stringify(result));
        await redis.expire(redisKey, REDIS_CACHE_TTL);
    }
    res.send(result);
}
export default getTeamHoursHandler;
