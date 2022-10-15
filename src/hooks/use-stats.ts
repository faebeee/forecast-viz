import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";

export const useStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalPlannedHours, setTotalPlannedHours ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);
    const [ hoursPerDay, setHoursPerDay ] = useState<{ date: string, hours: number }[]>([]);
    const [ avgPerDay, setAvgPerDay ] = useState<number | null>(null);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        getAxios().get<GetStatsHandlerResponse>(`/me/stats?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTotalHours(data.totalHours)
                setTotalPlannedHours(data.totalPlannedHours)
                setTotalProjects(data.totalProjects)
                setHoursPerDay(data.hoursPerDay)
                setAvgPerDay(data.avgPerDay)
            })
            .finally((() => {
                setIsLoading(false)
            }));
    }, []);

    return {
        load,
        isLoading,
        avgPerDay,
        totalHours,
        totalPlannedHours,
        totalProjects,
        hoursPerDay,
    }
}
