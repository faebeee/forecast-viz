import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import { GetAssignmentsHandlerEntry, GetAssignmentsHandlerResponse } from "../../pages/api/me/assignments";

export const useAssignments = () => {
    const [ assignments, setAssignments ] = useState<GetAssignmentsHandlerEntry[]>([]);
    const load = useCallback((from: string, to: string) => {
        getAxios().get<GetAssignmentsHandlerResponse>(`/me/assignments?from=${ from }&to=${ to }`)
            .then(({ data }) => {
                setAssignments(data.assignments);
            });
    }, []);

    return {
        load,
        assignments,
    }
}
