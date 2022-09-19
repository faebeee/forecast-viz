import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";

export const useStats = () => {
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalPlannedHours, setTotalPlannedHours ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);

    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetStatsHandlerResponse>(`/me/stats?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTotalHours(data.totalHours)
                setTotalPlannedHours(data.totalPlannedHours)
                setTotalProjects(data.totalProjects)
            });
    }, []);

    return {
        load,
        totalHours,
        totalPlannedHours,
        totalProjects
    }
}