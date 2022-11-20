import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { useMemo } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { getColor } from "../../utils/get-color";

export type BarsProps = {
    width: number;
    height: number;
    data: { key: string, [key: string]: number | string }[];
    keys: string[];
}

export const Bars = ({
                         keys,
                         data,
                         width,
                         height,
                     }: BarsProps) => {

    const margin = {
        left: 50,
        right: 20,
        top: 20,
        bottom: 50,
    }

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    // scales, memoize for performance
    const xScale = useMemo(
        () =>
            scaleBand<string>({
                range: [ 0, xMax ],
                padding: 0.2,
                domain: data.map(d => d.key),
            }),
        [ xMax ],
    );
    const yScale = useMemo(
        () =>
            scaleLinear<number>({
                range: [ yMax, 0 ],
                domain: [ 0, Math.max(...data.map(d => d[keys[0]] as number)) ],
            }),
        [ yMax ],
    );

    return width < 10 ? null : (
        <svg width={ width } height={ height }>
            <Group left={ margin.left } top={ margin.top }>
                <AxisLeft scale={ yScale }/>
                <AxisBottom top={ yMax } scale={ xScale }/>
                { data.map((d, i) => {
                    return keys.map((key, kI) => {
                        const barWidth = xScale.bandwidth();
                        const barHeight = yMax - (yScale(d[key] as number) ?? 0);
                        const barX = xScale(d.key);
                        const barY = yMax - barHeight;
                        return (
                            <Bar
                                key={ `bar-${ d.key }-${ key }` }
                                x={ (barX ?? 0) + (barWidth / keys.length * kI) }
                                y={ barY }
                                width={ barWidth / keys.length }
                                height={ barHeight }
                                fill={ getColor(i) }
                            />
                        );
                    })
                }) }
            </Group>
        </svg>
    );
}
