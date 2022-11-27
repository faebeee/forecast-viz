import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    filterActiveAssignments,
    getMyAssignments,
    getProjectsFromEntries
} from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";
import {withApiRouteSession} from "../../../src/server/with-session";

export type GetProjectsApiHandlerResponse = {
    projects: Forecast.Project[]
}

export const getProjectsHandler = async (req: NextApiRequest, res: NextApiResponse<GetProjectsApiHandlerResponse | null>) => {
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);

    const userData = await harvest.getMe();
    const userId = req.query.uid ? parseInt(req.query.uid as string) : userData.id;

    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        getTimeEntriesForUser(harvest, userId, range.from, range.to),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ]);

    const projectMap = forecast.getProjectsMap(projects);
    const activeAssignments = filterActiveAssignments(projectMap, assignments);
    const myAssignments = getMyAssignments(activeAssignments, userId);
    const myProjects = getProjectsFromEntries(projectMap, entries, myAssignments);

    const result = {
        projects: myProjects
    }

    res.send(result);
}
export default withApiRouteSession(getProjectsHandler);
