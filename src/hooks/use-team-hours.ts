import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetHoursHandlerResponse, ProjectHours } from "../../pages/api/me/hours";
import { SpentProjectHours } from "../server/utils";
import { GetTeamHoursHandlerResponse } from "../../pages/api/team/hours";

export const useTeamHours = () => {
    const [ hours, setHours ] = useState<SpentProjectHours[] | null>(null);

    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetTeamHoursHandlerResponse>(`/team/hours?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setHours(data.hours)
            });
    }, []);

    return {
        load,
        hours,
    }
}
