import { differenceInBusinessDays, parse } from "date-fns";
import dynamic from "next/dynamic";
import { LineChartProps, LineProps, LineSeriesProps } from "reaviz";
import { useMemo } from "react";
import { useFilterContext } from "../../context/filter-context";
import { useTeamStatsApiContext } from "../../context/team-stats-api-context";
import { CircularProgress } from "@mui/material";
import { DATE_FORMAT } from "../date-range-widget";
//@ts-ignore
const LineChart = dynamic<Partial<LineChartProps>>(() => import('reaviz').then(module => module.LineChart), { ssr: false });
//@ts-ignore
const LineSeries = dynamic<Partial<LineSeriesProps>>(() => import('reaviz').then(module => module.LineSeries), { ssr: false });
//@ts-ignore
const Line = dynamic<Partial<LineProps>>(() => import('reaviz').then(module => module.Line), { ssr: false });


export const TeamHistoryLineChart = () => {
    const {
        hoursPerUserHistory,
        isLoading
    } = useTeamStatsApiContext();
    const { dateRange } = useFilterContext();

    const data = [
        ...(hoursPerUserHistory ?? []).map((e) => ({
            key: e.user,
            data: Object.entries(e.entries).map(([ key, value ]) => ({
                key: parse(key, DATE_FORMAT, new Date()),
                data: value,
                id: `${ e.user }-${ key }`
            }))
        })),
        {
            key: '100% Work Day',
            data: Object.entries(hoursPerUserHistory[0].entries).map(([ key, value ], index) => ({
                key: parse(key, DATE_FORMAT, new Date()),
                id: key,
                data: 8.4
            }))
        },
        {
            key: '80% Work Day',
            data: Object.entries(hoursPerUserHistory[0].entries).map(([ key, value ], index) => ({
                key: parse(key, DATE_FORMAT, new Date()),
                id: key,
                data: 6.7
            }))
        },
    ];

    if (isLoading || data.length <= 0) {
        return <CircularProgress color={ 'primary' }/>
    }

    return <LineChart
        height={ 400 }
        gridlines={ null }
        series={
            <LineSeries
                type="grouped"
                line={ <Line strokeWidth={ 4 }/> }
            />
        }
        data={ data }/>;
}
