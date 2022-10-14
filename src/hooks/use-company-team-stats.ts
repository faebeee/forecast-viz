import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";
import { GetCompanyStatsHandlerResponse, HoursPerProjectEntry } from "../../pages/api/company/stats";
import { HourPerDayEntry } from "../type";
import { GetTeamsStatsHandlerResponse, TeamStatsEntry } from "../../pages/api/company/teams";

export const useCompanyTeamsStats = () => {
    const [ teamStats, setTeamStats ] = useState<TeamStatsEntry[]>([]);
    const [ roleStats, setRoleStats ] = useState<TeamStatsEntry[]>([]);
    const load = useCallback((from: string, to: string) => {
        return getAxios().get<GetTeamsStatsHandlerResponse>(`/company/teams?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTeamStats(data.teams);
                setRoleStats(data.roles);
            });
    }, []);

    return {
        load,
        teamStats,
        roleStats,
    }
}
