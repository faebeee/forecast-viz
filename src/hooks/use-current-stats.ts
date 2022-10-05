import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";
import { DATE_FORMAT } from "../components/date-range-widget";
import { format } from "date-fns";

export const useCurrentStats = () => {
    const [ totalHours, setTotalHours ] = useState<number | null>(null);
    const [ totalPlannedHours, setTotalPlannedHours ] = useState<number | null>(null);
    const [ totalProjects, setTotalProjects ] = useState<number | null>(null);
    const from = format(new Date(), DATE_FORMAT);
    const to = format(new Date(), DATE_FORMAT);

    const load = useCallback(() => {
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
        totalProjects,
    }
}
