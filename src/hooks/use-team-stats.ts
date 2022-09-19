import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";
import { GetTeamStatsHandlerResponse, HoursPerUserItem } from "../../pages/api/team/stats";

export const useTeamStats = () => {
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalMembers, setTotalMembers ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);
    const [ hoursPerUser, setHoursPerUser ] = useState<HoursPerUserItem[] | null>(null);

    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetTeamStatsHandlerResponse>(`/team/stats?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTotalHours(data.totalHours)
                setTotalMembers(data.totalMembers)
                setTotalProjects(data.totalProjects)
                setHoursPerUser(data.hoursPerUser)
            });
    }, []);

    return {
        load,
        totalHours,
        totalMembers,
        totalProjects,
        hoursPerUser
    }
}
