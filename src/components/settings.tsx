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
import { useRouter } from "next/router";
import { useMemo } from "react";

export const COOKIE_HARV_TOKEN_NAME = 'harvest-token';
export const COOKIE_HARV_ACCOUNTID_NAME = 'harvest-account-id';
export const COOKIE_FORC_ACCOUNTID_NAME = 'forecast-account-id';

export type SettingsProps = {}


export const Settings = ({}: SettingsProps) => {
    const filterContext = useFilterContext();
    const router = useRouter();

    const onClick = () => {
        router.push('/', '/');
    }
    const isValid = useMemo(() => {
        return !!filterContext.harvestToken && !!filterContext.harvestAccountId && !!filterContext.forecastAccountId;
    }, [ filterContext ])

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

                <Button color={ 'primary' }
                    fullWidth
                    disabled={ !isValid }
                    size={ 'large' }
                    variant={ 'contained' }
                    onClick={ onClick }

                >Search</Button>
            </Stack>

        </Box>
    </div>
}
