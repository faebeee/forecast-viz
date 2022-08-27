
import {DATE_FORMAT, DateRangeWidget} from "./date-range-widget";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    FormControl, InputLabel, Link,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import cookies from "js-cookie";
import {format} from "date-fns";
import {useRouter} from "next/router";

 const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';
const COOKIE_FORC_ACCOUNTID_NAME = 'forecast-account-id';

export type SettingsProps = {
    from: string;
    to: string;
}


const TEAMS = [
    {
        name: "Team Eis",
        key: 'Projektteam 1',
    },
    {
        name: "Team Zwei",
        key: 'Projektteam 2',
    },
    {
        name: "Team Drüü",
        key: 'Projektteam 3',
    },
];

export const Settings = ({from, to}: SettingsProps) => {
    const router = useRouter();
    const [selectedTeam, setTeam] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(from), new Date(to)]);
    const [harvestToken, setHarvestToken] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [harvestAccountId, setHarvestAccountId] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [forecastAccountId, setForecastAccountId] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken)
    }, [harvestToken])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId)
    }, [harvestAccountId]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId)
    }, [forecastAccountId])

    const refreshRoute = useCallback(() => {
        const url = `/?from=${format(dateRange[0] ?? new Date(), DATE_FORMAT)}&to=${format(dateRange[1] ?? new Date(), DATE_FORMAT)}&token=${harvestToken}&account=${harvestAccountId}&faccount=${forecastAccountId}&team=${selectedTeam}`
        router.push(url, url)
    }, [dateRange, harvestToken, harvestAccountId, selectedTeam, forecastAccountId,]);


    return <Card>
        <CardContent>
            <Typography variant={'h2'}>Settings</Typography>
            <Typography variant={'body1'}>
                Create your accesstokens <Link href={'https://id.getharvest.com/developers'}
                                          target={'_blank'}>
                here
            </Link>
            </Typography>
            <Stack spacing={2}>
                <TextField variant={'outlined'}
                           label={'Harvest Access Token'}
                           fullWidth
                           value={harvestToken}
                           onChange={(e) => setHarvestToken(e.target.value)}/>

                <TextField variant={'outlined'}
                           fullWidth
                           label={'Harvest Account Id'}
                           value={harvestAccountId}
                           onChange={(e) => setHarvestAccountId(e.target.value)}/>

                <TextField variant={'outlined'}
                           fullWidth
                           label={'Forecast Account Id'}
                           value={forecastAccountId}
                           onChange={(e) => setForecastAccountId(e.target.value)}/>

                <DateRangeWidget dateRange={dateRange} onChange={setDateRange}/>

                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Team</InputLabel>
                    <Select
                        value={selectedTeam}
                        label="Team"
                        onChange={(e) => setTeam(e.target.value)}>
                        {TEAMS.map((team) => <MenuItem key={team.key}
                                                       value={team.key}>{team.name}</MenuItem>)}

                    </Select>
                </FormControl>
            </Stack>
        </CardContent>
        <CardActions>
            <Button color={'primary'}
                    size={'large'}
                    variant={'contained'}
                    onClick={refreshRoute}>Search</Button>
        </CardActions>
    </Card>
}
