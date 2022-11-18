import {GetServerSideProps} from "next";
import "react-datepicker/dist/react-datepicker.css";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import {getHarvest} from "../src/server/get-harvest";
import {AccountsApi} from "../src/server/harvest-types";
import ProductName = AccountsApi.ProductName;

export const getServerSideProps: GetServerSideProps = async ({query, req, res}) => {
    const harvestAccessToken = query.access_token;
    const harvest = await getHarvest(harvestAccessToken as string)
    const accounts = await harvest.getAccounts()

    const cookies = [COOKIE_HARV_TOKEN_NAME + '=' + harvestAccessToken]

    accounts?.accounts.filter(account => {
        return account.product === ProductName.harvest
    }).map(account => account.id).forEach(account => {
        cookies.push(COOKIE_HARV_ACCOUNTID_NAME + '=' + account)
    })

    accounts?.accounts.filter(account => {
        return account.product === ProductName.forecast
    }).map(account => account.id).forEach(account => {
        cookies.push(COOKIE_FORC_ACCOUNTID_NAME + '=' + account)
    })

    if (cookies.length > 2) {
        res.setHeader('set-cookie', cookies)
    }

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
