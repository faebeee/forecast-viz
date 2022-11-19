import { TextField } from "@mui/material";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import {DATE_FORMAT} from "../context/formats";

export type DateRangeWidgetProps = {
    dateRange: [ Date, Date ]
    onChange: (d: [ Date, Date ]) => void;
    onClose?: () => void;
}


export const DateRangeWidget = ({ dateRange, onChange, onClose }: DateRangeWidgetProps) => {
    const [ range, setRange ] = useState<[ Date, Date ]>(dateRange);
    const onCalendarClose = () => {
        onClose?.();
        onChange?.(range);
    }

    useEffect(() => {
        setRange(dateRange);
    }, [ dateRange ])

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
