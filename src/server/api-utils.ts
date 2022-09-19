import {COOKIE_FORC_ACCOUNTID_NAME, COOKIE_HARV_ACCOUNTID_NAME, COOKIE_HARV_TOKEN_NAME} from "../components/settings";
import {NextApiRequest} from "next";
import {endOfWeek, format, startOfWeek} from "date-fns";
import {DATE_FORMAT} from "../components/date-range-widget";

export const getAuthFromCookies = (req: NextApiRequest): { harvestToken: string, harvestAccount: number, forecastAccount: number } => {
    const token = req.cookies[COOKIE_HARV_TOKEN_NAME] as string;
    const account = parseInt(req.cookies[COOKIE_HARV_ACCOUNTID_NAME] as string);
    const forecastAccount = parseInt(req.cookies[COOKIE_FORC_ACCOUNTID_NAME] as string);

    return {
        harvestAccount: account,
        harvestToken: token,
        forecastAccount: forecastAccount,
    }
}

export const hasApiAccess = (req: NextApiRequest) => {
    return !!req.cookies[COOKIE_HARV_TOKEN_NAME] && !!req.cookies[COOKIE_HARV_ACCOUNTID_NAME] && !!req.cookies[COOKIE_FORC_ACCOUNTID_NAME];
}

export const getRange = (req: NextApiRequest): { from: string, to: string } => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    return {
        from, to
    }
}
