import {
    add, differenceInDays,
    endOfDay, endOfMonth,
    endOfWeek, endOfYear,
    getDefaultOptions,
    isSameMonth,
    isSameWeek, isSameYear,
    startOfDay, startOfMonth,
    startOfWeek, startOfYear,
    sub
} from "date-fns";

export type DateRange = [Date, Date];

type ModifierFunction = (date: Date, duration: Duration) => Date;
type StartEndOfIntervalFunction = (date: Date, options?: object) => Date;

export enum DateInterval {
    Day = "days",
    Week = "weeks",
    Month = "months",
    Year = "years"
}

const shift = (someDate: Date, modifier: ModifierFunction, duration: object, startOfInterval: StartEndOfIntervalFunction, endOfInterval: StartEndOfIntervalFunction): DateRange => {
    const options = getDefaultOptions();
    return [startOfInterval(modifier(someDate, duration), options), endOfInterval(modifier(someDate, duration), options)];
}

export const getDateRangeInterval = (dateRange: DateRange): DateInterval => {
    const daysBetween = differenceInDays(dateRange[1], dateRange[0]);

    if (daysBetween >= 6 && daysBetween < 27) return DateInterval.Week;
    if (daysBetween >= 27 && daysBetween < 60) return DateInterval.Month;
    if (daysBetween >= 60) return DateInterval.Year;

    return DateInterval.Day;
}

export const IntervalMapper = {
    [DateInterval.Day]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        return shift(moveNext ? endDate : startDate, moveNext ? add : sub, { days: 1 }, startOfDay, endOfDay);
    },
    [DateInterval.Week]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        const sameWeek = isSameWeek(startDate, endDate, getDefaultOptions());
        const duration = sameWeek ? {weeks: 1} : {weeks: 0};
        const date = moveNext && sameWeek ? startDate : moveNext ? endDate : startDate;
        return shift(date, moveNext ? add : sub, duration, startOfWeek, endOfWeek);
    },
    [DateInterval.Month]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        const sameMonth = isSameMonth(startDate, endDate)
        const duration  = sameMonth ?   { months: 1 } : { months: 0 }
        const date = moveNext && sameMonth ? startDate : moveNext ? endDate : startDate;
        return shift(date, moveNext ? add : sub, duration, startOfMonth, endOfMonth);
    },
    [DateInterval.Year]: (range: DateRange, moveNext: boolean) => {
        const [startDate, endDate] = range;
        const sameYear = isSameYear(startDate, endDate);
        const duration = sameYear ? {years: 1} : {years: 0};
        const date = moveNext && sameYear ? startDate : moveNext ? endDate : startDate;
        return shift(date, moveNext ? add : sub, duration, startOfYear, endOfYear)
    }
}
