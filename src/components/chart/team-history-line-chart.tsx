import { useTeamStatsApiContext } from "../../context/team-stats-api-context";
import { CircularProgress } from "@mui/material";
import { LinesChart } from "./lines-chart";
import { ParentSize } from "@visx/responsive";
import { getColor } from "../../utils/get-color";
import { AreasChart } from "./areas-chart";


export const TeamHistoryLineChart = () => {
    const {
        hoursPerUserHistory,
        isLoading
    } = useTeamStatsApiContext();

    if (isLoading || hoursPerUserHistory.length <= 0) {
        return <CircularProgress color={ 'primary' }/>
    }

    const data = (hoursPerUserHistory ?? []).map((e, index) => ({
        key: e.user,
        color: getColor(index),
        label: e.user,
        data: Object.entries(e.entries).map(([ key, value ]) => ({
            date: key,
            hours: value,
        }))
    }));

    return <ParentSize debounceTime={ 10 }>
        { ({ width }) => (<>
            <LinesChart width={ width } height={ 400 } data={ data }/>
        </>) }
    </ParentSize>
}
