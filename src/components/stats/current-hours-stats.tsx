import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";

export const CurrentHoursStats = ( params: DefaultParams ) => {
    const currentStatsApi = useStats(params);
    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Todays Hours</Typography>
            { currentStatsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !currentStatsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { round(currentStatsApi.data?.totalHours ?? 0, 1) }
                    <Typography variant={ 'body2' } component={ 'span' }>
                        of { round(currentStatsApi.data?.totalHoursPerDayCapacity ?? 0, 1) } capacity
                        hours
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/wip.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>

        { !!currentStatsApi.data?.totalPlannedHours && !currentStatsApi.isLoading && <CardActions>
            Planned hours: { round(currentStatsApi.data?.totalPlannedHours, 2) }
        </CardActions> }
    </Card>
}
