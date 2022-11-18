import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/user/stats";
import { format } from "date-fns";
import {DATE_FORMAT} from "../context/formats";

export const useCurrentStats = () => {
    const [ data, setData ] = useState<GetStatsHandlerResponse | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const from = format(new Date(), DATE_FORMAT);
    const to = format(new Date(), DATE_FORMAT);

    const load = useCallback((uid: string = '') => {
        setIsLoading(true);
        getAxios().get<GetStatsHandlerResponse>(`/user/stats?from=${ from }&to=${ to }&uid=${ uid }`)
            .then(({ data }) => {
                setData(data)
            })
            .finally(() => {
                setIsLoading(false)
            });
    }, []);

    return {
        load,
        isLoading,
        ...(data ?? {}),
    }
}
