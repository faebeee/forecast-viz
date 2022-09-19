import { getAxios } from "../get-axios";
import { TimeEntry } from "../server/harvest-types";
import { useCallback, useState } from "react";
import { MappedTimeEntry } from "../../pages/api/me/entries";
import { AssignmentEntry } from "../server/get-forecast";
import { GetAssignmentsHandlerResponse } from "../../pages/api/me/assignments";

export const useAssignments = () => {
    const [ assignments, setAssignments ] = useState<AssignmentEntry[]>([]);
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
