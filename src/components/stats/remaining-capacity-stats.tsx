import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";

export type RemainingCapacityStatsProps = {
    amountOfDays: number;
    params: DefaultParams
}

export const RemainingCapacityStats = ({ amountOfDays, params }: RemainingCapacityStatsProps) => {
    const statsApi = useStats(params)

    const hoursOverCapacity = (statsApi.data?.totalPlannedHours ?? 0 ) - (statsApi.data?.totalHoursPerDayCapacity ?? 0) * amountOfDays;
    const percentage = 100 / (statsApi.data?.totalPlannedHours ?? 1) * hoursOverCapacity;

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

        { !!statsApi.data?.totalPlannedHours && !statsApi.isLoading && <CardActions>
            <Typography component={ 'p' }>Planned
                hours: { round(statsApi.data?.totalPlannedHours ?? 0, 2) }</Typography>
            <Typography
                component={ 'p' }>Capacity: { round(statsApi.data?.totalHoursPerDayCapacity * amountOfDays, 2) }</Typography>
        </CardActions> }

    </Card>;
}
