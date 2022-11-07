import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { ThemeProvider } from "@mui/system";
import { createTheme, CssBaseline, GlobalStyles } from "@mui/material";
import cookies from "js-cookie";
import {
    COOKIE_FORC_ACCOUNTID_NAME,
    COOKIE_HARV_ACCOUNTID_NAME,
    COOKIE_HARV_TOKEN_NAME
} from "../src/components/settings";
import { useEffect, useMemo, useState } from "react";
import { endOfWeek, format, parse, startOfWeek } from "date-fns";
import { FilterContext } from '../src/context/filter-context';
import qs from "qs";
import { DATE_FORMAT } from "../src/components/date-range-widget";
import { useRouter } from "next/router";
import { COOKIE_TTL } from "../src/config";

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#333',
        },
        secondary: {
            main: '#ffe290',
        },
    },
    components: {
        MuiContainer: {
            defaultProps: {
                maxWidth: false
            },
        },
        MuiCard: {
            defaultProps: {
                elevation: 24,
                variant: 'elevation',
            },
            styleOverrides: {
                root: {
                    background: "linear-gradient(to right, #283048, #859398)",
                    color: 'white',
                }
            }
        }
    }
});

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    const [ dateRange, setDateRange ] = useState<[ Date, Date ]>([
        router.query.from ? parse(router.query.from as string, DATE_FORMAT, new Date()) : startOfWeek(new Date(), { weekStartsOn: 1 }),
        router.query.to ? parse(router.query.to as string, DATE_FORMAT, new Date()) : new Date(),
    ]);
    const [ harvestToken, setHarvestToken ] = useState<string>(cookies.get(COOKIE_HARV_TOKEN_NAME) ?? '');
    const [ harvestAccountId, setHarvestAccountId ] = useState<string>(cookies.get(COOKIE_HARV_ACCOUNTID_NAME) ?? '');
    const [ forecastAccountId, setForecastAccountId ] = useState<string>(cookies.get(COOKIE_FORC_ACCOUNTID_NAME) ?? '');

    const query = useMemo(() => qs.stringify({
        from: format(dateRange[0] ?? new Date(), DATE_FORMAT),
        to: format(dateRange[1] ?? new Date(), DATE_FORMAT),
    }), [ dateRange ]);

    useEffect(() => {
        cookies.set(COOKIE_HARV_TOKEN_NAME, harvestToken, { expires: COOKIE_TTL })
    }, [ harvestToken ])

    useEffect(() => {
        cookies.set(COOKIE_HARV_ACCOUNTID_NAME, harvestAccountId, { expires: COOKIE_TTL })
    }, [ harvestAccountId ]);
    useEffect(() => {
        cookies.set(COOKIE_FORC_ACCOUNTID_NAME, forecastAccountId, { expires: COOKIE_TTL })
    }, [ forecastAccountId ])


    useEffect(() => {
        router.replace(`?${ query }`, `?${ query }`)
    }, [ query ]);

    return <LocalizationProvider dateAdapter={ AdapterDateFns }>
        <ThemeProvider theme={ theme }>
            <CssBaseline/>
            <GlobalStyles styles={ { body: { background: 'rgba(255, 255, 255, 0.9)' } } }/>
            <FilterContext.Provider value={ {
                dateRange,
                setDateRange,
                harvestAccountId,
                setHarvestAccountId,
                forecastAccountId,
                setForecastAccountId,
                harvestToken,
                setHarvestToken,
            } }>
                <Component { ...pageProps } />
            </FilterContext.Provider>
        </ThemeProvider>
    </LocalizationProvider>
}

export default MyApp
