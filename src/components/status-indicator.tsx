import classes from './status-indicator.module.css';
import { CSSProperties, useMemo } from "react";
import { useTheme } from '@mui/material/styles';
import { round } from "lodash";

export type StatusIndicatorProps = {
    value: number;
}

export const StatusIndicator = ({ value }: StatusIndicatorProps) => {
    const theme = useTheme();
    const color = useMemo(() => {
        if (value === null) {
            return theme.palette.grey.A400;
        }
        if (value <= 80) {
            return theme.palette.success.light;
        }
        if (value <= 90) {
            return theme.palette.success.main;
        }
        if (value <= 100) {
            return theme.palette.success.dark;
        }

        if (value >= 150) {
            return theme.palette.error.main;
        }
        if (value >= 120) {
            return theme.palette.warning.dark;
        }
        if (value >= 110) {
            return theme.palette.warning.main;
        }
        if (value > 100) {
            return theme.palette.warning.light;
        }
        return theme.palette.grey.A400;
    }, [ value ])
    return <div className={ classes.root }
        style={ { '--status-indicator--color': color } as CSSProperties }>
        <div className={ classes.bullet }></div>
        { value && <span>{ round(value, 2) }%</span> }
    </div>
}
