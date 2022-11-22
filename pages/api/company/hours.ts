import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { AssignmentEntry, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";
import {withApiRouteSession} from "../../../src/server/with-session";

export type ProjectHours = {
    hoursSpent: number;
    hoursPlanned: number;
    name: string;
}

export type GetTeamHoursHandlerResponse = {
    hours: ProjectHours[];
}

export const getTeamHoursHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamHoursHandlerResponse | null>) => {
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const teamPeople = allPeople
        .map(p => p.harvest_user_id);


    const [ entries, assignments ]: [ TimeEntry[], AssignmentEntry[] ] = await Promise.all([
        getTimeEntriesForUsers(harvest, teamPeople, range.from, range.to),
        forecast.getAssignments(range.from, range.to)
    ]);
    const projectMap: Record<number | string, ProjectHours> = {};
    entries.forEach((e) => {
        if (!projectMap[e.project?.id]) {
            projectMap[e.project?.id] = {
                hoursSpent: 0,
                hoursPlanned: 0,
                name: e.project.code ?? e.project?.name,
            }
        }
    });

    assignments.forEach((e) => {
        if (e.project?.harvest_id && !projectMap[e.project?.harvest_id]) {
            projectMap[e.project?.harvest_id] = {
                hoursSpent: 0,
                hoursPlanned: 0,
                name: e.project?.code ?? e.project?.name,
            }
        }
    });

    entries.forEach((e) => {
        projectMap[e.project?.id].hoursSpent += e.hours;
    });

    assignments.forEach((e) => {
        if (!e.project?.harvest_id) {
            return;
        }
        projectMap[e.project.harvest_id].hoursPlanned += e.totalHours ?? 0;
    });

    const result = {
        hours: Object.values(projectMap),
    };


    res.send(result);
}
export default withApiRouteSession(getTeamHoursHandler);
