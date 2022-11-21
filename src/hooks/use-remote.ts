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
export const useEntries = (params: DefaultParams ): RemoteCall<GetEntriesHandlerResponse> => useRemote(`/user/entries`, params)

export const useFilteredStats = (params: { uid?: string }): RemoteCall<GetStatsHandlerResponse> => {
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





export const useStats = (params: { from: string, to: string, uid?: string, projectId?: string }, fallbackData?: any): RemoteCall<GetStatsHandlerResponse> => useRemote(`/user/stats`, params, fallbackData)
export const useAssignments = (params: DefaultParams, fallbackData?: any): RemoteCall<GetAssignmentsHandlerResponse> => useRemote(`/user/assignments`, params, fallbackData)
export const useHours = (params: DefaultParams, fallbackData?: any): RemoteCall<GetHoursHandlerResponse> => useRemote(`/user/hours`, params, fallbackData)
export const useEntriesDetailed = (params: { from: string, to: string, uid: string, projectId: string }, fallbackData?: any): RemoteCall<GetHoursHandlerResponse> => useRemote(`/user/entries-detailed`, params, fallbackData)

export const useTeamStats = (params: { from: string, to: string, projectId: string | undefined }, fallbackData?: any): RemoteCall<GetTeamStatsHandlerResponse> => useRemote(`/team/stats`, params, fallbackData)
export const useTeamHours = (params: { from: string, to: string, projectId: string | undefined }, fallbackData?: any): RemoteCall<GetTeamHoursHandlerResponse> => useRemote(`/team/hours`, params, fallbackData)
export const useTeamEntries = (params: { from: string, to: string, projectId: string | undefined }, fallbackData?: any): RemoteCall<GetTeamEntriesHandlerResponse> => useRemote(`/team/entries`, params, fallbackData)

export const useCompanyStats = (params: { from: string, to: string }, fallbackData?: any): RemoteCall<GetCompanyStatsHandlerResponse> => useRemote(`/company/stats`, params, fallbackData)
export const useCompanyTeamsStats = (params: { from: string, to: string }, fallbackData?: any): RemoteCall<GetTeamsStatsHandlerResponse> => useRemote(`/company/teams`, params, fallbackData)
export const useProjects = (params: { from: string, to: string, uid: string }, fallbackData?: any): RemoteCall<GetProjectsApiHandlerResponse> => useRemote(`/user/projects`, params, fallbackData)

export const useRemote = <T>(url: string, params?: any, fallbackData?: any): RemoteCall<T> => {
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