import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetTeamEntriesHandlerResponse } from "../../pages/api/team/entries";
import { SpentProjectHours } from "../server/utils";

export const useTeamEntries = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ entries, setEntries ] = useState<SpentProjectHours[]>([]);
    const load = useCallback((from: string, to: string, projectId?: number | null) => {
        setIsLoading(true);
        getAxios().get<GetTeamEntriesHandlerResponse>(`/team/entries?from=${ from }&to=${ to }&project_id=${ projectId }`)
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
