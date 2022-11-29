import { GetServerSideProps } from "next";
import "react-datepicker/dist/react-datepicker.css";
import { getHarvest } from "../src/server/get-harvest";
import { AccountsApi } from "../src/server/harvest-types";
import { withServerSideSession } from "../src/server/with-session";
import { getForecast } from "../src/server/get-forecast";
import { getAdminAccess } from "../src/server/has-admin-access";
import ProductName = AccountsApi.ProductName;


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({ query, req, res }) => {
        const harvestAccessToken = query.access_token;
        const harvest = await getHarvest(harvestAccessToken as string)
        const accounts = await harvest.getAccounts()

        const harvestId = accounts?.accounts.filter(account => {
            return account.product === ProductName.harvest
        }).map(account => account.id).shift()

        const forecastId = accounts?.accounts.filter(account => {
            return account.product === ProductName.forecast
        }).map(account => account.id).shift()

        req.session.accessToken = harvestAccessToken as string
        req.session.harvestId = harvestId
        req.session.forecastId = forecastId


        const api = await getHarvest(req.session.accessToken!, req.session.harvestId);
        const forecast = getForecast(req.session.accessToken!, req.session.forecastId!);
        const userData = await api.getMe();
        const userId = userData.id;

        const allPeople = await forecast.getPersons();
        const myDetails = allPeople.find((p) => p.harvest_user_id === userId);

        console.log(myDetails);

        req.session.hasAdminAccess = true;
        req.session.userName = accounts?.user.first_name


        await req.session.save()


        // TODO: Exception and invalid data handling

        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }
)


export const OAuth = ({}) => {
    return <>
    </>
        ;
}
export default OAuth;
