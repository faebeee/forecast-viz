import { AppBar, Box, Button, Drawer, Toolbar, Typography } from "@mui/material";
import { Settings } from "./settings";
import { PropsWithChildren, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import qs from 'qs';

export type LayoutProps = PropsWithChildren<{
    sub?: string;
}>;
const drawerWidth = 340;

export const Layout = ({ children, sub }: LayoutProps) => {
    const router = useRouter();

    const routeQuery = useMemo(() => {
        return qs.stringify(router.query);
    }, [ router ]);

    return <>
        <AppBar position="sticky">
            <Toolbar>
                <Box sx={ { flexGrow: 1, display: { xs: 'none', md: 'flex' } } }>
                    <Link href={ `/?${ routeQuery }` }>
                        <Button sx={ { my: 2, color: 'white', display: 'block' } } component={ 'a' }>
                            Me
                        </Button>
                    </Link>
                    <Link href={ `/team?${ routeQuery }` }>
                        <Button sx={ { my: 2, color: 'white', display: 'block' } } component={ 'a' }>
                            Team
                        </Button>
                    </Link>
                </Box>

            </Toolbar>
        </AppBar>
        <Box sx={ { display: 'flex' } }>
            <Box sx={ { flexGrow: 1, } }>
                { children }
            </Box>
            <Drawer
                open
                anchor={ 'right' }
                variant={ 'permanent' }
                PaperProps={ {
                    sx: { width: drawerWidth }
                } }
                sx={ {
                    width: drawerWidth,
                    flexShrink: 0,
                } }>
                <Settings sub={ sub }/>
            </Drawer>
        </Box>
    </>
}
