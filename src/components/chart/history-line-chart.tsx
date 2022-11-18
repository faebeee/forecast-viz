import { differenceInBusinessDays, parse } from "date-fns";
import dynamic from "next/dynamic";
import { LineChartProps, LineProps, LineSeriesProps } from "reaviz";
import { useStatsApiContext } from "../../context/stats-api-context";
import { useMemo } from "react";
import { useFilterContext } from "../../context/filter-context";
import {DATE_FORMAT} from "../../context/formats";
//@ts-ignore
const LineChart = dynamic<Partial<LineChartProps>>(() => import('reaviz').then(module => module.LineChart), { ssr: false });
//@ts-ignore
const LineSeries = dynamic<Partial<LineSeriesProps>>(() => import('reaviz').then(module => module.LineSeries), { ssr: false });
//@ts-ignore
const Line = dynamic<Partial<LineProps>>(() => import('reaviz').then(module => module.Line), { ssr: false });


export const HistoryLineChart = () => {
    const {
        hoursPerDay,
        avgPerDay,
        totalHoursPerDayCapacity,
        totalPlannedHours,
        overtimePerDay
    } = useStatsApiContext();
    const { dateRange } = useFilterContext();

    const amountOfDays = useMemo(() => differenceInBusinessDays(dateRange[1], dateRange[0]) + 1, [ dateRange ]);

    return <LineChart
        height={ 300 }
        gridlines={ null }
        series={
            <LineSeries
                type="grouped"
                line={ <Line strokeWidth={ 4 }/> }
            />
        }
        data={ [
            {
                key: 'Planned Hours',
                data: hoursPerDay.map((entry, index) => ({
                    key: parse(entry.date, DATE_FORMAT, new Date()),
                    id: entry.date,
                    data: (totalPlannedHours ?? 0) / amountOfDays
                }))
            },
            {
                key: 'Overtime',
                data: overtimePerDay.map((entry, index) => ({
                    key: parse(entry.date, DATE_FORMAT, new Date()),
                    id: entry.date,
                    data: entry.hours
                }))
            },
            {
                key: 'Capacity Hours',
                data: hoursPerDay.map((entry, index) => ({
                    key: parse(entry.date, DATE_FORMAT, new Date()),
                    id: entry.date,
                    data: totalHoursPerDayCapacity
                }))
            },
            {
                key: 'Average Hours',
                data: hoursPerDay.map((entry, index) => ({
                    key: parse(entry.date, DATE_FORMAT, new Date()),
                    id: entry.date,
                    data: avgPerDay ?? 0
                }))
            },
            {
                key: 'Tracked Hours',
                data: hoursPerDay.map((entry, index) => ({
                    key: parse(entry.date, DATE_FORMAT, new Date()),
                    id: entry.date,
                    data: entry.hours
                }))
            }
        ] }/>;
}
