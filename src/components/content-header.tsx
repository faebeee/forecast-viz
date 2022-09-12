import { Box, Typography } from "@mui/material";
import { DateRangeWidget } from "./date-range-widget";
import { PropsWithChildren } from "react";

export type ContentHeaderProps = PropsWithChildren<{
    title: string;
}>;

export const ContentHeader = ({ children, title }: ContentHeaderProps) => {
    return <Box sx={ { display: 'flex', justifyContent: 'space-between' } }>
        <Typography sx={ { marginBottom: 4, flexGrow: 1 } } variant={ "h3" }>
            { title }
        </Typography>
        <Box sx={ { width: 280 } }>
            { children }
        </Box>
    </Box>
}
