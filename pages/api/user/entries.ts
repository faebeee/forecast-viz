import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";
import { getMyAssignments, getTeamHoursEntries, SpentProjectHours } from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";
import {withApiRouteSession} from "../../../src/server/with-session";


export type GetEntriesHandlerResponse = {
    entries: SpentProjectHours[];
}
export const getEntriesHandler = async (req: NextApiRequest, res: NextApiResponse<GetEntriesHandlerResponse>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send({ entries: [] });
        return;
    }
    const projectId = req.query['project_id'] ? parseInt(req.query['project_id'] as string) : undefined;
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const userData = await harvest.getMe();
    const userId = req.query.uid ? parseInt(req.query.uid as string) : userData.id;

    const entries = await getTimeEntriesForUser(harvest, userId, range.from, range.to, projectId);
    const assignments = await forecast.getAssignments(range.from, range.to, projectId);
    const myAssignments = getMyAssignments(assignments, userId);
    const myEntries = getTeamHoursEntries(entries, assignments);

    const result = {
        entries: myEntries,
    };

    res.send(result);
}
export default withApiRouteSession(getEntriesHandler);
