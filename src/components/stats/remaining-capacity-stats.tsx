import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";
import { useFilterContext } from "../../context/filter-context";
import { useMemo } from "react";
import { differenceInBusinessDays } from "date-fns";

export const RemainingCapacityStats = () => {
    const statsApi = useStatsApiContext();
    const { dateRange } = useFilterContext();

    const amountOfDays = useMemo(() => (differenceInBusinessDays(dateRange[1], dateRange[0]) ?? 0) + 1, [ dateRange ]);
    const hoursOverCapacity = (statsApi.totalPlannedHours) - ((statsApi.totalHoursPerDay) * amountOfDays);
    const percentage = 100 / (statsApi.totalHoursPerDay ?? 1) * hoursOverCapacity;


    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Capacity</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    color={ percentage > 0 ? 'error' : 'inherit' }
                    variant={ 'h2' }>
                    { !isNaN(percentage) && round(percentage, 1) }%
                    <Typography
                        component={ 'span' }
                        variant={ 'caption' }>
                        which are { round(hoursOverCapacity, 2) }
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/load.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>

        { !!statsApi.totalPlannedHours && <CardActions>
            <Typography component={ 'p' } variant={ 'caption' }>Planned
                hours: { round(statsApi.totalPlannedHours ?? 0, 2) }</Typography>
            <Typography
                component={ 'p' }
                variant={ 'caption' }>Capacity: { round(statsApi.totalHoursPerDay * amountOfDays, 2) }</Typography>
        </CardActions> }

    </Card>;
}
