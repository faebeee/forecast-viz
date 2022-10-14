import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetEntriesHandlerResponse } from "../../pages/api/me/entries";
import { SpentProjectHours } from "../server/utils";

export const useEntries = () => {
    const [ entries, setEntries ] = useState<SpentProjectHours[]>([]);
    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetEntriesHandlerResponse>(`/me/entries?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setEntries(data.entries)
            });
    }, []);

    return {
        load,
        entries,
    }
}
