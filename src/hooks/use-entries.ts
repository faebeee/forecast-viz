import {getAxios} from "../get-axios";
import {TimeEntry} from "../server/harvest-types";
import {useCallback, useState} from "react";
import {MappedTimeEntry} from "../../pages/api/me/entries";

export const useEntries = () => {
    const [entries, setEntries] = useState<MappedTimeEntry[]>([]);
    const load = useCallback((from:string, to:string) => {
        getAxios().get<MappedTimeEntry[]>(`/me/entries?from=${from}&to=${to}`)
            .then(({data}) => {
                setEntries(data)
            });
    }, []);

    return {
        load,
        entries,
    }
}
