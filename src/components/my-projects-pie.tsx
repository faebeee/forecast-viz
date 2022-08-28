import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { COLORS } from "../config";
import { SpentProjectHours } from "../server/utils";

export type MyProjectsPieProps = {
    entries: SpentProjectHours[]
}

export const MyProjectsPie = ({ entries }: MyProjectsPieProps) => {
    return <ResponsiveContainer width={ '100%' } height={ 400 }>
        <PieChart height={ 400 }>
            <Pie
                dataKey="hours"
                isAnimationActive={ false }
                data={ entries }
                label={ (e) => e.payload.projectName }
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
