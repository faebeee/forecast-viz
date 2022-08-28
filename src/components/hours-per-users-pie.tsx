import { SpentProjectHours } from "../../pages";
import { Pie, ResponsiveContainer, Tooltip, PieChart } from "recharts";

export type MyProjectsPieProps = {
    entries: {user: string, hours: number}[]
}
export const HoursPerUserPie = ({ entries }: MyProjectsPieProps) => {
    return <ResponsiveContainer width={ '100%' } height={ 400 }>
        <PieChart height={ 400 }>
            <Pie
                dataKey="hours"
                isAnimationActive={ false }
                data={ entries }
                label={ (e) => e.payload.user }
                cx="50%"
                cy="50%"
                outerRadius={ 100 }
            />
            <Tooltip/>
        </PieChart>
    </ResponsiveContainer>
}
