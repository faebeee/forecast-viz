import React from "react";
import { GetStatsHandlerResponse } from "../../pages/api/user/stats";
import { GetTeamStatsHandlerResponse } from "../../pages/api/team/stats";

type Value = GetTeamStatsHandlerResponse & {
    isLoading: boolean
};

export const TeamStatsApiContextValue: Value = {
    statsPerUser: [],
    hours: { billable: 0, nonBillable: 0 },
    hoursPerTask: [], plannedHoursPerUser: [],
    hoursPerUser: [], hoursPerUserHistory: [], isLoading: false, totalHours: 0, totalMembers: 0, totalProjects: 0
}
export const TeamStatsApiContext = React.createContext<Value>(TeamStatsApiContextValue)
export const useTeamStatsApiContext = () => React.useContext(TeamStatsApiContext);
