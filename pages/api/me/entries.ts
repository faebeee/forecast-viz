import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getRedis } from "../../../src/server/redis";
import { REDIS_CACHE_TTL } from "../../../src/config";

export type MappedTimeEntry = {
    id: number,
    projectId: number,
    projectCode: string,
    hours: number,
    notes: any,
    billable: boolean;
    isRunning: boolean;
}

export const getEntriesHandler = async (req: NextApiRequest, res: NextApiResponse<MappedTimeEntry[]>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send([]);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const userData = await harvest.getMe();
    const userId = userData.id;
    const redisKey = `me/entries/${ userId }-${ range.from }-${ range.to }`;

    const redis = await getRedis();
    if (redis) {
        const cachedResult = await redis.get(redisKey);
        if (!!cachedResult) {
            res.send(JSON.parse(cachedResult));
            return;
        }
    }

    const entries = await harvest.getTimeEntries({ userId: userId, from: range.from, to: range.to });
    const mappedEntries: MappedTimeEntry[] = entries.map((e) => {
        return {
            id: e.id,
            projectId: e.project.id,
            projectName: e.project.name,
            projectCode: e.project.code,
            billable: e.billable,
            hours: e.hours,
            notes: e.notes,
            isRunning: e.is_running,
            date: e.spent_date,
        }
    });

    if (redis) {
        await redis.set(redisKey, JSON.stringify(mappedEntries));
        await redis.expire(redisKey, REDIS_CACHE_TTL);
    }

    res.send(mappedEntries);
}
export default getEntriesHandler;
