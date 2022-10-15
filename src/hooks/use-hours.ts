import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetHoursHandlerResponse, ProjectHours } from "../../pages/api/me/hours";

export const useHours = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ hours, setHours ] = useState<ProjectHours[] | null>(null);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        getAxios().get<GetHoursHandlerResponse>(`/me/hours?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setHours(data)
                setHours(data)
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        hours,
    }
}
