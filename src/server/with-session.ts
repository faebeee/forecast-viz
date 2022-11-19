// this import might be sometimes needed according to https://github.com/vvo/iron-session
import * as IronSession from "iron-session";

import {withIronSessionApiRoute, withIronSessionSsr} from "iron-session/next";
import {
    GetServerSidePropsContext,
    GetServerSidePropsResult,
    NextApiHandler,
} from "next";
import {IRON_SESSION_OPTIONS} from "./utils";




export function withApiRouteSession(handler: NextApiHandler) {
    return withIronSessionApiRoute(handler, IRON_SESSION_OPTIONS);
}

export function withServerSideSession<P extends { [key: string]: unknown } = { [key: string]: unknown },
    >(
    handler: (
        context: GetServerSidePropsContext,
    ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
) {
    return withIronSessionSsr(handler, IRON_SESSION_OPTIONS);
}

declare module "iron-session" {
    interface IronSessionData {
        accessToken?: string
        forecastId?: number
        harvestId?: number
        hasAdminAccess?: boolean
        userName?: string

    }
}
