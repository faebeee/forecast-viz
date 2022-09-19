import React from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { DATE_FORMAT } from "../components/date-range-widget";
import { noop } from "lodash";

export type FilterContextValueType = {
    dateRange: [ Date, Date ];
    setDateRange: (range: [ Date, Date ]) => void;

    harvestAccountId: string | null;
    setHarvestAccountId: (value: string) => void;

    harvestToken: string | null;
    setHarvestToken: (value: string) => void;

    forecastAccountId: string | null;
    setForecastAccountId: (value: string) => void;
}

export const filterContextValue: FilterContextValueType = {
    dateRange: [ startOfWeek(new Date()), endOfWeek(new Date()) ],
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
