import { LinearGradient } from "@visx/gradient";
import { AreaClosed, Bar, Line } from "@visx/shape";
import { useCallback, useMemo } from "react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { bisector, extent } from "d3-array";
import { COLORS, PARSE_DATE_FORMAT } from "../../config";
import { parse } from "date-fns";
import { HourPerDayEntry } from "../../type";
import { curveLinear } from '@visx/curve';
import { Group } from "@visx/group";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { TooltipWithBounds, withTooltip } from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { localPoint } from "@visx/event";
import { Text } from '@visx/text';
import { Typography } from "@mui/material";

const bisectDate = bisector<HourPerDayEntry, Date>((d) => parse(d.date, PARSE_DATE_FORMAT, new Date())).left;
type AreaChartProps = {
    data: HourPerDayEntry[];
    color?: string;
    width?: number;
    height?: number;
    label: string;
    references?: { y: number, label: string, color?: string }[]
}
export const AreaChart = withTooltip<AreaChartProps, HourPerDayEntry>(
    ({
         data,
         label,
         color = COLORS[0],
         width = 1200,
         height = 600,
         references = [],
         showTooltip,
         hideTooltip,
         tooltipData,
         tooltipTop = 0,
         tooltipLeft = 0,
     }: AreaChartProps & WithTooltipProvidedProps<HourPerDayEntry>) => {
        const getDate = (e: HourPerDayEntry) => parse(e.date, PARSE_DATE_FORMAT, new Date())

        const margin = {
            left: 50,
            right: 20,
            top: 20,
            bottom: 50,
        }

        const getValue = (e: HourPerDayEntry) => e.hours;

        const xMax = width - margin.left - margin.right;
        const yMax = height - margin.top - margin.bottom;

        const xScale = useMemo(
            () =>
                scaleTime({
                    range: [ 0, xMax - margin.right ],
                    domain: extent(data, (d) => getDate(d)) as [ Date, Date ],
                }),
            [ margin.left, data, xMax, ],
        );

        const yScale = useMemo(
            () =>
                scaleLinear<number>({
                    range: [ yMax, 0 ],
                    domain: [ 0, Math.max(...data.map(getValue)) ],
                }),
            [ yMax, data ],
        );

        const handleTooltip = useCallback(
            (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
                const { x } = localPoint(event) || { x: 0 };
                const x0 = xScale.invert(x);
                const index = bisectDate(data, x0, 1);
                const d0 = data[index - 1];
                const d1 = data[index];
                let d = d0;
                if (d1 && getDate(d1)) {
                    d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
                }

                showTooltip({
                    tooltipData: d,
                    tooltipLeft: xScale(getDate(d)),
                    tooltipTop: yScale(getValue(d)),
                });
            },
            [ showTooltip, xScale, yScale, data ],
        );

        return (
            <div>

                <svg width={ width } height={ height }>
                    <rect width={ width } height={ height } fill="transparent" rx={ 14 }/>
                    <Group left={ margin.left } top={ margin.top }>
                        <LinearGradient id="area" from={ color } to={ color } toOpacity={ 0.4 }/>
                        <AxisLeft scale={ yScale }/>
                        <AxisBottom top={ yMax } scale={ xScale }/>

                        <AreaClosed
                            data={ data }
                            x={ (d) => xScale(getDate(d)) ?? 0 }
                            y={ (d) => yScale(d.hours) ?? 0 }
                            yScale={ yScale }
                            strokeWidth={ 1 }
                            pointerEvents="none"
                            stroke="url(#area)"
                            fill="url(#area)"
                            curve={ curveLinear }
                        />

                        { references.map((ref) => (<g key={ ref.label }>
                            <Line
                                from={ { x: 0, y: yScale(ref.y) } }
                                to={ { x: xMax, y: yScale(ref.y) } }
                                strokeWidth={ 1 }
                                stroke={ ref.color ?? '#000' }
                                pointerEvents="none"
                                strokeDasharray="5,2"
                            />
                            <Text
                                x={ xMax - 50 }
                                y={ yScale(ref.y) }
                                width={ 50 }
                                dy={ -10 }
                                verticalAnchor="middle"
                                scaleToFit
                                fill={ ref.color ?? '#000' }
                            >
                                { ref.label }
                            </Text>
                        </g>)) }

                        { tooltipData && (
                            <g>
                                <Line
                                    from={ { x: tooltipLeft, y: 0 } }
                                    to={ { x: tooltipLeft, y: innerHeight - margin.bottom } }
                                    strokeWidth={ 1 }
                                    stroke={ '#000' }
                                    pointerEvents="none"
                                    strokeDasharray="5,2"
                                />
                                <circle
                                    cx={ tooltipLeft }
                                    cy={ tooltipTop + 1 }
                                    r={ 4 }
                                    fill="black"
                                    fillOpacity={ 0.1 }
                                    stroke="black"
                                    strokeOpacity={ 0.1 }
                                    strokeWidth={ 2 }
                                    pointerEvents="none"
                                />
                                <circle
                                    cx={ tooltipLeft }
                                    cy={ tooltipTop }
                                    r={ 4 }
                                    stroke="white"
                                    strokeWidth={ 2 }
                                    pointerEvents="none"
                                />
                            </g>
                        ) }

                        <Bar
                            x={ margin.left }
                            y={ margin.top }
                            width={ width }
                            height={ height }
                            fill="transparent"
                            onTouchStart={ handleTooltip }
                            onTouchMove={ handleTooltip }
                            onMouseMove={ handleTooltip }
                            onMouseLeave={ () => hideTooltip() }
                        />
                    </Group>
                </svg>

                { tooltipData && (
                    <div>
                        <TooltipWithBounds
                            key={ Math.random() }
                            top={ tooltipTop - 12 }
                            left={ tooltipLeft + 12 }
                        >
                            <Typography
                                fontWeight={ '700' }>{ `Date: ${ (tooltipData.date) }` }</Typography>
                            <Typography color={ color }>{ `${ label }: ${ getValue(tooltipData) }` }</Typography>
                            { references.map((ref) => (
                                <Typography color={ ref.color }
                                    key={ ref.label }>
                                    { `${ ref.label }: ${ ref.y }` }
                                </Typography>
                            )) }
                        </TooltipWithBounds>
                    </div>
                ) }
            </div>
        );
    });
