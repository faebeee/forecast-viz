import {AppBar, Box, Button, Drawer, Toolbar, Typography} from "@mui/material";
import {Settings} from "./settings";
import {PropsWithChildren, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import qs from 'qs';
import {version, name} from "../../package.json"
import {Menu} from "@mui/icons-material";

export type LayoutProps = PropsWithChildren<{
    sub?: string;
    userName?: string | null;
}>;
const drawerWidth = 340;

export const Layout = ({children, sub, userName}: LayoutProps) => {
    const router = useRouter();
    const [showSidebar, setShowSidebar] = useState(true);

    const routeQuery = useMemo(() => {
        return qs.stringify(router.query);
    }, [router]);

    return <>
        <AppBar position="fixed" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
            <Toolbar>
                <Box sx={{flexGrow: 1, display: {xs: 'none', md: 'flex'}}}>
                    <Link href={`/?${routeQuery}`}>
                        <Button sx={{my: 2, color: 'white', display: 'block'}} component={'a'}>
                            Me
                        </Button>
                    </Link>
                    <Link href={`/team?${routeQuery}`}>
                        <Button sx={{my: 2, color: 'white', display: 'block'}} component={'a'}>
                            Team
                        </Button>
                    </Link>
                </Box>
                <Button onClick={() => setShowSidebar(!showSidebar)} variant={'text'} color={'secondary'} endIcon={<Menu/>}>
                    {userName}
                </Button>
            </Toolbar>
        </AppBar>
        <Box sx={{display: 'flex'}}>
            <Box sx={{flexGrow: 1, paddingTop: 10}}>
                {children}
            </Box>
            <Drawer
                open={showSidebar}
                anchor={'right'}
                variant={'temporary'}
                PaperProps={{
                    sx: {width: drawerWidth, paddingTop: 10}
                }}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                }}>
                <Settings sub={sub}/>
            </Drawer>
        </Box>
        <Box sx={{padding: 2}}>
            {name} v{version}
        </Box>
    </>
}
