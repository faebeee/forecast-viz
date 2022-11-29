import {NextApiRequest, NextApiResponse} from "next";
import {hasApiAccess} from "../../../src/server/api-utils";
import {withApiRouteSession} from "../../../src/server/with-session";


export type GetMyUserHandlerResponse = {
    userName?: string
    hasAdminAccess: boolean
}
export const getMyUserHandler = async (req: NextApiRequest, res: NextApiResponse<GetMyUserHandlerResponse>) => {
    res.send({
        userName: req.session.userName,
        hasAdminAccess: req.session.hasAdminAccess ?? false
    });
}
export default withApiRouteSession(getMyUserHandler);
