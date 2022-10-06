import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { AssignmentEntry, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";

export type ProjectHours = {
    hoursSpent: number;
    hoursPlanned: number;
    name: string;
}

export type GetTeamHoursHandlerResponse = {
    hours: ProjectHours[];
}

export const getTeamHoursHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamHoursHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const teamPeople = allPeople
        .map(p => p.harvest_user_id);

    const [ entries, assignments ]: [ TimeEntry[], AssignmentEntry[] ] = await Promise.all([
        harvest.getTimeEntriesForUsers(teamPeople, { from: range.from, to: range.to }),
        forecast.getAssignments(range.from, range.to)
    ]);
    const projectMap: Record<number, ProjectHours> = {};
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


    res.send({
        hours: Object.values(projectMap),
    });
}
export default getTeamHoursHandler;
