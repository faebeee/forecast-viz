import { Box, Button, Typography } from "@mui/material";
import { DateRangeWidget } from "./date-range-widget";
import { PropsWithChildren, ReactNode } from "react";
import { startOfMonth, startOfYear, sub } from "date-fns";
import { useFilterContext } from "../context/filter-context";

export type ContentHeaderProps = PropsWithChildren<{
    title: ReactNode;
}>;

export const ContentHeader = ({ title, children }: ContentHeaderProps) => {
    const { dateRange, setDateRange } = useFilterContext();

    const selectWholeYear = () => setDateRange([ startOfYear(new Date()), new Date() ]);
    const selectCurrentMonth = () => setDateRange([ startOfMonth(new Date()), new Date() ]);
    const latest180Days = () => setDateRange([ sub(new Date(), { days: 180 }), new Date() ]);

    return <Box sx={ { display: 'flex', justifyContent: 'space-between', mb: 7, mt: 5 } }>
        <Box sx={ { display: 'flex', marginBottom: 4 } }>
            <Typography sx={ { mr: 2 } } variant={ "h3" } color={ 'textSecondary' }>
                { title }
            </Typography>
            { children }
        </Box>
        <Box sx={ { width: 280 } }>
            <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
            <Button variant='text' color={ 'primary' } onClick={ selectWholeYear }>Year</Button>
            <Button variant='text' color={ 'primary' } onClick={ selectCurrentMonth }>Month</Button>
            <Button variant='text' color={ 'primary' } onClick={ latest180Days }>Last 180
                days</Button>
        </Box>
    </Box>
}
