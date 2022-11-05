import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getTeamHoursEntries, SpentProjectHours } from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";
import { TEAMS } from "../../../src/config";
import { getTimeEntriesForUsers } from "../../../src/server/services/get-time-entries-for-users";

export type GetTeamEntriesHandlerResponse = {
    entries: SpentProjectHours[];
}

export const getTeamHoursHandler = async (req: NextApiRequest, res: NextApiResponse<GetTeamEntriesHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const userData = await harvest.getMe();
    const userId = userData.id;
    const myDetails = allPeople.find((p) => p.harvest_user_id === userId);
    const myTeamEntry = TEAMS.filter(team => myDetails?.roles.includes(team.key) ?? false).pop();
    const teamId = myTeamEntry!.key;
    const hasTeamAccess = (myDetails?.roles.includes('Coach') || myDetails?.roles.includes('Project Management')) ?? false;

    if (!hasTeamAccess || !myTeamEntry) {
        res.status(403).send(null);
        return;
    }
    const projectId = req.query['project_id'] ? parseInt(req.query['project_id'] as string) : undefined;
    const teamPeople = allPeople
        .filter((p) => p.roles.includes(teamId!) && p.archived === false)
        .map(p => p.harvest_user_id);
    const teamEntries = await getTimeEntriesForUsers(harvest, teamPeople, range.from, range.to, projectId);
    const assignments = await forecast.getAssignments(range.from, range.to, projectId);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);

    const result = {
        entries: teamProjectHourEntries,
    };

    res.send(result);
}
export default getTeamHoursHandler;
