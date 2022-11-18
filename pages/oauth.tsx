import {GetServerSideProps} from "next";
import "react-datepicker/dist/react-datepicker.css";
import {getHarvest} from "../src/server/get-harvest";
import {AccountsApi} from "../src/server/harvest-types";
import ProductName = AccountsApi.ProductName;

export const getServerSideProps: GetServerSideProps = async ({query, req, res}) => {
    const harvestAccessToken = query.access_token;
    const harvest = await getHarvest(harvestAccessToken as string)
    const accounts = await harvest.getAccounts()

    const harvestAccountId = accounts?.accounts.filter(account => {
        return account.product === ProductName.harvest
    }).map(account => account.id).shift()

    const forecastAccountId = accounts?.accounts.filter(account => {
        return account.product === ProductName.forecast
    }).map(account => account.id).shift()


    return {
        redirect: {
            destination: '/',
            permanent: false,
        },
    }
}


export const Index = ({}) => {
    return <>
    </>
        ;
}
export default Index;
