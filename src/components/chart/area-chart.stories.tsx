import { AreaChart } from "./area-chart";
import { StoryFn } from "@storybook/react";
import { COLORS } from "../../config";
import { curveLinear } from "@visx/curve";
import { AreaClosed } from "@visx/shape";

export default {
    title: 'Chart / area-chart',
    args: {
        label: 'Hours',
        data: [
            {
                "date": "2022-11-12",
                "hours": 0
            },
            {
                "date": "2022-11-13",
                "hours": 0
            },
            {
                "date": "2022-11-14",
                "hours": 8.18
            },
            {
                "date": "2022-11-15",
                "hours": 7.87
            },
            {
                "date": "2022-11-16",
                "hours": 7.5600000000000005
            },
            {
                "date": "2022-11-17",
                "hours": 7.77
            },
            {
                "date": "2022-11-18",
                "hours": 8.56
            },
            {
                "date": "2022-11-19",
                "hours": 0
            }
        ],
        color: COLORS[3],
    }
}

export const Default: StoryFn = (args) => {
    return <AreaChart data={ args.data } color={ args.color } label={ args.label }/>
}

export const WithReferences: StoryFn = (args) => {
    return <AreaChart data={ args.data } color={ args.color } label={ args.label }
        references={ [ { y: 6.4, label: 'Capcity', color: COLORS[1] } ] }/>
}
