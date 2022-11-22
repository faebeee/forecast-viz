import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useMemo } from "react";
import {DefaultParams, useStats} from "../../hooks/use-remote";

export type TotalOvertimeProps = {
    amountOfDays: number;
    params: DefaultParams
}

export const TotalOvertimeStats = ( {amountOfDays, params}: TotalOvertimeProps) => {
    const statsApi = useStats(params);
    const totalOvertime = useMemo(() => {
        if (!statsApi.data?.totalHours || !statsApi.data?.totalHoursPerDayCapacity) {
            return 0;
        }
        return statsApi.data?.totalHours - (statsApi.data?.totalHoursPerDayCapacity * amountOfDays);
    }, [ statsApi.data?.totalHours, statsApi.data?.totalHoursPerDayCapacity, amountOfDays ]);

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Overtime</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { round(totalOvertime ?? 0, 1) }
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/time.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>
}
