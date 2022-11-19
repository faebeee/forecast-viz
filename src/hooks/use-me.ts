import { getAxios } from "../get-axios";
import { useCallback, useState } from "react";
import {GetMyUserHandlerResponse} from "../../pages/api/user/me";

export const useMe = () => {
    const [ isLoading, setIsLoading ] = useState(false);
    const [me, setMe] = useState < GetMyUserHandlerResponse>({userName:undefined, hasAdminAccess:false});
    const load = useCallback(() => {
        setIsLoading(true)
        getAxios().get<GetMyUserHandlerResponse>(`/user/me`)
            .then(({ data }) => {
                setMe(data)
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return {
        load,
        isLoading,
        ...me,
    }
}
