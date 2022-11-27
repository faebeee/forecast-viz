import useSWR from 'swr'
import {getAxios} from "../get-axios";
import {GetMyUserHandlerResponse} from "../../pages/api/user/me";
import {GetEntriesHandlerResponse} from "../../pages/api/user/entries";
import {GetStatsHandlerResponse} from "../../pages/api/user/stats";
import {GetAssignmentsHandlerResponse} from "../../pages/api/user/assignments";
import {GetHoursHandlerResponse} from "../../pages/api/user/hours";
import {useFilterContext} from "../context/filter-context";
import {GetTeamStatsHandlerResponse} from "../../pages/api/team/stats";
import {GetTeamHoursHandlerResponse} from "../../pages/api/team/hours";
import {GetTeamEntriesHandlerResponse} from "../../pages/api/team/entries";
import {GetCompanyStatsHandlerResponse} from "../../pages/api/company/stats";
import {GetTeamsStatsHandlerResponse} from "../../pages/api/company/teams";
import {GetProjectsApiHandlerResponse} from "../../pages/api/user/projects";

export interface RemoteCall<T> {
    isLoading: boolean
    error?: Error
    data?: T
}

export interface RangeParams {
    from: string
    to: string
}
export interface ProjectParam {
    projectId: string
}
export interface UserParam {
    uid: string
}

export type DefaultParams = RangeParams & Partial<ProjectParam> & Partial<UserParam>


export const useMe = (): RemoteCall<GetMyUserHandlerResponse> => useRemote(`/user/me`)
export const useHours = (params: DefaultParams, fallbackData?: GetHoursHandlerResponse): RemoteCall<GetHoursHandlerResponse> => useRemote(`/user/hours`, params, fallbackData)
export const useEntries = (params: DefaultParams ): RemoteCall<GetEntriesHandlerResponse> => useRemote(`/user/entries`, params)
export const useAssignments = (params: DefaultParams, fallbackData?: GetAssignmentsHandlerResponse): RemoteCall<GetAssignmentsHandlerResponse> => useRemote(`/user/assignments`, params, fallbackData)
export const useEntriesDetailed = (params: DefaultParams , fallbackData?: GetHoursHandlerResponse): RemoteCall<GetHoursHandlerResponse> => useRemote(`/user/entries-detailed`, params, fallbackData)

export const useStats = (params: DefaultParams): RemoteCall<GetStatsHandlerResponse> => useRemote(`/user/stats`, params, StatsDefaultValue)
export const useTeamStats = (params: RangeParams & Partial<ProjectParam>, fallbackData?: GetTeamStatsHandlerResponse): RemoteCall<GetTeamStatsHandlerResponse> => useRemote(`/team/stats`, params, fallbackData)
export const useProjects = (params: RangeParams & UserParam, fallbackData?: any): RemoteCall<GetProjectsApiHandlerResponse> => useRemote(`/user/projects`, params, fallbackData)
export const useTeamHours = (params: RangeParams & Partial<ProjectParam>, fallbackData?: GetTeamHoursHandlerResponse): RemoteCall<GetTeamHoursHandlerResponse> => useRemote(`/team/hours`, params, fallbackData)
export const useTeamEntries = (params: RangeParams & Partial<ProjectParam>, fallbackData?: GetTeamEntriesHandlerResponse): RemoteCall<GetTeamEntriesHandlerResponse> => useRemote(`/team/entries`, params, fallbackData)
export const useCompanyStats = (params: RangeParams, fallbackData?: GetCompanyStatsHandlerResponse): RemoteCall<GetCompanyStatsHandlerResponse> => useRemote(`/company/stats`, params, fallbackData)
export const useCompanyTeamsStats = (params: RangeParams , fallbackData?: GetTeamsStatsHandlerResponse): RemoteCall<GetTeamsStatsHandlerResponse> => useRemote(`/company/teams`, params, fallbackData)

export const StatsDefaultValue: GetStatsHandlerResponse = {
    hoursPerNonBillableTasks: [],
    billableHoursPerDay: [], nonBillableHoursPerDay: [],
    overtimePerDay: [],
    lastEntryDate: "",
    hoursPerTask: [],
    avgPerDay: 0,
    totalHours: 0,
    totalPlannedHours: 0,
    totalProjects: 0,
    billableHours: 0,
    billableHoursPercentage: 0,
    hoursPerDay: [],
    nonBillableHours: 0,
    totalHoursPerDayCapacity: 0,
    totalWeeklyCapacity: 0

}

export const useRemote = <T>(url: string, params?: any, fallbackData?: T): RemoteCall<T> => {
    const {
        data,
        error
    } = useSWR([url, params], () => getAxios().get<T>(url, {params}).then(res => res.data), {fallbackData})
    return {
        isLoading: !data && !error,
        error,
        data,
    }
};

export const useFilteredStats = (params: Partial<UserParam>): RemoteCall<GetStatsHandlerResponse> => {
    // can only be used within a FilterContext (inside a component wrapped in a React.Context / FilterContext)
    const filterContext = useFilterContext()
    const from = filterContext.dateRange[0]
    const to = filterContext.dateRange[1]
    return useRemote(`/user/stats`, {
        ...params,
        from,
        to
    })
}
