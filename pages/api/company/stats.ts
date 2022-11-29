import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getProjectsFromEntries, getTeamAssignments } from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { orderBy } from "lodash";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";
import {withApiRouteSession} from "../../../src/server/with-session";

export type GetCompanyStatsHandlerResponse = {
    totalMembers: number;
    totalHours: number;
    totalProjects: number;
    hoursPerDay: HourPerDayEntry[];
    hoursPerProject: HoursPerProjectEntry[];
    hours: { billable: number, nonBillable: number }

}

export type HoursPerProjectEntry = {
    name: string,
    hours: number;
}

export const getCompanyStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetCompanyStatsHandlerResponse | null>) => {
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const peopleIds = allPeople.map((p) => p.harvest_user_id);


    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        getTimeEntriesForUsers(harvest, peopleIds, range.from, range.to),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ])

    const teamAssignments = getTeamAssignments(assignments, peopleIds);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const projectMap = forecast.getProjectsMap(projects);
    const totalProjects = getProjectsFromEntries(projectMap, entries, teamAssignments);

    const hoursPerProject = entries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                name: entry.project.code || entry.project.name || 'UNKNOWN',
                hours: 0,
            }
        }
        acc[entry.project.id].hours += entry.hours;
        return acc;
    }, {} as Record<string, HoursPerProjectEntry>);

    const hoursPerDay = entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, {} as Record<string, HourPerDayEntry>);


    const billableHours = entries.reduce((acc, entry) => {
        if (entry.billable) {
            acc.billable += entry.hours;
        } else {
            acc.nonBillable += entry.hours;
        }

        return acc;
    }, { billable: 0, nonBillable: 0 });

    const result = {
        totalHours,
        hoursPerProject: Object.values(hoursPerProject),
        hoursPerDay: orderBy(Object.values(hoursPerDay), 'date'),
        totalMembers: peopleIds.length,
        totalProjects: totalProjects.length,
        hours: billableHours,
    };

    res.send(result);
}
export default withApiRouteSession(getCompanyStatsHandler);
