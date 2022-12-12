import { IconButton } from '@mui/material';
import { endOfMonth, startOfMonth, endOfYear, startOfYear, sub, differenceInDays, isSameWeek, startOfWeek, endOfWeek, isSameMonth, isSameYear, add } from 'date-fns';
import { PropsWithChildren } from 'react';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';

export type DateRangeNavigationProps = PropsWithChildren<{
    dateRange: [ Date, Date ]
    onChange: (d: [ Date, Date ]) => void;
}>;

const enum DateInterval{
    Day,
    Week,
    Month,
    Year
}

export const DateRangeNavigation = ({ dateRange, children, onChange }: DateRangeNavigationProps) => {
    const getDateRangeInterval = () : DateInterval => {
        const startDate = dateRange[0];
        const endDate = dateRange[1];
        const daysBetween = differenceInDays(endDate, startDate);
        
        if(daysBetween >= 6 && daysBetween < 28){
            return DateInterval.Week; 
        }
        if(daysBetween >= 28 && daysBetween < 31){
            return DateInterval.Month;
        }
        if(daysBetween >= 60){
            return DateInterval.Year;
        }

        return DateInterval.Day;
    }

    const handlePeriodNavigation = (moveNext: boolean) => {
        const interval: DateInterval = getDateRangeInterval();
        const startDate: Date = dateRange[0];
        const endDate: Date = dateRange[1];
        let range: [Date, Date] = dateRange;

        switch(interval) {
            case DateInterval.Day: {
                range = moveNext ? 
                    [add(startDate, { days: 1 }), add(startDate, { days: 1 })] :
                    [sub(startDate, { days: 1 }), sub(startDate, { days: 1 })];
                break;
            }
            case DateInterval.Week: {
                if(isSameWeek(startDate, endDate, { weekStartsOn: 1 })) {
                    range = moveNext ? 
                        [startOfWeek(add(startDate, { days: 7 }), { weekStartsOn: 1 }), endOfWeek(add(startDate, { days:7 }), { weekStartsOn: 1 })] : 
                        [startOfWeek(sub(startDate, { days: 7 }), { weekStartsOn: 1 }), endOfWeek(sub(startDate, { days:7 }), { weekStartsOn: 1 })];
                } else {
                    range = moveNext ?
                        [startOfWeek(endDate, { weekStartsOn: 1 }), endOfWeek(endDate, { weekStartsOn: 1 })] :
                        [startOfWeek(startDate, { weekStartsOn: 1 }), endOfWeek(startDate, { weekStartsOn: 1 })];
                }
                break;
            }
            case DateInterval.Month: {
                if(isSameMonth(startDate, endDate)) {
                    range = moveNext ?
                        [startOfMonth(add(startDate, { months: 1 })), endOfMonth(add(startDate, { months: 1 }))] :
                        [startOfMonth(sub(startDate, { months: 1 })), endOfMonth(sub(startDate, { months: 1 }))];
                } else {
                    range = moveNext ?
                        [startOfMonth(endDate), endOfMonth(endDate)] :
                        [startOfMonth(startDate), endOfMonth(startDate)];
                }
                break;
            }
            case DateInterval.Year: {
                if(isSameYear(startDate, endDate)) {
                    range = moveNext ? 
                        [startOfYear(add(startDate, { years: 1 })), endOfYear(add(startDate, { years: 1 }))] :
                        [startOfYear(sub(startDate, { years: 1 })), endOfYear(sub(startDate, { years: 1 }))];
                } else {
                    range = moveNext ?
                        [startOfYear(endDate), endOfYear(endDate)] :
                        [startOfYear(startDate), endOfYear(startDate)];
                }
                break;
            }
            default: {
                break;
            }
        }

        onChange?.(range);
    }

    return (
        <>
            <IconButton sx={ { mr: 1 } } onClick={ () => handlePeriodNavigation(false) }>
                <ArrowBackIosNew />
            </IconButton>
                {children}
            <IconButton sx={ { ml: 1 } } onClick={ () => handlePeriodNavigation(true) }>
                <ArrowForwardIos />
            </IconButton>
        </>
    )
}