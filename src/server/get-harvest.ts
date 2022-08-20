import {
    GetMe,
    GetProjectAssignment, GetProjectBudget,
    GetProjectReports,
    GetTaskReport,
    GetTimeEntriesResponse,
    GetUser,
    TimeEntry
} from "./harvest-types";
import axios from "axios";

export type QueryParams = {
    userId: number;
    from: string;
    to: string;
}

export const getHarvest = (accessToken: string, accountId: number) => {
    const api = axios.create({
        baseURL: 'https://api.harvestapp.com/v2',
        headers: {
            Authorization: ` Bearer ${accessToken}`,
            'Harvest-Account-Id': accountId
        }
    })

    const getTimeEntries = async ({
                                      userId,
                                      from,
                                      to
                                  }: QueryParams): Promise<TimeEntry[]> => {
        try {
            const response = await api.get<GetTimeEntriesResponse>(`/time_entries?user_id=${userId}&from=${from}&to=${to}`);
            return response.data.time_entries ?? [];
        } catch (e) {
            return [];
        }
    }


    const getProjectBudget = async ({
                                         userId,
                                         from,
                                         to
                                     }: QueryParams):Promise<GetProjectBudget.Result[]> => {
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
        const response = await api.get<GetTaskReport.Response>(`https://api.harvestapp.com/v2/reports/time/tasks?from=${from}&to=${to}`)
        return response.data.results;
    }

    const getProjectAssignments = async ({
                                             userId,
                                             from,
                                             to
                                         }: QueryParams): Promise<GetProjectAssignment.GetProjectAssignmentResponse> => {
        const response = await api.get<GetProjectAssignment.GetProjectAssignmentResponse>(`/users/me/project_assignments?from=${from}&to=${to}`)
        return response.data.project_assignments;
    }

    const getMe = async (): Promise<GetMe.GetMeResponse> => {
        const response = await api.get(`/users/me`)
        return response.data;
    }

    return {
        getProjectBudget,
        getTimeEntries,
        getTasksReport,
        getMe,
        getProjectAssignments,
    }

}
