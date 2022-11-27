import { StoryFn } from "@storybook/react";
import { ParentSize } from "@visx/responsive";
import { COLORS } from "../../config";
import { AreasChart } from "./areas-chart";
import { Bars } from "./bars";

export default {
    title: 'Chart / bars',
    args: {
        data: [
            {
                "key": "Fabio Gianini",
                "hours": 39.94,
                "planned": 39.94,
            },
            {
                "key": "Manuel Hepp",
                "hours": 12.19,
                "planned": 39.94,
            },
            {
                "key": "Dennis Schmidlin",
                "hours": 7.59,
                "planned": 39.94,
            },
            {
                "key": "Anja Denz",
                "hours": 15,
                "planned": 39.94,
            },
            {
                "key": "Valeska Kroheck",
                "hours": 39.160000000000004,
                "planned": 39.94,
            },
            {
                "key": "Abhivir Wig",
                "hours": 21.200000000000003,
                "planned": 39.94,
            },
            {
                "key": "Samuel Hauser",
                "hours": 28.939999999999994,
                "planned": 39.94,
            },
            {
                "key": "David Dudler",
                "hours": 3.5,
                "planned": 39.94,
            }
        ]
    }
}

export const Default: StoryFn = (args) => {
    return <ParentSize enableDebounceLeadingCall debounceTime={ 10 }>
        { ({ width }) => (
            <Bars width={ width } height={ 300 } keys={ [ 'hours', 'planned' ] } data={ args.data }/>
        ) }
    </ParentSize>
}
