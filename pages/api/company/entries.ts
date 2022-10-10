import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import { getTeamHoursEntries, SpentProjectHours } from "../../../src/server/utils";
import { getForecast } from "../../../src/server/get-forecast";
import { TEAMS } from "../../../src/config";

export type GetCompanyEntriesHandlerResponse = {
    entries: SpentProjectHours[];
}

export const getCompanyEntriesHandler = async (req: NextApiRequest, res: NextApiResponse<GetCompanyEntriesHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);
    const allPeople = await forecast.getPersons();
    const teamPeople = allPeople
        .map(p => p.harvest_user_id);
    const teamEntries = await harvest.getTimeEntriesForUsers(teamPeople, { from: range.from, to: range.to });
    const assignments = await forecast.getAssignments(range.from, range.to);
    const teamProjectHourEntries = getTeamHoursEntries(teamEntries, assignments);

    res.send({
        entries: teamProjectHourEntries,
    });
}
export default getCompanyEntriesHandler;
