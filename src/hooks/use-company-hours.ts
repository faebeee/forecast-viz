import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetTeamHoursHandlerResponse, ProjectHours } from "../../pages/api/company/hours";

export const useCompanyHours = () => {
    const [ hours, setHours ] = useState<ProjectHours[] | null>(null);

    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetTeamHoursHandlerResponse>(`/company/hours?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setHours(data.hours)
            });
    }, []);

    return {
        load,
        hours,
    }
}
