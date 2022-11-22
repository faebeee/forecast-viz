import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    getPersonsMap,
} from "../../../src/server/utils";
import { Forecast, getForecast } from "../../../src/server/get-forecast";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";
import { withApiRouteSession } from "../../../src/server/with-session";

export type GetTeamsStatsHandlerResponse = {
    teams: TeamStatsEntry[];
    roles: TeamStatsEntry[];
}
export type TeamStatsEntry = {
    name: string;
    hours: number;
    members: number;
}

const Teams = [ 'Projektteam 1', 'Projektteam 2', 'Projektteam 3', 'A-Team', 'v-team' ];
const Roles = [ 'UI', 'UX', 'Mobile', 'Backend', 'Web-Frontend', 'Project Management' ];


export const getCompanyStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamsStatsHandlerResponse | null>) => {
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const peopleIds = allPeople.map((p) => p.harvest_user_id);

    const entries = await getTimeEntriesForUsers(harvest, peopleIds, range.from, range.to);

    const personsMap = getPersonsMap(allPeople);

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

    const result = {
        teams: getHoursFor(Teams),
        roles: getHoursFor(Roles),
    };

    res.send(result);
}
export default withApiRouteSession(getCompanyStatsHandler);
