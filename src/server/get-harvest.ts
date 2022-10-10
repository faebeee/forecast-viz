import {
    GetMe,
    GetProjectAssignment, GetProjectBudget,
    GetProjectReports,
    GetTaskReport,
    GetTimeEntriesResponse,
    GetUser, GetUsersAPI, RolesApi,
    TimeEntry
} from "./harvest-types";
import axios from "axios";
import { getRedis } from "./redis";
import { REDIS_CACHE_TTL } from "../config";


export type QueryParams = {
    userId: number;
    from: string;
    to: string;
}


export const getHarvest = async (accessToken: string, accountId: number) => {
    const api = axios.create({
        baseURL: 'https://api.harvestapp.com/v2',
        headers: {
            Authorization: ` Bearer ${ accessToken }`,
            'Harvest-Account-Id': accountId
        }
    })

    const fetchAllPages = async <RET>(url: string, key: string, results: RET): Promise<RET> => {
        const redis = await getRedis();
        const value = await redis.get(url) as string | null;
        if (!!value && value.length > 0) {
            return JSON.parse(value);
        }

        console.log('fetch', url);
        const response = await api.get<{ total_pages: number, page: number, links: { next: string | null } }>(url);
        // @ts-ignore
        const newResults: RET = [ ...results, ...response.data[key] ]

        if (response.data.links.next) {
            return fetchAllPages(response.data.links.next, key, newResults)
        }

        await redis.set(url, JSON.stringify(newResults));
        await redis.expire(url, REDIS_CACHE_TTL);
        return newResults;
    }

    const getTimeEntries = async ({
                                      userId,
                                      from,
                                      to
                                  }: QueryParams): Promise<TimeEntry[]> => {
        try {
            return await fetchAllPages<TimeEntry[]>(`/time_entries?user_id=${ userId }&from=${ from }&to=${ to }`, 'time_entries', []);
        } catch (e) {
            return [];
        }
    }

    const getTimeEntriesForUsers = async (userIds: number[], {
        from,
        to
    }: { from: string, to: string }) => {
        const allLoaders = userIds.map((uid) => getTimeEntries({ userId: uid, from, to }));
        const responses = await Promise.all(allLoaders);
        return responses.reduce((acc, resp) => {
            acc.push(...resp);
            return acc;
        }, []);
    }

    const getProjectBudget = async ({
                                        userId,
                                        from,
                                        to
                                    }: QueryParams): Promise<GetProjectBudget.Result[]> => {
        try {
            const response = await api.get<GetProjectBudget.Response>(`/reports/project_budget`)
            return response.data.results;
        } catch (e) {
            return [];
        }
    }

    const getTasksReport = async ({
                                      userId,
                                      from,
                                      to
                                  }: QueryParams) => {
        const response = await api.get<GetTaskReport.Response>(`/reports/time/tasks?from=${ from }&to=${ to }`)
        return response.data.results;
    }

    const getProjectAssignments = async ({
                                             userId,
                                             from,
                                             to
                                         }: QueryParams): Promise<GetProjectAssignment.ProjectAssignment[]> => {
        const response = await api.get<GetProjectAssignment.GetProjectAssignmentResponse>(`/users/me/project_assignments?from=${ from }&to=${ to }`)
        return response.data.project_assignments;
    }

    const getMe = async (): Promise<GetMe.GetMeResponse> => {
        const response = await api.get(`/users/me`)
        return response.data;
    }


    const getUser = async (uid: number): Promise<GetMe.GetMeResponse> => {
        const response = await api.get(`/users/${ uid }`)
        return response.data;
    }


    const getUsers = async (): Promise<GetUsersAPI.Response | null> => {
        try {
            const response = await api.get(`/users`)
            return response.data;
        } catch (e) {
            return null
        }
    }

    const getRoles = async (): Promise<{ key: string, name: string }[]> => {
        try {
            const roles = await fetchAllPages<RolesApi.Role[]>(`/roles`, 'roles', []);
            return roles.map((role) => {
                return {
                    key: role.name,
                    name: role.name,
                }
            })
        } catch {
            return []
        }
    }

    return {
        getProjectBudget,
        getTimeEntries,
        getTasksReport,
        getMe,
        getUsers,
        getProjectAssignments,
        getTimeEntriesForUsers,
        getRoles,
        getUser,
    }

}
