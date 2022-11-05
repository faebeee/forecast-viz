import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    filterActiveAssignments,
    getDates,
    getHoursPerTask,
    getMyAssignments,
    getProjectsFromEntries, HourPerTaskObject
} from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { differenceInBusinessDays, format, isWeekend, parse } from "date-fns";
import { DATE_FORMAT } from "../../../src/components/date-range-widget";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";
import { sortBy } from "lodash";

export type GetProjectsApiHandlerResponse = {
    projects: Forecast.Project[]
}

export const getProjectsHandler = async (req: NextApiRequest, res: NextApiResponse<GetProjectsApiHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
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
export default getProjectsHandler;
