import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";

export type RemainingCapacityStatsProps = {
    amountOfDays: number;
}

export const RemainingCapacityStats = ({ amountOfDays }: RemainingCapacityStatsProps) => {
    const statsApi = useStatsApiContext();

    const hoursOverCapacity = (statsApi.totalPlannedHours) - ((statsApi.totalHoursPerDayCapacity * amountOfDays));
    const percentage = 100 / (statsApi.totalPlannedHours ?? 1) * hoursOverCapacity;

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }>
        <CardContent>
            <Typography variant={ 'body1' }>Capacity</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    color={ percentage > 0 ? 'error' : 'inherit' }
                    variant={ 'h2' }>
                    { round(hoursOverCapacity, 1) }
                    <Typography
                        component={ 'span' }
                        variant={ 'caption' }>
                        { !isNaN(hoursOverCapacity) && <>which are { round(percentage, 2) }%</> }
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/load.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>

        { !!statsApi.totalPlannedHours && !statsApi.isLoading && <CardActions>
            <Typography component={ 'p' }>Planned
                hours: { round(statsApi.totalPlannedHours ?? 0, 2) }</Typography>
            <Typography
                component={ 'p' }>Capacity: { round(statsApi.totalHoursPerDayCapacity * amountOfDays, 2) }</Typography>
        </CardActions> }

    </Card>;
}
