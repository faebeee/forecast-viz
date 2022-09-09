import React from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { DATE_FORMAT } from "../components/date-range-widget";
import { noop } from "lodash";

export type FilterContextValueType = {
    teamId: string | null;
    setTeamId: (id: string) => void;

    from: string;
    to: string;
    setDateRange:(from: string, to:string) => void;

    harvestAccountId: string | null;
    setHarvestAccountId:(value: string) => void;

    harvestToken: string | null;
    setHarvestToken:(value: string) => void;

    forecastAccountId: string | null;
    setForecastAccountId:(value: string) => void;
}

export const filterContextValue: FilterContextValueType = {
    teamId: null,
    setTeamId: noop,
    from: format(startOfWeek(new Date()), DATE_FORMAT),
    to: format(endOfWeek(new Date()), DATE_FORMAT),
    setDateRange: noop,
    harvestAccountId: null,
    setHarvestAccountId: noop,
    harvestToken: null,
    setHarvestToken: noop,
    forecastAccountId: null,
    setForecastAccountId: noop,
}

export const FilterContext = React.createContext<FilterContextValueType>(filterContextValue);
export const useFilterContext = () => React.useContext(FilterContext);
