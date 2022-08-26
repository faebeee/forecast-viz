import {Avatar, Box, Card, CardContent, Divider, Grid, Typography} from "@mui/material";

export type StatsRowProps = {
    totalHours: number
    totalProjects: number
    totalTeamMembers: number
    totalTeamHours: number
    teamProjects: number
}
export const StatsRow = ({totalHours, totalProjects, totalTeamMembers, totalTeamHours, teamProjects}: StatsRowProps) => {
    return <Grid item container spacing={2}>
        <Grid item xs={6}>
            <Card>
                <CardContent>
                    <Typography variant={'h5'}>My Hours</Typography>
                    <Typography variant={'body1'}>{totalHours}</Typography>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={6}>
            <Card>
                <CardContent>
                    <Typography variant={'h5'}>My Projects</Typography>
                    <Typography variant={'body1'}>{totalProjects}</Typography>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={4}>
            <Card>
                <CardContent>
                    <Typography variant={'h5'}>Team Members</Typography>
                    <Typography variant={'body1'}>{totalTeamMembers}</Typography>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={4}>
            <Card>
                <CardContent>
                    <Typography variant={'h5'}>Team Hours</Typography>
                    <Typography variant={'body1'}>{totalTeamHours}</Typography>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={4}>
            <Card>
                <CardContent>
                    <Typography variant={'h5'}>Team Projects</Typography>
                    <Typography variant={'body1'}>{teamProjects}</Typography>
                </CardContent>
            </Card>
        </Grid>
    </Grid>;
}
