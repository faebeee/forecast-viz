import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";

export type TotalHoursStatsProps = {
    amountOfDays: number;
}

export const TotalHoursStats = ({ amountOfDays }: TotalHoursStatsProps) => {
    const statsApi = useStatsApiContext();

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Total Hours</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>{ round(statsApi.totalHours ?? 0, 1) }
                    <Typography variant={ 'body2' } component={ 'span' }>
                        of { round(statsApi.totalHoursPerDayCapacity * amountOfDays ?? 0, 1) } capacity
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
        { !!statsApi.totalPlannedHours && !statsApi.isLoading && <CardActions>
            Planned hours: { round(statsApi.totalPlannedHours, 2) }
        </CardActions> }
    </Card>
}
