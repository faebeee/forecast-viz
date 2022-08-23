import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import {Header} from "../src/components/header";

function MyApp({ Component, pageProps }: AppProps) {
    return <LocalizationProvider dateAdapter={ AdapterDateFns }>
        <Component { ...pageProps } />
    </LocalizationProvider>
}

export default MyApp
