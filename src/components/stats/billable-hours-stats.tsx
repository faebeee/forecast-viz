import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";


export const BillableHoursStats = ( params:DefaultParams ) => {
    const statsApi = useStats(params)

    return <Card sx={ {
        position: 'relative',
        minHeight: 200
    } }>
        <CardContent>
            <Typography variant={ 'body1' }>Total Billable hours</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { round(statsApi.data?.billableHoursPercentage ?? 0, 1) }%
                </Typography>
            }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
        { !statsApi.isLoading && <CardActions>
            Billable/Non billable: { round(statsApi.data?.billableHours ?? 0, 1) }/{ round(statsApi.data?.nonBillableHours ?? 0, 1) }
        </CardActions> }
    </Card>;
}
