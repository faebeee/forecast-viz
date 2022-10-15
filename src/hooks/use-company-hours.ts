import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetTeamHoursHandlerResponse, ProjectHours } from "../../pages/api/company/hours";

export const useCompanyHours = () => {
    const [ hours, setHours ] = useState<ProjectHours[] | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);

    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        return getAxios().get<GetTeamHoursHandlerResponse>(`/company/hours?from=${ from }&to=${ to }`)
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
