import { Card, CardContent, TextField, Typography } from "@mui/material";
import DatePicker from "react-datepicker";
import { useState } from "react";

export type DateRangeWidgetProps = {
    dateRange: [ Date, Date ]
    onChange: (d: [ Date, Date ]) => void;
    onClose?: () => void;
}

export const DATE_FORMAT = 'yyyy-MM-dd';


export const DateRangeWidget = ({ dateRange, onChange, onClose }: DateRangeWidgetProps) => {
    const [ range, setRange ] = useState<[ Date, Date ]>(dateRange);
    const onCalendarClose = () => {
        onClose?.();
        onChange?.(range);
    }

    return <DatePicker
        selectsRange
        startDate={ range[0] }
        endDate={ range[1] }
        dateFormat={ DATE_FORMAT }
        customInput={ <TextField variant={ 'outlined' } label={ 'Date range' } fullWidth/> }
        onCalendarClose={ onCalendarClose }
        onChange={ (d) => setRange(d as [ Date, Date ]) }
    />
}
