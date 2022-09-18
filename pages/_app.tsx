import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { ThemeProvider } from "@mui/system";
import { createTheme, CssBaseline, GlobalStyles } from "@mui/material";

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
        MuiCard: {
            defaultProps: {
                elevation: 12,
                variant: 'elevation',
            },
            styleOverrides: {
                root: {
                    // background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
                }
            }
        }
    }
});

function MyApp({ Component, pageProps }: AppProps) {
    return <LocalizationProvider dateAdapter={ AdapterDateFns }>
        <ThemeProvider theme={ theme }>
            <CssBaseline/>
            <GlobalStyles styles={ { body: { background: 'rgba(255, 255, 255, 0.9)' } } }/>
            <Component { ...pageProps } />
        </ThemeProvider>
    </LocalizationProvider>
}

export default MyApp
