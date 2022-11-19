import React from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { noop } from "lodash";

export type FilterContextValueType = {
    dateRange: [ Date, Date ];
    setDateRange: (range: [ Date, Date ]) => void;
}

export const filterContextValue: FilterContextValueType = {
    dateRange: [ startOfWeek(new Date()), endOfWeek(new Date()) ],
    setDateRange: noop,
}

export const FilterContext = React.createContext<FilterContextValueType>(filterContextValue);
export const useFilterContext = () => React.useContext(FilterContext);
