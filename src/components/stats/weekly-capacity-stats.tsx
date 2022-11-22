import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";


export const WeeklyCapacityStats = (params:DefaultParams) => {

    const statsApi = useStats(params);

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Weekly Capacity</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { round(statsApi.data?.totalWeeklyCapacity ?? 0, 1) }
                    <Typography
                        component={ 'span' }
                        variant={ 'caption' }>
                        with { round(statsApi.data?.totalHoursPerDayCapacity ?? 0, 1) } per day
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/workload.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>;
}
