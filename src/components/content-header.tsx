import { PropsWithChildren, ReactNode, useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { DateRangeWidget } from "./date-range-widget";
import { endOfMonth, startOfMonth, startOfYear, sub } from "date-fns";
import { useFilterContext } from "../context/filter-context";
import { MoreVert } from "@mui/icons-material";
import { DateRangeNavigation } from './date-range-navigation';

export type ContentHeaderProps = PropsWithChildren<{
    title: ReactNode;
    showPicker?: boolean;
}>;

export const ContentHeader = ({ title, children, showPicker = true }: ContentHeaderProps) => {
    const { dateRange, setDateRange } = useFilterContext();
    const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const selectWholeYear = () => setDateRange([ startOfYear(new Date()), new Date() ]);
    const selectCurrentMonth = () => setDateRange([ startOfMonth(new Date()), new Date() ]);
    const latest180Days = () => setDateRange([ sub(new Date(), { days: 180 }), new Date() ]);
    const latest7Days = () => setDateRange([ sub(new Date(), { days: 7 }), new Date() ]);
    const selectLastMonth = () => setDateRange([ startOfMonth(sub(new Date(), { months: 1 })), endOfMonth(sub(new Date(), { months: 1 })) ]);

    return <Box sx={ { display: 'flex', justifyContent: 'space-between', mb: 7} }>
        <Box sx={ { display: 'flex', marginBottom: 4 } }>
            <Typography sx={ { mr: 2 } } variant={ "h3" } color={ 'textSecondary' }>
                { title }
            </Typography>
            { children }
        </Box>
        { showPicker && <Box sx={ { display: 'flex', alignItems: 'center', width: 380 } }>    
            <DateRangeNavigation dateRange={ dateRange } onChange={ setDateRange }>
                <DateRangeWidget dateRange={ dateRange } onChange={ setDateRange }/>
            </DateRangeNavigation>
            
            <IconButton
                sx={ { ml: 1 } }
                onClick={ handleClick }
            >
                <MoreVert/>
            </IconButton>
            <Menu
                id="demo-customized-menu"
                MenuListProps={ {
                    'aria-labelledby': 'demo-customized-button',
                } }
                anchorEl={ anchorEl }
                open={ open }
                onClose={ handleClose }
            >
                <MenuItem onClick={ latest7Days } disableRipple>
                    Last 7 days
                </MenuItem>
                <MenuItem onClick={ selectCurrentMonth } disableRipple>
                    Current Month
                </MenuItem>
                <MenuItem onClick={ selectLastMonth } disableRipple>
                    Last Month
                </MenuItem>
                <MenuItem onClick={ latest180Days } disableRipple>
                    Last 180 days
                </MenuItem>
                <MenuItem onClick={ selectWholeYear } disableRipple>
                    Current Year
                </MenuItem>

            </Menu>
        </Box> }
    </Box>
}
