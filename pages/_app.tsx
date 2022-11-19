import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { ThemeProvider } from "@mui/system";
import { createTheme, CssBaseline, GlobalStyles } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { format, parse, startOfWeek } from "date-fns";
import { FilterContext } from '../src/context/filter-context';
import qs from "qs";
import { useRouter } from "next/router";
import mixpanel from 'mixpanel-browser';
import {DATE_FORMAT} from "../src/context/formats";

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

    const query = useMemo(() => qs.stringify({
        from: format(dateRange[0] ?? new Date(), DATE_FORMAT),
        to: format(dateRange[1] ?? new Date(), DATE_FORMAT),
    }), [ dateRange ]);


    if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
        mixpanel.init(process.env.NEXT_PUBLIC_ANALYTICS_ID, { debug: false });
    }

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
            } }>
                <Component { ...pageProps } />
            </FilterContext.Provider>
        </ThemeProvider>
    </LocalizationProvider>
}

export default MyApp
