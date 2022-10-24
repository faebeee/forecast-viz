import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";
import { useMemo } from "react";
import { differenceInBusinessDays } from "date-fns";
import { useFilterContext } from "../../context/filter-context";

export const TotalHoursStats = () => {
    const { dateRange } = useFilterContext();
    const statsApi = useStatsApiContext();

    const amountOfDays = useMemo(() => differenceInBusinessDays(dateRange[1], dateRange[0]) + 1, [ dateRange ]);
    const totalOvertime = useMemo(() => {
        if (!statsApi.totalHours || !statsApi.totalPlannedHours) {
            return 0;
        }
        return statsApi.totalHours - (statsApi.totalHoursPerDay * amountOfDays);
    }, [ statsApi.totalHours, statsApi.totalHoursPerDay, amountOfDays ]);

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
                        of { round(statsApi.totalHoursPerDay * amountOfDays ?? 0, 1) } capacity
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
        { !!statsApi.totalPlannedHours && <CardActions>
            Planned hours: { round(statsApi.totalPlannedHours, 2) }
        </CardActions> }
    </Card>
}
