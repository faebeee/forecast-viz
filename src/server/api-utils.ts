import {NextApiRequest} from "next";
import {endOfWeek, format, startOfWeek} from "date-fns";
import { DATE_FORMAT } from "../context/formats";

export const getAuthFromCookies = (req: NextApiRequest): { harvestToken: string, harvestAccount: number, forecastAccount: number } => {
    return {
        harvestAccount: req.session.harvestId!,
        harvestToken: req.session.accessToken!,
        forecastAccount: req.session.forecastId!,
    }
}

export const hasApiAccess = (req: NextApiRequest) => {
    return req.session.accessToken && req.session.forecastId && req.session.harvestId;
}

export const getRange = (req: NextApiRequest): { from: string, to: string } => {
    const from = req.query.from as string ?? format(startOfWeek(new Date()), DATE_FORMAT);
    const to = req.query.to as string ?? format(endOfWeek(new Date()), DATE_FORMAT);
    return {
        from, to
    }
}
