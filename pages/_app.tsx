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
            main: '#607D8B',
        },
        secondary: {
            main: '#bebebe',
        }
    },
    components: {
        MuiCard: {
            defaultProps: {
                elevation: 0,
                variant: 'outlined',
            }
        }
    }
});

function MyApp({ Component, pageProps }: AppProps) {
    return <LocalizationProvider dateAdapter={ AdapterDateFns }>
        <ThemeProvider theme={ theme }>
            <CssBaseline/>
            <GlobalStyles styles={ { body: { background: 'white' } } }/>
            <Component { ...pageProps } />
        </ThemeProvider>
    </LocalizationProvider>
}

export default MyApp
