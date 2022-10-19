import { Box, Button, Typography } from "@mui/material";
import { DateRangeWidget } from "./date-range-widget";
import { PropsWithChildren } from "react";
import { startOfMonth, startOfYear, sub } from "date-fns";
import { useFilterContext } from "../context/filter-context";

export type ContentHeaderProps = PropsWithChildren<{
    title: string;
}>;

export const ContentHeader = ({ title }: ContentHeaderProps) => {
    const { dateRange, setDateRange } = useFilterContext();

    const selectWholeYear = () => setDateRange([ startOfYear(new Date()), new Date() ]);
    const selectCurrentMonth = () => setDateRange([ startOfMonth(new Date()), new Date() ]);
    const latest180Days = () => setDateRange([ sub(new Date(), { days: 180 }), new Date() ]);

    return <Box sx={ { display: 'flex', justifyContent: 'space-between', mb: 7, mt: 5 } }>
        <Typography sx={ { marginBottom: 4, flexGrow: 1 } } variant={ "h3" } color={ 'textSecondary' }>
            { title }
        </Typography>
        <Box sx={ { width: 280 } }>
            <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
            <Button variant='text' color={ 'primary' } onClick={ selectWholeYear }>Year</Button>
            <Button variant='text' color={ 'primary' } onClick={ selectCurrentMonth }>Month</Button>
            <Button variant='text' color={ 'primary' } onClick={ latest180Days }>Last 180
                days</Button>
        </Box>
    </Box>
}
