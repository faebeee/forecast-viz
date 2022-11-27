import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import Image from "next/image";
import {DefaultParams, useStats} from "../../hooks/use-remote";

export const ProjectsStats = (params: DefaultParams) => {

    const statsApi = useStats(params);

    return  <Card sx={ {
        position: 'relative',
        minHeight: 200
    } }
    >
        <CardContent>
            <Typography variant={ 'body1' }>My Projects</Typography>
            { statsApi.isLoading && <CircularProgress color={ 'secondary' }/> }
            { !statsApi.isLoading &&
                <Typography
                    variant={ 'h2' }>{ statsApi.data?.totalProjects }
                </Typography>
            }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>;
}
