import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetEntriesHandlerResponse } from "../../pages/api/user/entries";
import { SpentProjectHours } from "../server/utils";

export const useEntries = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ entries, setEntries ] = useState<SpentProjectHours[]>([]);
    const load = useCallback((from: string, to: string, uid: string = '') => {
        setIsLoading(true)
        getAxios().get<GetEntriesHandlerResponse>(`/user/entries?from=${ from }&to=${ to }&uid=${ uid }`)
            .then(({ data }) => {
                setEntries(data.entries)
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        entries,
    }
}
