import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { format, parse } from "date-fns";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";
import { DATE_FORMAT } from "../../config";


export const LastEntryStats = () => {
    const statsApi = useStatsApiContext();

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Last Entry</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>
                    { statsApi.lastEntryDate ? format(parse(statsApi.lastEntryDate, 'yyyy-mm-dd', new Date()), DATE_FORMAT) : '-' }
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/documents.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>
}
