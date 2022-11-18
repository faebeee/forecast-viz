import {GetServerSideProps} from "next";
import "react-datepicker/dist/react-datepicker.css";
import {getHarvest} from "../src/server/get-harvest";
import {AccountsApi} from "../src/server/harvest-types";
import ProductName = AccountsApi.ProductName;
import {withSessionServerSide} from "../src/server/with-session";


export const getServerSideProps: GetServerSideProps = withSessionServerSide(
    async ({query, req, res}) => {
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


export const Index = ({}) => {
    return <>
    </>
        ;
}
export default Index;
