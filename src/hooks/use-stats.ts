import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/user/stats";
import { StatsApiContextValue } from "../context/stats-api-context";

export const useStats = () => {
    const [ data, setData ] = useState<GetStatsHandlerResponse>(StatsApiContextValue);
    const [ isLoading, setIsLoading ] = useState(false);

    const load = useCallback((from: string, to: string, uid: string = '', projectId?: number) => {
        setIsLoading(true);
        getAxios().get<GetStatsHandlerResponse>(`/user/stats?from=${ from }&to=${ to }&uid=${ uid }&project_id=${ projectId }`)
            .then(({ data }) => {
                setData(data)

            })
            .finally((() => {
                setIsLoading(false)
            }));
    }, []);

    return {
        load,
        isLoading,
        ...data
    }
}
