import { FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { setDefaultOptions } from 'date-fns';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import {DateInterval, DateRange, getDateRangeInterval, IntervalMapper, prepend, append} from "../utils/date-utils";

export type DateRangeNavigationProps = PropsWithChildren<{
    dateRange: DateRange,
    showMoreOptions: boolean,
    onChange: (d: DateRange) => void;
}>;

export const DateRangeNavigation = ({ dateRange, showMoreOptions, children, onChange }: DateRangeNavigationProps) => {
    const [ range, setRange ] = useState<DateRange>(dateRange);
    const [ periodInterval, setPeriodInterval ] = useState<DateInterval>(getDateRangeInterval(range)); 
    
    setDefaultOptions({ weekStartsOn: 1 });

    useEffect(() => {
        setRange(dateRange);
        setPeriodInterval(getDateRangeInterval(dateRange));
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
    
    const getKeyFromEnumValue = (value : string) : DateInterval => {
        const indexOfKey = Object.values(DateInterval).indexOf(value as unknown as DateInterval);
        return Object.keys(DateInterval)[indexOfKey] as DateInterval;
    }

    return (
        <>
            <FormControl sx={{ m: 1, minWidth: 120, display: showMoreOptions?'inline-flex':'none' }} size="medium">
                <InputLabel>Period Interval</InputLabel>
                <Select
                    value={getKeyFromEnumValue(periodInterval)}
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