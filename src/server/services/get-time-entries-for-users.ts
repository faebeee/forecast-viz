import { getRedis } from "../redis";
import { HarvestApi } from "../get-harvest";
import { TimeEntry } from "../harvest-types";

export const getTimeEntriesForUser = async (harvest: HarvestApi, userId: number, from: string, to: string): Promise<TimeEntry[]> => {
    const redisKey = `services/entries/${ userId }-${ from }-${ to }`;

    const redis = await getRedis();
    if (redis) {
        const cachedResult = await redis.get(redisKey);
        if (!!cachedResult) {
            return JSON.parse(cachedResult);
        }
    }

    const results = await harvest.getTimeEntries({ userId, from, to });
    if (redis) {
        await redis.set(redisKey, JSON.stringify(results));
        await redis.expire(redisKey, 60 * 15);
    }

    return results;
}

export const getTimeEntriesForUsers = async (harvest: HarvestApi, ids: number[], from: string, to: string) => {
    const results = [];
    for (const id of ids) {
        const entries = await getTimeEntriesForUser(harvest, id, from, to)
        results.push(...entries);
    }

    return results;
}
