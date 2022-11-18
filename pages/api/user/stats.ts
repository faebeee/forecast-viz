import { NextApiRequest, NextApiResponse } from "next";
import { getAuthFromCookies, getRange, hasApiAccess } from "../../../src/server/api-utils";
import { getHarvest } from "../../../src/server/get-harvest";
import {
    filterActiveAssignments,
    getDates,
    getHoursPerTask,
    getMyAssignments,
    getProjectsFromEntries, HourPerTaskObject
} from "../../../src/server/utils";
import { AssignmentEntry, Forecast, getForecast } from "../../../src/server/get-forecast";
import { TimeEntry } from "../../../src/server/harvest-types";
import { HourPerDayEntry } from "../../../src/type";
import { differenceInBusinessDays, format, isWeekend, parse } from "date-fns";
import { getTimeEntriesForUser } from "../../../src/server/services/get-time-entries-for-users";
import { sortBy } from "lodash";
import {DATE_FORMAT} from "../../../src/context/formats";
import {withSessionApiRoute} from "../../../src/server/with-session";

export type GetStatsHandlerResponse = {
    totalHours: number;
    totalPlannedHours: number;
    totalProjects: number;
    avgPerDay: number;
    billableHours: number;
    nonBillableHours: number;
    billableHoursPercentage: number;
    totalWeeklyCapacity: number;
    totalHoursPerDayCapacity: number;
    lastEntryDate: string;
    hoursPerDay: HourPerDayEntry[];
    overtimePerDay: HourPerDayEntry[];
    hoursPerTask: HourPerTaskObject[];
}

export const getStatsHandler = async (req: NextApiRequest, res: NextApiResponse<GetStatsHandlerResponse | null>) => {
    if (!hasApiAccess(req)) {
        res.status(403).send(null);
        return;
    }
    const apiAuth = getAuthFromCookies(req);
    const range = getRange(req);
    const harvest = await getHarvest(apiAuth.harvestToken, apiAuth.harvestAccount);
    const forecast = getForecast(apiAuth.harvestToken, apiAuth.forecastAccount);

    const userData = await harvest.getMe();
    const userId = req.query.uid ? parseInt(req.query.uid as string) : userData.id;
    const projectId = req.query['project_id'] ? parseInt(req.query['project_id'] as string) : undefined;

    const [ entries, assignments, projects, persons ]: [ TimeEntry[], AssignmentEntry[], Forecast.Project[], Forecast.Person[] ] = await Promise.all([
        getTimeEntriesForUser(harvest, userId, range.from, range.to, projectId),
        forecast.getAssignments(range.from, range.to, projectId),
        forecast.getProjects(projectId),
        forecast.getPersons(),
    ]);
    const myData = persons.find((p) => p.harvest_user_id === userId);
    if (!myData) {
        throw new Error('No data found for user');
    }

    const rangeDays = differenceInBusinessDays(parse(range.to, DATE_FORMAT, new Date()), parse(range.from, DATE_FORMAT, new Date())) + 1
    const projectMap = forecast.getProjectsMap(projects);
    const activeAssignments = filterActiveAssignments(projectMap, assignments);
    const myAssignments = getMyAssignments(activeAssignments, userId);
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
    const myProjects = getProjectsFromEntries(projectMap, entries, myAssignments);
    const totalProjects = myProjects.length;

    const totalPlannedHours = myAssignments.reduce((acc, assignment) => acc + (assignment.totalHours ?? 0), 0);
    const days = getDates(parse(range.from, DATE_FORMAT, new Date()), parse(range.to, DATE_FORMAT, new Date()));
    const amountOfWorkingDays = Object.values(myData.working_days).filter(Boolean).length;
    const weeklyCapacity = myData.weekly_capacity / 60 / 60;
    const dailyCapacity = weeklyCapacity / amountOfWorkingDays;
    const getRecord = () => days.reduce((acc, date) => {
        const formattedDate = format(date, DATE_FORMAT);
        acc[formattedDate] = { date: formattedDate, hours: 0 };
        return acc;
    }, {} as Record<string, HourPerDayEntry>)

    const hoursPerDay: HourPerDayEntry[] = Object.values<{ date: string, hours: number }>(entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, getRecord()));


    const overtimePerDay: HourPerDayEntry[] = Object.values<{ date: string, hours: number }>(entries.reduce((acc, entry) => {
        if (!acc[entry.spent_date]) {
            acc[entry.spent_date] = { date: entry.spent_date, hours: 0 };
        }
        acc[entry.spent_date].hours += entry.hours;
        return acc;
    }, getRecord()))
        .map((entry) => {
            return { ...entry, hours: Math.max(entry.hours - dailyCapacity, 0) }
        });

    const billableHours = entries.reduce((acc, entry) => {
        if (entry.billable) {
            acc.billable += entry.hours;
        } else {
            acc.nonBillable += entry.hours;
        }

        return acc;
    }, { billable: 0, nonBillable: 0 });

    const hoursPerTask = getHoursPerTask(entries);
    const lastEntryDate = entries[0]?.spent_date;

    const result = {
        totalHours,
        totalPlannedHours,
        totalProjects,
        hoursPerDay: sortBy(hoursPerDay, 'date'),
        billableHoursPercentage: 100 / (billableHours.billable + billableHours.nonBillable) * billableHours.billable,
        billableHours: billableHours.billable,
        nonBillableHours: billableHours.nonBillable,
        avgPerDay: (totalHours / rangeDays),
        totalWeeklyCapacity: weeklyCapacity,
        totalHoursPerDayCapacity: dailyCapacity,
        hoursPerTask,
        lastEntryDate,
        overtimePerDay,
    }

    res.send(result);
}
export default withSessionApiRoute(getStatsHandler);
