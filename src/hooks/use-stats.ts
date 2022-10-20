import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/user/stats";

export const useStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalPlannedHours, setTotalPlannedHours ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);
    const [ hoursPerDay, setHoursPerDay ] = useState<{ date: string, hours: number }[]>([]);
    const [ avgPerDay, setAvgPerDay ] = useState<number | null>(null);
    const [ billableHours, setBillableHours ] = useState<number>(0);
    const [ billableHoursPercentage, setBillableHoursPercentage ] = useState<number>(0);
    const [ nonBillableHours, setNonBillableHours ] = useState<number>(0);

    const load = useCallback((from: string, to: string, uid: string = '') => {
        setIsLoading(true);
        getAxios().get<GetStatsHandlerResponse>(`/user/stats?from=${ from }&to=${ to }&uid=${ uid }`)
            .then(({ data }) => {
                setTotalHours(data.totalHours)
                setTotalPlannedHours(data.totalPlannedHours)
                setTotalProjects(data.totalProjects)
                setHoursPerDay(data.hoursPerDay)
                setAvgPerDay(data.avgPerDay)
                setBillableHours(data.billableHours);
                setBillableHoursPercentage(data.billableHoursPercentage);
                setNonBillableHours(data.nonBillableHours);
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
        billableHours,
        billableHoursPercentage,
        nonBillableHours,
    }
}
