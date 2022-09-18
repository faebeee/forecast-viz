import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { COLORS } from "../config";
import { SpentProjectHours } from "../server/utils";
import { get } from "lodash";

export type MyProjectsPieProps<T> = {
    entries: T[];
    value: string;
    label: string | ((payload: T) => string);
}

export function MyProjectsPie<T>({ entries, value, label }: MyProjectsPieProps<T>) {
    return <ResponsiveContainer width={ '100%' } height={ 400 }>
        <PieChart height={ 400 }>
            <Pie
                dataKey={ value }
                isAnimationActive={ false }
                data={ entries }
                label={ (e) => typeof label === 'function' ? label(e.payload) : get(e.payload, label) }
                cx="50%"
                cy="50%"
                outerRadius={ 100 }
            >
                {
                    entries.map((entry, index) => <Cell key={ index } fill={ COLORS[index % COLORS.length] }/>)
                }
            </Pie>
            <Tooltip/>
        </PieChart>
    </ResponsiveContainer>
}
