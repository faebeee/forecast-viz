import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { SpentProjectHours } from "../server/utils";
import { GetTeamHoursHandlerResponse } from "../../pages/api/team/hours";

export const useTeamHours = () => {
    const [ hours, setHours ] = useState<SpentProjectHours[] | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        getAxios().get<GetTeamHoursHandlerResponse>(`/team/hours?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setHours(data.hours)
            })
            .finally(() => {
                setIsLoading(false)
            });
    }, []);

    return {
        load,
        isLoading,
        hours,
    }
}
