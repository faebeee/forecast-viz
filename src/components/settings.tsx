import { DateRangeWidget } from "./date-range-widget";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useFilterContext } from "../context/filter-context";

export const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
export const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';
export const COOKIE_FORC_ACCOUNTID_NAME = 'forecast-account-id';

export type SettingsProps = {
    roles?: { key: string, name: string }[];
    sub?: string;
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


export const Settings = ({ roles = TEAMS, }: SettingsProps) => {
    const filterContext = useFilterContext();

    return <div>
        <Box p={ 2 }>
            <Typography variant={ 'h4' }>Settings</Typography>

            <Stack spacing={ 2 }>
                <Typography variant={ 'body1' }>
                    Create your accesstokens <Link href={ 'https://id.getharvest.com/developers' }
                    target={ '_blank' }>
                    here
                </Link>
                </Typography>
                <TextField variant={ 'outlined' }
                    label={ 'Harvest Access Token' }
                    fullWidth
                    value={ filterContext.harvestToken }
                    onChange={ (e) => filterContext.setHarvestToken(e.target.value) }/>

                <TextField variant={ 'outlined' }
                    fullWidth
                    label={ 'Harvest Account Id' }
                    value={ filterContext.harvestAccountId }
                    onChange={ (e) => filterContext.setHarvestAccountId(e.target.value) }/>

                <TextField variant={ 'outlined' }
                    fullWidth
                    label={ 'Forecast Account Id' }
                    value={ filterContext.forecastAccountId }
                    onChange={ (e) => filterContext.setForecastAccountId(e.target.value) }/>

                <DateRangeWidget dateRange={ filterContext.dateRange } onChange={ filterContext.setDateRange }/>

                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Team</InputLabel>
                    <Select
                        value={ filterContext.teamId }
                        label="Team"
                        onChange={ (e) => filterContext.setTeamId(e.target.value as string) }>
                        { roles.map((role) => <MenuItem key={ role.key }
                            value={ role.key }>{ role.name }</MenuItem>) }
                    </Select>
                </FormControl>

                <Button color={ 'primary' }
                    fullWidth
                    size={ 'large' }
                    variant={ 'contained' }
                    onClick={ filterContext.executeSearch }>Search</Button>
            </Stack>

        </Box>
    </div>
}
