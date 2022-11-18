import {
    Box,
    Button,
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

export type SettingsProps = {
}


export const Settings = ({}: SettingsProps) => {
    const filterContext = useFilterContext();
    const router = useRouter();
    const harvestClientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID


    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id='+harvestClientId+'&response_type=token');
    }

    return <div>
        <Box p={ 2 }>
            <Stack spacing={ 2 }>
                <Typography variant={ 'h4' }>Settings</Typography>
                { filterContext.harvestToken  &&
                    <TextField variant={ 'outlined' }
                        label={ 'Harvest Access Token' }
                        fullWidth
                        disabled={true}
                        value={ filterContext.harvestToken }
                        onChange={ (e) => filterContext.setHarvestToken(e.target.value) }/>
                }

                { filterContext.harvestAccountId &&
                    <TextField variant={'outlined'}
                          fullWidth
                          disabled={true}
                          label={'Harvest Account Id'}
                          value={filterContext.harvestAccountId}
                          onChange={(e) => filterContext.setHarvestAccountId(e.target.value)}/>
                }

                {filterContext.forecastAccountId &&
                    <TextField variant={'outlined'}
                               fullWidth
                               label={'Forecast Account Id'}
                               disabled={true}
                               value={filterContext.forecastAccountId}
                               onChange={(e) => filterContext.setForecastAccountId(e.target.value)}/>
                }
                <Button color={ 'primary' }
                    fullWidth
                    size={ 'large' }
                    variant={ 'contained' }
                    onClick={ onClick }
                >Authenticate</Button>

            </Stack>

        </Box>
    </div>
}
