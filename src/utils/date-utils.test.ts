import {expect, test} from "@jest/globals"
import {DateInterval} from "./date-utils"

const dateutils = require('./date-utils')

test('calculate 1 Day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2020, 0, 1), new Date(2020, 0, 2)])).toBe(DateInterval.Day)
})

test('calculate 2 Day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 2, 15), new Date(2021, 2, 17)])).toBe(DateInterval.Day)
})

test('calculate Same Day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 2, 15), new Date(2021, 2, 15)])).toBe(DateInterval.Day)
})

test('calculate 10 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 2, 15), new Date(2021, 2, 25)])).not.toBe(DateInterval.Day)
})

test('calculate 7 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 2, 10), new Date(2021, 2, 17)])).toBe(DateInterval.Week)
})

test('calculate 20 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 2, 1), new Date(2021, 2, 21)])).toBe(DateInterval.Week)
})

test('calculate 26 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 3, 1), new Date(2021, 3, 27)])).toBe(DateInterval.Week)
})

test('calculate 27 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 3, 1), new Date(2021, 3, 28)])).toBe(DateInterval.Month)
})

test('calculate 59 day Interval', () => {
    // TODO Fix implementation
    expect(dateutils.getDateRangeInterval([new Date(2021, 3, 0), new Date(2021, 4, 27)])).toBe(DateInterval.Month)
})
test('calculate > 60 day Interval', () => {
    expect(dateutils.getDateRangeInterval([new Date(2021, 3, 0), new Date(2021, 5, 27)])).toBe(DateInterval.Year)
})

test('shift 1 day forward', () => {
    const start = new Date('2021-03-01')
    const end = new Date('2021-03-02')
    const newRange = dateutils.IntervalMapper[DateInterval.Day]([start, end], true)
    expect(newRange[0].toDateString()).toBe(new Date('2021-03-02').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-03-02').toDateString())
})

test('shift 1 day back', () => {
    const start = new Date('2021-03-01')
    const end = new Date('2021-03-02')
    const newRange = dateutils.IntervalMapper[DateInterval.Day]([start, end], false)
    expect(newRange[0].toDateString()).toBe(new Date('2021-02-28').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-02-28').toDateString())
})


test('shift 1 week forward', () => {
    const start = new Date('2021-04-04')
    const end = new Date('2021-04-10')
    const newRange = dateutils.IntervalMapper[DateInterval.Week]([start, end], true)
    expect(newRange[0].toDateString()).toBe(new Date('2021-04-11').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-04-17').toDateString())
})

test('shift 1 week back', () => {
    const start = new Date('2021-04-11')
    const end = new Date('2021-04-17')
    const newRange = dateutils.IntervalMapper[DateInterval.Week]([start, end], false)
    expect(newRange[0].toDateString()).toBe(new Date('2021-04-04').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-04-10').toDateString())
})

test('shift 1 month forward', () => {
    const start = new Date('2021-04-02')
    const end = new Date('2021-04-17')
    const newRange = dateutils.IntervalMapper[DateInterval.Month]([start, end], true)
    expect(newRange[0].toDateString()).toBe(new Date('2021-05-01').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-05-31').toDateString())
})

test('shift 1 month back', () => {
    const start = new Date('2021-04-02')
    const end = new Date('2021-04-17')
    const newRange = dateutils.IntervalMapper[DateInterval.Month]([start, end], false)
    expect(newRange[0].toDateString()).toBe(new Date('2021-03-01').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2021-03-31').toDateString())
})

test('shift 1 year forward', () => {
    const start = new Date('2021-04-02')
    const end = new Date('2021-04-17')
    const newRange = dateutils.IntervalMapper[DateInterval.Year]([start, end], true)
    expect(newRange[0].toDateString()).toBe(new Date('2022-01-01').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2022-12-31').toDateString())
})

test('shift 1 year back', () => {
    const start = new Date('2021-04-02')
    const end = new Date('2021-04-17')
    const newRange = dateutils.IntervalMapper[DateInterval.Year]([start, end], false)
    expect(newRange[0].toDateString()).toBe(new Date('2020-01-01').toDateString())
    expect(newRange[1].toDateString()).toBe(new Date('2020-12-31').toDateString())
})

// TODO also cover special cases (isSameMonth, isSameYear, isSameDay, isSameWeek) in combination with moveNext
