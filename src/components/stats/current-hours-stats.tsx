import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useCurrentStatsApiContext } from "../../context/current-stats-api-context";

export const CurrentHoursStats = () => {
    const currentStatsApi = useCurrentStatsApiContext();
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
                    { round(currentStatsApi.totalHours ?? 0, 1) }
                    <Typography variant={ 'body2' } component={ 'span' }>
                        of { round(currentStatsApi.totalPlannedHours ?? 0, 1) } planned
                        hours
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/wip.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>
}
