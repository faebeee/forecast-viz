import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { ThemeProvider } from "@mui/system";
import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: '#333',
        },
        secondary: {
            main: '#bebebe',
        }
    },
});

function MyApp({ Component, pageProps }: AppProps) {
    return <LocalizationProvider dateAdapter={ AdapterDateFns }>
        <ThemeProvider theme={ theme }>
            <Component { ...pageProps } />
        </ThemeProvider>
    </LocalizationProvider>
}

export default MyApp
