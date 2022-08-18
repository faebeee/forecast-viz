import {GetProjectReports, GetTaskReport, GetTimeEntriesResponse, TimeEntry} from "./harvest-types";
import axios from "axios";

export type QueryParams = {
    userId: number;
    from: string;
    to: string;
}

export const getHarvest = (accessToken: string, accountId: string) => {
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
        const response = await api.get<GetTimeEntriesResponse>(`/time_entries?user_id=${userId}&from=${from}&to=${to}`);
        return response.data.time_entries;
    }


    const getProjectsReport = async ({
                                         userId,
                                         from,
                                         to
                                     }: QueryParams) => {
        const response = await api.get<GetProjectReports.Response>(`/reports/time/projects?user_id=${userId}&from=${from}&to=${to}`)
        return response.data.results;
    }
    const getTasksReport = async ({
                                         userId,
                                         from,
                                         to
                                     }: QueryParams) => {
        const response = await api.get<GetTaskReport.Response>(`https://api.harvestapp.com/v2/reports/time/tasks?from=${from}&to=${to}`)
        return response.data.results;
    }

    return {
        getProjectsReport,
        getTimeEntries,
        getTasksReport,
    }

}
