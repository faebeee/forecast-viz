import React from "react";
import { GetStatsHandlerResponse } from "../../pages/api/user/stats";

type Value = GetStatsHandlerResponse & {
    isLoading: boolean
};

export const StatsApiContextValue: Value = {
    avgPerDay: 0,
    totalHours: 0,
    totalPlannedHours: 0,
    totalProjects: 0,
    billableHours: 0,
    billableHoursPercentage: 0,
    hoursPerDay: [],
    isLoading: false,
    nonBillableHours: 0,
    totalHoursPerDay: 0,
    totalWeeklyCapacity: 0

}
export const StatsApiContext = React.createContext<Value>(StatsApiContextValue)
export const useStatsApiContext = () => React.useContext(StatsApiContext);
