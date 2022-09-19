import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getMyAssignments, getProjectsFromEntries } from "../../../src/server/utils";
import { AssignmentEntry, getForecast } from "../../../src/server/get-forecast";

export type GetAssignmentsHandlerResponse = {
    assignments: AssignmentEntry[]
}

export const getAssignmentsHandler = async (req: NextApiRequest, res: NextApiResponse<GetAssignmentsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);

    const userData = await harvest.getMe();
    const userId = userData.id;
    const assignments = await forecast.getAssignments(range.from, range.to);
    const myAssignments = getMyAssignments(assignments, userId);

    res.send({
        assignments: myAssignments,
    });
}

export default getAssignmentsHandler;
