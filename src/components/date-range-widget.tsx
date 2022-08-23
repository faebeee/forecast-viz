import {Card, CardContent, TextField, Typography} from "@mui/material";
import DatePicker from "react-datepicker";
import {useState} from "react";

export type DateRangeWidgetProps = {
   dateRange: [Date | null, Date | null]
    onChange: (d: [Date, Date]) => void;
    onClose?: () => void;
}

export const DATE_FORMAT = 'yyyy-MM-dd';


export const DateRangeWidget = ({dateRange, onChange, onClose}: DateRangeWidgetProps) => {

    return <DatePicker
                selectsRange
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                dateFormat={DATE_FORMAT}
                customInput={<TextField variant={'filled'} label={'Date range'} fullWidth/>}
                onCalendarClose={onClose}
                onChange={(d) => onChange(d as [Date, Date])}
            />
}
