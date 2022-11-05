import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";

export type TotalHoursStatsProps = {}

export const SpentPlannedStats = ({}: TotalHoursStatsProps) => {
    const statsApi = useStatsApiContext();

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Total/Planned Hours</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>{ round(statsApi.totalHours ?? 0, 1) }
                    <Typography variant={ 'body2' } component={ 'span' }>
                        of { round(statsApi.totalPlannedHours, 2) } planned
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>
}
