import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetCompanyStatsHandlerResponse, HoursPerProjectEntry } from "../../pages/api/company/stats";
import { HourPerDayEntry } from "../type";

export const useCompanyStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalMembers, setTotalMembers ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);
    const [ hoursPerProject, setHoursPerProject ] = useState<HoursPerProjectEntry[]>([]);
    const [ hoursPerDay, setHoursPerDay ] = useState<HourPerDayEntry[]>([]);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        return getAxios().get<GetCompanyStatsHandlerResponse>(`/company/stats?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setTotalHours(data.totalHours);
                setTotalMembers(data.totalMembers);
                setTotalProjects(data.totalProjects);
                setHoursPerProject(data.hoursPerProject);
                setHoursPerDay(data.hoursPerDay);
            }).finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        hoursPerDay,
        totalHours,
        totalMembers,
        totalProjects,
        hoursPerProject,
    }
}
