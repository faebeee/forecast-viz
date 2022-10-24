import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";

export const BillableHoursStats = () => {
    const statsApi = useStatsApiContext();

    return <Card sx={ {
        position: 'relative',
        minHeight: 200
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Total Billable hours</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { round(statsApi.billableHoursPercentage, 1) }%
                </Typography>
            }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
        { !statsApi.isLoading && <CardActions>
            <Typography
                variant={ 'caption' }>
                Billable/Non
                billable: { round(statsApi.billableHours, 1) }/{ round(statsApi.nonBillableHours, 1) }
            </Typography>
        </CardActions> }
    </Card>;
}
