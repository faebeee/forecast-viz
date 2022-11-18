import {
    Box, Button,
} from "@mui/material";
import Link from "next/link";


export type SettingsProps = {}


export const Settings = ({}: SettingsProps) => {

    return <div>
        <Box p={2}>
            <Link href={`/logout`}>
                <Button sx={{mr: 2}}
                        component={'a'}
                        variant={'contained'}
                        color={"primary"}>
                    Logout
                </Button>
            </Link>
        </Box>
    </div>
}
