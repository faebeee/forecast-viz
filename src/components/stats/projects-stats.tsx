import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import Image from "next/image";
import { useStatsApiContext } from "../../context/stats-api-context";

export const ProjectsStats = () => {
    const statsApi = useStatsApiContext();

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
                    variant={ 'h2' }>{ statsApi.totalProjects }
                </Typography>
            }
            <Box sx={ { position: 'absolute', bottom: 24, right: 24 } }>
                <Image src={ '/illu/projects.svg' } width={ 128 } height={ 128 }/>
            </Box>
        </CardContent>
    </Card>;
}
