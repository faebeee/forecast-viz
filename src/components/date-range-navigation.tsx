import { FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { endOfMonth, startOfMonth, endOfYear, startOfYear, sub, differenceInDays, isSameWeek, startOfWeek, endOfWeek, isSameMonth, isSameYear, add, setDefaultOptions, getDefaultOptions, startOfDay, endOfDay } from 'date-fns';
import { PropsWithChildren, useEffect, useState } from 'react';
import { FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';

export type DateRangeNavigationProps = PropsWithChildren<{
    dateRange: DateRange,
    showMoreOptions: boolean,
    onChange: (d: DateRange) => void;
}>;

export type DateRange = [Date, Date];

type ModifierFunction = (date: Date, duration: Duration) => Date;
type StartEndOfIntervalFunction = (date: Date, options?: object) => Date;

enum DateInterval{
    Day = "days",
    Week = "weeks",
    Month = "months",
    Year = "years"
}

const getDateRangeInterval = (dateRange: DateRange) : DateInterval => {
    const daysBetween = differenceInDays(dateRange[1], dateRange[0]);
    
    if(daysBetween >= 6 && daysBetween < 27) return DateInterval.Week; 
    if(daysBetween >= 27 && daysBetween < 31) return DateInterval.Month;
    if(daysBetween >= 60) return DateInterval.Year;

    return DateInterval.Day;
}

const shift = (someDate: Date, modifier: ModifierFunction, duration: object, startOfInterval: StartEndOfIntervalFunction, endOfInterval: StartEndOfIntervalFunction): DateRange => {
    const options = getDefaultOptions();
    return [startOfInterval(modifier(someDate, duration), options), endOfInterval(modifier(someDate, duration), options)];
}

const prepend = (dateRange: DateRange, duration: object): DateRange => {
    return [sub(dateRange[0], duration), dateRange[1]];
}

const append = (dateRange: DateRange, duration: object): DateRange => {
    return [dateRange[0], add(dateRange[1], duration)];
}

const IntervalMapper = {
    [DateInterval.Day]: (range: DateRange, moveNext: boolean) => {
        const [startDate] = range;
        const duration : object = { days: 1 };
        return moveNext ? shift(startDate, add, duration, startOfDay, endOfDay) : shift(startDate, sub, duration, startOfDay, endOfDay);
    },
    [DateInterval.Week]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        let duration : object = { weeks: 0 };
        
        if(isSameWeek(startDate, endDate, getDefaultOptions())){
            duration = { weeks: 1 };
            return moveNext ? shift(startDate, add, duration, startOfWeek, endOfWeek) : shift(startDate, sub, duration, startOfWeek, endOfWeek);
        }

        return moveNext ? shift(endDate, add, duration, startOfWeek, endOfWeek) : shift(startDate, sub, duration, startOfWeek, endOfWeek);
    },
    [DateInterval.Month]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        let duration : object = { months: 0 };
        
        if(isSameMonth(startDate, endDate)){ 
            duration = { months: 1 };
            return moveNext ? shift(startDate, add, duration, startOfMonth, endOfMonth) : shift(startDate, sub, duration, startOfMonth, endOfMonth);
        }

        return moveNext ? shift(endDate, add, duration, startOfMonth, endOfMonth) : shift(startDate, sub, duration, startOfMonth, endOfMonth);
    },
    [DateInterval.Year]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        let duration : object = { years: 0 };
        
        if(isSameYear(startDate, endDate)){
            duration = { years: 1 };
            return moveNext ? shift(startDate, add, duration, startOfYear, endOfYear) : shift(startDate, sub, duration, startOfYear, endOfYear);
        }

        return moveNext ? shift(endDate, add, duration, startOfYear, endOfYear) : shift(startDate, sub, duration, startOfYear, endOfYear);
    }
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