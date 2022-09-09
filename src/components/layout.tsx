import { AppBar, Box, Button, Drawer, Toolbar, Typography } from "@mui/material";
import { Settings } from "./settings";
import { PropsWithChildren, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import qs from 'qs';
import { version, name } from "../../package.json"
import { Menu } from "@mui/icons-material";
import { useTheme } from "@mui/system";
import { grey } from "@mui/material/colors";
import { useFilterContext } from "../context/filter-context";

export type LayoutProps = PropsWithChildren<{
    active?: string;
    userName?: string | null;
}>;
const drawerWidth = 340;

export const Layout = ({ children, active, userName }: LayoutProps) => {
    const theme = useTheme();
    const [ showSidebar, setShowSidebar ] = useState(true);
    const context = useFilterContext();

    return <>
        <AppBar position="fixed" sx={ { zIndex: (theme) => theme.zIndex.drawer + 1 } }>
            <Toolbar color={ 'black.200' }>
                <Box sx={ { flexGrow: 1, display: { xs: 'none', md: 'flex' } } }>
                    <Link href={ `/?${ context.queryString }` }>
                        <Button sx={ { display: 'block' } }
                            component={ 'a' }
                            variant={ 'text' }
                            color={ "secondary" }
                        >
                            Me
                        </Button>
                    </Link>
                    <Link href={ `/team?${ context.queryString }` }>
                        <Button sx={ { display: 'block' } }
                            component={ 'a' }
                            variant={ 'text' }
                            color={ "secondary" }
                            disabled={ !context.teamId }
                        >
                            Team
                        </Button>
                    </Link>
                </Box>
                <Button onClick={ () => setShowSidebar(!showSidebar) } variant={ 'text' } color={ 'secondary' }
                    endIcon={ <Menu/> }>
                    { userName }
                </Button>
            </Toolbar>
        </AppBar>
        <Box sx={ { display: 'flex' } }>
            <Box sx={ { flexGrow: 1, paddingTop: 10 } }>
                { children }
            </Box>
            <Drawer
                open={ showSidebar }
                anchor={ 'right' }
                variant={ 'temporary' }
                PaperProps={ {
                    sx: { width: drawerWidth, paddingTop: 10 }
                } }
                sx={ {
                    width: drawerWidth,
                    flexShrink: 0,
                } }>
                <Settings/>
            </Drawer>
        </Box>
        <Box sx={ { padding: 2 } }>
            { name } v{ version }
        </Box>
    </>
}
