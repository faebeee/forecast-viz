import axios from "axios";


export const getForecast = (accessToken: string, accountId: number) => {
    const api = axios.create({
        baseURL: 'https://api.forecastapp.com/',
        headers: {
            Authorization: ` Bearer ${ accessToken }`,
            'Forecast-Account-ID': accountId
        }
    })

    const getAssignments = async (from: string) => {
        try {
            const response = await api.get(`/aggregate/future_scheduled_hours/${ from }`);
            console.log(response.data)
        } catch (e) {
            console.error(e);
        }
    }

    return {
        getAssignments
    }
}
