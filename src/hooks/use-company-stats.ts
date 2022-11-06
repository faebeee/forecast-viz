import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetCompanyStatsHandlerResponse, HoursPerProjectEntry } from "../../pages/api/company/stats";
import { HourPerDayEntry } from "../type";

export const useCompanyStats = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ data, setData ] = useState<GetCompanyStatsHandlerResponse | null>(null);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        return getAxios().get<GetCompanyStatsHandlerResponse>(`/company/stats?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setData(data);

            }).finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        ...(data ?? {}),
    }
}
