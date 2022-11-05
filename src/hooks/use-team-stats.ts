import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetTeamStatsHandlerResponse, HoursPerUserItem } from "../../pages/api/team/stats";
import { TeamStatsApiContextValue } from "../context/team-stats-api-context";

export const useTeamStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ data, setData ] = useState<GetTeamStatsHandlerResponse>(TeamStatsApiContextValue)

    const load = useCallback((from: string, to: string, projectId?: number | null) => {
        setIsLoading(true)
        getAxios().get<GetTeamStatsHandlerResponse>(`/team/stats?from=${ from }&to=${ to }&project_id=${ projectId }`)
            .then(({ data }) => {
                setData(data)
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        ...data
    }
}
