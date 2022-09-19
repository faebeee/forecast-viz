import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetHoursHandlerResponse, ProjectHours } from "../../pages/api/me/hours";

export const useHours = () => {
    const [ hours, setHours ] = useState<ProjectHours[] | null>(null);

    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetHoursHandlerResponse>(`/me/hours?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setHours(data)
                setHours(data)
            });
    }, []);

    return {
        load,
        hours,
    }
}
