import React from "react";
import { useCurrentStats } from "../hooks/use-current-stats";

type Value = Omit<ReturnType<typeof useCurrentStats>, 'load'>;

export const StatsApiContextValue: Value = {
    billableHours: 0,
    billableHoursPercentage: 0,
    hoursPerDay: [],
    isLoading: false,
    nonBillableHours: 0,
    totalHoursPerDay: 0,
    totalWeeklyCapacity: 0

}
export const CurrentStatsApiContext = React.createContext<Value>(StatsApiContextValue)
export const useCurrentStatsApiContext = () => React.useContext(CurrentStatsApiContext);
