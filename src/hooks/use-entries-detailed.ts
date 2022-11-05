import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetEntriesDetailedHandlerResponse, SimpleTimeEntry } from "../../pages/api/user/entries-detailed";

export const useEntriesDetailed = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ entries, setEntries ] = useState<SimpleTimeEntry[]>([]);
    const load = useCallback((from: string, to: string, uid: string = '', projectId?: number) => {
        setIsLoading(true)
        getAxios().get<GetEntriesDetailedHandlerResponse>(`/user/entries-detailed?from=${ from }&to=${ to }&uid=${ uid }&project_id=${ projectId }`)
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
