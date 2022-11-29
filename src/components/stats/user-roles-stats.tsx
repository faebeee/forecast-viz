import { Box, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { DefaultParams, useStats } from "../../hooks/use-remote";

export type TotalHoursStatsProps = {
    params: DefaultParams
}

export const UserRolesStats = ({ params }: TotalHoursStatsProps) => {
    const statsApi = useStats(params);

    return <Card sx={ {
        position: 'relative',
        minHeight: '200px',
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>Roles</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography variant={ 'body2' } component={ 'span' }>
                    { statsApi.data?.roles?.join(', ') }
                </Typography> }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
            </Box>
        </CardContent>
        { statsApi.data?.isAdmin && <CardActions>
            <Typography variant={ 'body2' } component={ 'span' }>
                Has Admin rights
            </Typography>
        </CardActions> }
    </Card>
}
