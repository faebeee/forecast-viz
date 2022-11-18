import {
    Box,
    Button,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useFilterContext } from "../context/filter-context";
import { useRouter } from "next/router";


export type SettingsProps = {
}


export const Settings = ({}: SettingsProps) => {
    const filterContext = useFilterContext();

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


            </Stack>

        </Box>
    </div>
}
