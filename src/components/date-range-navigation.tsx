import { FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { sub, add, setDefaultOptions } from 'date-fns';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import {DateInterval, DateRange, getDateRangeInterval, IntervalMapper} from "../utils/date-utils";

export type DateRangeNavigationProps = PropsWithChildren<{
    dateRange: DateRange,
    showMoreOptions: boolean,
    onChange: (d: DateRange) => void;
}>;


const prepend = (dateRange: DateRange, duration: object): DateRange => {
    return [sub(dateRange[0], duration), dateRange[1]];
}

const append = (dateRange: DateRange, duration: object): DateRange => {
    return [dateRange[0], add(dateRange[1], duration)];
}

export const DateRangeNavigation = ({ dateRange, showMoreOptions, children, onChange }: DateRangeNavigationProps) => {
    const [ range, setRange ] = useState<DateRange>(dateRange);
    const [ periodInterval, setPeriodInterval ] = useState<string>(''); 

    setDefaultOptions({ weekStartsOn: 1 });

    useEffect(() => {
        setRange(dateRange);
    }, [dateRange]);

    const handlePeriodNavigation = (moveNext: boolean) => {
        const interval : DateInterval = periodInterval ? periodInterval as DateInterval : getDateRangeInterval(range);
        onChange?.(IntervalMapper[interval](range, moveNext));
    }

    const handlePeriodIntervalChange = (event: SelectChangeEvent<DateInterval>) => {
        setPeriodInterval(DateInterval[event.target.value as keyof typeof DateInterval]);
    };

    const handlePrependPeriodNavigation = () => {
        const duration = { [periodInterval]: 1 }
        onChange?.(prepend(range, duration));
    }

    const handleAppendPeriodNavigation = () => {
        const duration = { [periodInterval]: 1 }
        onChange?.(append(range, duration));
    }
    
    return (
        <>
            <FormControl sx={{ m: 1, minWidth: 120, display: showMoreOptions?'inline-flex':'none' }} size="medium">
                <InputLabel>Period Interval</InputLabel>
                <Select
                    defaultValue={undefined}
                    label="Period Interval"
                    onChange={handlePeriodIntervalChange}>
                    {Object.keys(DateInterval).map((key, index) => (
                        <MenuItem key={index} value={key}>{key}</MenuItem>    
                    ))}
                </Select>
            </FormControl>
            <IconButton 
                sx={{ display: showMoreOptions?'inline-flex':'none' }} 
                onClick={ () => handlePrependPeriodNavigation() }>
                <FirstPage />
            </IconButton>
            <IconButton sx={ { mr: 1 } } onClick={ () => handlePeriodNavigation(false) }>
                <NavigateBefore />
            </IconButton>
                {children}
            <IconButton sx={ { ml: 1 } } onClick={ () => handlePeriodNavigation(true) }>
                <NavigateNext />
            </IconButton>
            <IconButton 
            sx={{ display: showMoreOptions?'inline-flex':'none' }} 
            onClick={ () => handleAppendPeriodNavigation() }>
                <LastPage />
            </IconButton>
        </>
    )
}