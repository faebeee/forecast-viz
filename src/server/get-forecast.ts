import Forecast from 'forecast-promise';
import axios from "axios";

export const getForecast = (accessToken: string, accountId: string) => {
    const api = axios.create({
        baseURL: 'https://api.forecastapp.com/',
        headers: {
            Authorization: ` Bearer ${accessToken}`,
            'Forecast-Account-Id': accountId
        }
    })


    const getAssignments = async (userId: number, from: string, to: string) => {
        try {
            const response = await api.get(`/assignments?start_date=${from}&end_date=${to}&person_id=${userId}&state=active`);
            return response.data.assignments;
        }catch(e){
            console.log(e.response);
        }
        return []
    }

    return {
        getAssignments
    }
}
