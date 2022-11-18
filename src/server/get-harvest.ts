import {
    AccountsApi,
    GetMe,
    GetProjectAssignment,
    GetProjectBudget,
    GetTaskReport,
    GetUsersAPI,
    RolesApi,
    TimeEntry
} from "./harvest-types";
import axios from "axios";


export type QueryParams = {
    userId: number;
    from: string;
    to: string;
    project_id?: number;
}


export const getHarvest = async (accessToken: string, accountId?: number) => {
    const headers: { [index: string]: string | number } = {
        Authorization: ` Bearer ${accessToken}`,
    }
    if (accountId) {
        headers['Harvest-Account-Id'] = accountId
    }
    const api = axios.create({
        baseURL: accountId ? 'https://api.harvestapp.com/v2' : 'https://id.getharvest.com/api/v2',
        headers
    })



    const fetchAllPages = async <RET>(url: string, key: string, results: RET): Promise<RET> => {
        try {

            const response = await api.get<{ total_pages: number, page: number, links: { next: string | null } }>(url);
            console.log('fetched', url);
            // @ts-ignore
            const newResults: RET = [ ...results, ...response.data[key] ]

            if (response.data.links.next) {
                return fetchAllPages(response.data.links.next, key, newResults)
            }
            return newResults;
        } catch (e) {
            throw e;
        }
    }

    const getTimeEntries = async ({
                                      userId,
                                      from,
                                      to,
                                      project_id
                                  }: QueryParams): Promise<TimeEntry[]> => {
        const params = new URLSearchParams();
        params.set('user_id', userId.toString());
        params.set('from', from);
        params.set('to', to);
        if (project_id) {
            params.set('project_id', project_id.toString());
        }
        const url = `/time_entries?${ params.toString() }`;
        try {
            return await fetchAllPages<TimeEntry[]>(url, 'time_entries', []);
        } catch (e) {
            return [];
        }
    }

    const getTimeEntriesForUsers = async (userIds: number[], {
        from,
        to,
        project_id
    }: { from: string, to: string, project_id?: number; }) => {
        const allLoaders = userIds.map((uid) => getTimeEntries({ userId: uid, from, to, project_id }));
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

    const getAccounts = async (): Promise<AccountsApi.Response | null> => {
        try {
            const response = await api.get(`/accounts`)
            return response.data;
        } catch (e) {
            return null
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
        getAccounts,
        fetchAllPages,
    }

}

export type HarvestApi = Awaited<ReturnType<typeof getHarvest>>
