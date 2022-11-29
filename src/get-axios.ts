import axios from "axios";
import {format} from "date-fns";
import {DATE_FORMAT} from "./context/formats";
import qs from "qs";

const instance = axios.create({
    baseURL: "/api"
});
export const getAxios = () => {
    instance.interceptors.request.use((config) => {
        // remove all empty or nully values
        config.paramsSerializer = (params) => {

            for (const key of Object.keys(params)) {
                const val = params[key];
                if (val === null || val === undefined || val === "") {
                    delete params[key];
                }
            }
            // add default/automatic date formatting
            return qs.stringify(params, { serializeDate: (date: Date) => format(date, DATE_FORMAT) });
        }
        return config;
    })
    return instance;
}
