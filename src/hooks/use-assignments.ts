import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetAssignmentsHandlerEntry, GetAssignmentsHandlerResponse } from "../../pages/api/me/assignments";

export const useAssignments = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ assignments, setAssignments ] = useState<GetAssignmentsHandlerEntry[]>([]);
    const load = useCallback((from: string, to: string) => {
        setIsLoading(true);
        getAxios().get<GetAssignmentsHandlerResponse>(`/me/assignments?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setAssignments(data.assignments);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        assignments,
    }
}
