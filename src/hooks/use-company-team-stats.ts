import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetTeamsStatsHandlerResponse, TeamStatsEntry } from "../../pages/api/company/teams";

export const useCompanyTeamsStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ teamStats, setTeamStats ] = useState<TeamStatsEntry[]>([]);
    const [ roleStats, setRoleStats ] = useState<TeamStatsEntry[]>([]);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true)
        return getAxios().get<GetTeamsStatsHandlerResponse>(`/company/teams?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTeamStats(data.teams);
                setRoleStats(data.roles);
            })
            .finally(() => {
                setIsLoading(false)
            });
    }, []);

    return {
        load,
        isLoading,
        teamStats,
        roleStats,
    }
}
