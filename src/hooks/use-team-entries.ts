import { getAxios } from "../get-axios";
import { TimeEntry } from "../server/harvest-types";
import { useCallback, useState } from "react";
import { MappedTimeEntry } from "../../pages/api/me/entries";
import { GetTeamEntriesHandlerResponse } from "../../pages/api/team/entries";
import { SpentProjectHours } from "../server/utils";

export const useTeamEntries = () => {
    const [ entries, setEntries ] = useState<SpentProjectHours[]>([]);
    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetTeamEntriesHandlerResponse>(`/team/entries?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setEntries(data.entries)
            });
    }, []);

    return {
        load,
        entries,
    }
}
