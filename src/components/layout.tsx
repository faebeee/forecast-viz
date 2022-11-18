import { AppBar, Box, Button, Container, Drawer, Toolbar } from "@mui/material";
import { Settings } from "./settings";
import { PropsWithChildren, useState } from "react";
import Link from "next/link";
import { name, version } from "../../package.json"
import { Menu } from "@mui/icons-material";
import { useFilterContext } from "../context/filter-context";

export type LayoutProps = PropsWithChildren<{
    active?: string;
    userName?: string | null;
    hasAdminAccess?: boolean;
}>;
const drawerWidth = 340;

export const Layout = ({ children, active, userName, hasAdminAccess }: LayoutProps) => {
    const context = useFilterContext();
    const [ showSidebar, setShowSidebar ] = useState(false);

    return <>
        <AppBar position="fixed" sx={ { zIndex: (theme) => theme.zIndex.drawer + 1 } }>
            <Toolbar sx={ { background: 'linear-gradient(to right, #141e30, #243b55)' } }>
                <Container sx={ { display: 'flex' } }>
                    <Box sx={ { flexGrow: 1, display: { xs: 'none', md: 'flex' } } }>
                        <Link href={ `/` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'day' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                Today
                            </Button>
                        </Link>
                        <Link href={ `/me` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'me' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                Me
                            </Button>
                        </Link>

                        { hasAdminAccess && <Link href={ `/team` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'team' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                Team
                            </Button>
                        </Link> }

                        <Link href={ `/company` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'company' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                Company
                            </Button>
                        </Link>

                        { hasAdminAccess && <Link href={ `/user` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'user' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                User
                            </Button>
                        </Link> }

                        { hasAdminAccess && <Link href={ `/project` }>
                            <Button sx={ { mr: 2 } }
                                component={ 'a' }
                                variant={ active === 'project' ? 'contained' : 'text' }
                                color={ "secondary" }>
                                Project
                            </Button>
                        </Link> }
                    </Box>
                    <Button onClick={ () => setShowSidebar(!showSidebar) } variant={ 'text' } color={ 'secondary' }
                        endIcon={ <Menu/> }>
                        { userName }
                    </Button>
                </Container>
            </Toolbar>
        </AppBar>
        <Box sx={ { display: 'flex' } }>
            <Container sx={ { display: 'flex', flexGrow: 1, paddingTop: 10 } }>
                { children }
            </Container>
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
