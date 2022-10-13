import { getRedis } from "../redis";
import { HarvestApi } from "../get-harvest";
import { REDIS_CACHE_TTL } from "../../config";
import { TimeEntry } from "../harvest-types";

export const getTimeEntriesForUser = async (harvest: HarvestApi, userId: number, from: string, to: string): Promise<TimeEntry[]> => {
    const redisKey = `services/entries/${ userId }${ from }-${ to }`;

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
    const redisKey = `services/entries/${ ids.join(':') }${ from }-${ to }`;

    const redis = await getRedis();
    if (redis) {
        const cachedResult = await redis.get(redisKey);
        if (!!cachedResult) {
            return JSON.parse(cachedResult);
        }
    }

    const results = await Promise.all(ids.map(id => getTimeEntriesForUser(harvest, id, from, to)))
    const allResults = results.reduce((acc, res) => {
        return acc.concat(res);
    }, []);

    if (redis) {
        await redis.set(redisKey, JSON.stringify(allResults));
        await redis.expire(redisKey, 60 * 15);
    }

    return allResults;
}
