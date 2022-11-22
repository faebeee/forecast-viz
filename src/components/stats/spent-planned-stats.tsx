import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { round } from "lodash";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";


export const SpentPlannedStats = (params: DefaultParams) => {
    const statsApi = useStats(params);

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
                    variant={ 'h2' }>{ round(statsApi.data?.totalHours ?? 0, 1) }
                    <Typography variant={ 'body2' } component={ 'span' }>
                        of { round(statsApi.data?.totalPlannedHours ?? 0, 2) } planned
                    </Typography>
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/work.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>
}
