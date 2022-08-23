import {Toolbar, Container, AppBar, Typography} from "@mui/material";
import {PropsWithChildren} from "react";

export type HeaderProps = PropsWithChildren<{}>;

export const Header = ({children}: HeaderProps) => {
    return <AppBar position="static">
        <Container maxWidth="xl">
            <Toolbar disableGutters>
                {children}
            </Toolbar>
        </Container>
    </AppBar>
}
