import { Box, Button, Divider, Drawer, Stack, Typography } from "@mui/material";
import { PropsWithChildren, useState } from "react";
import Link from "next/link";
import { name, version } from "../../package.json"
import { Menu } from "@mui/icons-material";

export type LayoutProps = PropsWithChildren<{
    active?: string;
    userName?: string | null;
    hasAdminAccess?: boolean;
}>;
const drawerWidth = 180;

export const Layout = ({ children, active, userName, hasAdminAccess }: LayoutProps) => {
    const [ showSidebar, setShowSidebar ] = useState(false);

    return <div>
        <Drawer
            sx={ {
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    borderRight: 'none',
                },
            } }
            variant="persistent"
            anchor="left"
            open={ true }>
            <Box sx={ { padding: 2 } }>
                <Stack spacing={ 2 }>
                    <Typography textAlign={ 'center' } color={ 'secondary' }>
                        { userName }
                    </Typography>

                    <Divider/>

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

                    <Divider/>

                    <Link href={ `/logout` }>
                        <Button sx={ { mr: 2 } }
                            component={ 'a' }
                            variant={ 'contained' }
                            color={ "error" }>
                            Logout
                        </Button>
                    </Link>

                    <Typography variant={ 'caption' }>
                        { name } v{ version }
                    </Typography>
                </Stack>
            </Box>
        </Drawer>
        <Box sx={ {
            marginLeft: `${ drawerWidth }px`,
            marginTop: 4,
            backgroundColor: '#141e30',
            borderTopLeftRadius: 20
        } }>
            { children }
        </Box>

    </div>

}
