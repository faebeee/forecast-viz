import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetAssignmentsHandlerEntry, GetAssignmentsHandlerResponse } from "../../pages/api/user/assignments";

export const useAssignments = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [ assignments, setAssignments ] = useState<GetAssignmentsHandlerEntry[]>([]);
    const load = useCallback((from: string, to: string, uid: string = '', projectId?: number) => {
        setIsLoading(true);
        getAxios().get<GetAssignmentsHandlerResponse>(`/user/assignments?from=${ from }&to=${ to }&uid=${ uid }&project_id=${ projectId }`)
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
