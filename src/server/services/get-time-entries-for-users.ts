import { HarvestApi } from "../get-harvest";
import { TimeEntry } from "../harvest-types";
import {getCache} from "./cache";
import {DEFAULT_CACHE_TTL} from "../../config";

export const getTimeEntriesForUser = async (harvest: HarvestApi, userId: number, from: string, to: string, projectId?: number): Promise<TimeEntry[]> => {
    const redisKey = `services/entries/${ userId }-${ from }-${ to }-${projectId}`;
    const cache = getCache();
    const cachedResult = await cache.get(redisKey) as TimeEntry[]
        if (!!cachedResult) {
            return cachedResult;
        }

    const results = await harvest.getTimeEntries({ userId, from, to, project_id: projectId });

    await cache.set(redisKey, results, DEFAULT_CACHE_TTL);

    return results;
}

export const getTimeEntriesForUsers = async (harvest: HarvestApi, ids: number[], from: string, to: string, projectId?: number) => {
    const results = [];
    for (const id of ids) {
        const entries = await getTimeEntriesForUser(harvest, id, from, to, projectId)
        results.push(...entries);
    }

    return results;
}
