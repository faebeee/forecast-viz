import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetEntriesHandlerResponse } from "../../pages/api/user/entries";
import { SpentProjectHours } from "../server/utils";
import { Forecast } from "../server/get-forecast";
import { GetProjectsApiHandlerResponse } from "../../pages/api/user/projects";

export const useProjects = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ projects, setEntries ] = useState<Forecast.Project[]>([]);
    const load = useCallback((from: string, to: string, uid: string = '') => {
        setIsLoading(true)
        getAxios().get<GetProjectsApiHandlerResponse>(`/user/projects?from=${ from }&to=${ to }&uid=${ uid }`)
            .then(({ data }) => {
                setEntries(data.projects)
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        projects,
    }
}
