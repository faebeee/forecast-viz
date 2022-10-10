import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    getHoursPerUser,
    getMyAssignments, getPersonsMap,
    getProjectsFromEntries,
    getTeamAssignments
} from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TEAMS } from "../../../src/config";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { orderBy } from "lodash";

export type GetTeamsStatsHandlerResponse = {
    teams: TeamStatsEntry[];
    roles: TeamStatsEntry[];
}
export type TeamStatsEntry = {
    name: string;
    hours: number;
    members: number;
}

const Teams = [ 'Projektteam 1', 'Projektteam 2', 'Projektteam 3' ];
const Roles = [ 'UI', 'UX', 'Mobile', 'Backend', 'Web-Frontend', 'Project Management' ];


export const getCompanyStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamsStatsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const peopleIds = allPeople.map((p) => p.harvest_user_id);

    const [ entries, assignments, projects ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[] ] = await Promise.all([
        harvest.getTimeEntriesForUsers(peopleIds, { from: range.from, to: range.to }),
        forecast.getAssignments(range.from, range.to),
        forecast.getProjects(),
    ])

    const personsMap = getPersonsMap(allPeople);

    const teamAssignments = getTeamAssignments(assignments, peopleIds);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const projectMap = forecast.getProjectsMap(projects);
    const totalProjects = getProjectsFromEntries(projectMap, entries, teamAssignments);

    const getMembersForTeam = (people: Forecast.Person[], team: string) => people.filter(p => p.roles.includes(team));

    const getHoursFor = (teamList: string[]) => {
        const teamMap = teamList.reduce((acc, name) => {
            acc.set(name, {
                hours: 0,
                name,
                members: getMembersForTeam(allPeople, name).length
            })
            return acc;
        }, new Map<string, TeamStatsEntry>);


        const hours = entries.reduce((hoursPerTeam, entry) => {
            const person = personsMap.get(entry.user.id);
            if (!person) {
                return hoursPerTeam;
            }

            const activeTeams = person.roles.filter(r => teamList.includes(r));

            activeTeams.forEach((team) => {
                const currentTeamStats = hoursPerTeam.get(team);
                currentTeamStats!.hours += entry.hours;
                hoursPerTeam.set(team, currentTeamStats!);
            })

            return hoursPerTeam;
        }, teamMap);
        return Array.from(hours.values());
    }

    res.send({
        teams: getHoursFor(Teams),
        roles: getHoursFor(Roles),
    });
}
export default getCompanyStatsHandler;
