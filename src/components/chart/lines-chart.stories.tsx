import { StoryFn } from "@storybook/react";
import { COLORS } from "../../config";
import { AreasChart } from "./areas-chart";
import { LinesChart } from "./lines-chart";

export default {
    title: 'Chart / lines-chart',
    args: {
        data: [
            {
                key: 'h1',
                label: 'Hours',
                color: COLORS[1],
                data: [ {
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
                    } ]
            },

            {
                key: 'h2',
                label: 'Hours 2',
                color: COLORS[2],
                data: [ {
                    "date": "2022-11-12",
                    "hours": 0
                },
                    {
                        "date": "2022-11-13",
                        "hours": 0
                    },
                    {
                        "date": "2022-11-14",
                        "hours": 4.18
                    },
                    {
                        "date": "2022-11-15",
                        "hours": 3.87
                    },
                    {
                        "date": "2022-11-16",
                        "hours": 2.5600000000000005
                    },
                    {
                        "date": "2022-11-17",
                        "hours": 6.77
                    },
                    {
                        "date": "2022-11-18",
                        "hours": 2.56
                    },
                    {
                        "date": "2022-11-19",
                        "hours": 2
                    } ]
            }
        ],
    }
}

export const Default: StoryFn = (args) => {
    return <LinesChart data={ args.data }/>
}

export const WithReferences: StoryFn = (args) => {
    return <LinesChart data={ args.data }
        references={ [ { y: 6.4, label: 'Capcity', color: COLORS[1] } ] }/>
}
