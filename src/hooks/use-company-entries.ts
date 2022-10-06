import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetStatsHandlerResponse } from "../../pages/api/me/stats";
import { GetCompanyStatsHandlerResponse, HoursPerProjectEntry } from "../../pages/api/company/stats";
import { HourPerDayEntry } from "../type";
import { SpentProjectHours } from "../server/utils";
import { GetCompanyEntriesHandlerResponse } from "../../pages/api/company/entries";

export const useCompanyEntries = () => {
    const [ entries, setEntries ] = useState<SpentProjectHours[]>([]);
    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetCompanyEntriesHandlerResponse>(`/company/entries?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setEntries(data.entries);
            });
    }, []);

    return {
        load,
        entries
    }
}
