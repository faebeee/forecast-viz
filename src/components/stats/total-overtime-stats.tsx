import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useMemo } from "react";
import { useStatsApiContext } from "../../context/stats-api-context";

export type TotalOvertimeProps = {
    amountOfDays: number;
}

export const TotalOvertimeStats = ({ amountOfDays }: TotalOvertimeProps) => {
    const statsApi = useStatsApiContext();
    const totalOvertime = useMemo(() => {
        if (!statsApi.totalHours || !statsApi.totalHoursPerDayCapacity) {
            return 0;
        }
        return statsApi.totalHours - (statsApi.totalHoursPerDayCapacity * amountOfDays);
    }, [ statsApi.totalHours, statsApi.totalHoursPerDayCapacity, amountOfDays ]);

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
