import { Project, TimeEntry } from "./harvest-types";
import { AssignmentEntry, Forecast } from "./get-forecast";
import { differenceInDays } from "date-fns";
import { COOKIE_FORC_ACCOUNTID_NAME, COOKIE_HARV_ACCOUNTID_NAME, COOKIE_HARV_TOKEN_NAME } from "../components/settings";


export type SpentProjectHours = {
    id: string | number,
    projectId: number,
    user: string,
    notes?: any,
    projectName: string,
    hours: number,
    hours_forecast: number,
    billable?: boolean
    date?: string
}


export type MyEntries = {
    id: number,
    projectId: number,
    projectCode: string,
    hours: number,
    notes: any,
    billable: boolean;
    isRunning: boolean;
}


export const getTeamHours = (teamEntries: TimeEntry[]) => {
    return teamEntries.reduce((acc, entry) => {
        if (!acc[entry.user.id]) {
            acc[entry.user.id] = {
                user: entry.user.name,
                userId: entry.user.id,
                projects: {}
            }
        }

        if (!acc[entry.user.id].projects[entry.project.id]) {
            acc[entry.user.id].projects[entry.project.id] = {
                projectId: entry.project.id,
                billable: entry.billable,
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.user.id].projects[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<number, { user: string, userId: number, projects: Record<string, { projectId: number, billable: boolean, name: string, hours: number }> }>)
}

export const findAssignment = (assignments: AssignmentEntry[], projectId: number, userId?: number): AssignmentEntry[] => {
    return assignments.filter((assignment) => {
        if (projectId && userId) {
            return assignment.project?.harvest_id === projectId && assignment.person?.harvest_user_id === userId;
        }
        return assignment.project?.harvest_id === projectId;
    });
}

export const getMyAssignments = (assignments: AssignmentEntry[], userId?: number): AssignmentEntry[] => {
    return assignments.filter((assignment) => assignment.person?.harvest_user_id === userId);
}

export const filterActiveAssignments = (projects: Map<number, Forecast.Project>, assignments: AssignmentEntry[]) => {
    return assignments.filter((a) => {
        return a.project?.harvest_id && projects.has(a.project?.harvest_id) && !projects.get(a.project?.harvest_id)!.archived;
    });
}

export const getTeamHoursEntries = (teamEntries: TimeEntry[], assignments: AssignmentEntry[]): SpentProjectHours[] => {
    const teamHours = getTeamHours(teamEntries);
    return Object.values(teamHours).reduce((acc, entry) => {
        Object.values(entry.projects).forEach((project) => {
            const _assignments = findAssignment(assignments, project.projectId, entry.userId);
            const plannedHours = _assignments.reduce((acc, assignment) => {
                return acc + (assignment.totalHours ?? 0);
            }, 0);
            acc.push({
                id: `${ entry.user }-${ project.name }`,
                projectId: project.projectId,
                user: entry.user,
                billable: project.billable,
                projectName: project.name,
                hours: project.hours,
                hours_forecast: plannedHours,
            })
        });
        return acc;
    }, [] as SpentProjectHours[]);
}

export const getTeamAssignments = (assignments: AssignmentEntry[], teamIds: number[]) => {
    return assignments.filter((a) => teamIds.includes(a.person?.harvest_user_id!))
}

export const getHoursPerUser = (entries: TimeEntry[]): { user: string, hours: number }[] => {
    const list = entries.reduce((acc, entry) => {
        if (!acc[entry.user.id]) {
            acc[entry.user.id] = {
                user: entry.user.name,
                hours: 0,
            }
        }

        acc[entry.user.id].hours += entry.hours;

        return acc;
    }, {} as Record<number, { user: string, hours: number }>)

    return Object.values(list)
}

export const getTeamProjectHours = (teamEntries: TimeEntry[]): Record<string, SpentProjectHours> => {
    return teamEntries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                id: entry.user.id,
                user: entry.user.name,
                projectId: entry.project.id,
                projectName: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0,
                billable: entry.billable,
                hours_forecast: 0,
            };
        }

        acc[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<string, SpentProjectHours>)
}

export const getProjectsFromEntries = (projectsMap: Map<number, Forecast.Project>, entries: TimeEntry[], assignment: AssignmentEntry[]): Forecast.Project[] => {
    const map = new Map<number, Forecast.Project>()
    entries.reduce((acc, entry) => {
        if (!acc.has(entry.project.id) && projectsMap.has(entry.project.id)) {
            acc.set(entry.project.id, projectsMap.get(entry.project.id)!);
        }
        return acc;
    }, map);

    assignment.reduce((acc, entry) => {
        if (entry.project?.harvest_id && !acc.has(entry.project.harvest_id) && projectsMap.has(entry.project.harvest_id)) {
            acc.set(entry.project.harvest_id, projectsMap.get(entry.project.harvest_id)!);
        }
        return acc;
    }, map);
    return Array.from(map.values());
}

export const getPersonsMap = (persons: Forecast.Person[]): Map<number, Forecast.Person> => {
    return persons.reduce((map, person) => {
        if (!map.has(person.harvest_user_id)) {
        }
        map.set(person.harvest_user_id, person);
        return map;
    }, new Map<number, Forecast.Person>);
}
