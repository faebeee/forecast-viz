import {HarvestApi} from "../get-harvest";
import {TimeEntry} from "../harvest-types";
import {getCache} from "./cache";
import {DEFAULT_CACHE_TTL} from "../../config";

export const getTimeEntriesForUser = async (harvest: HarvestApi, userId: number, from: string, to: string, projectId?: number): Promise<TimeEntry[]> => {
    return await getCache().getAndSet(`services/entries/${userId}-${from}-${to}-${projectId}`, () =>
        harvest.getTimeEntries({
        userId,
        from,
        to,
        project_id: projectId
    }), DEFAULT_CACHE_TTL);
}

export const getTimeEntriesForUsers = async (harvest: HarvestApi, ids: number[], from: string, to: string, projectId?: number) => {
    const results = [];
    for (const id of ids) {
        const entries = await getTimeEntriesForUser(harvest, id, from, to, projectId)
        results.push(...entries);
    }

    return results;
}
