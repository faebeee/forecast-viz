import { Project, TimeEntry } from "./harvest-types";
import { AssignmentEntry } from "./get-forecast";
import { SpentProjectHours } from "../../pages";
import { differenceInDays } from "date-fns";

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
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.user.id].projects[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<number, { user: string, userId: number, projects: Record<string, { projectId: number, name: string, hours: number }> }>)
}

export const findAssignment = (assignments: AssignmentEntry[], projectId: number, userId?: number): AssignmentEntry[] => {
    return assignments.filter((assignment) => {
        if (projectId && userId) {
            return assignment.project?.harvest_id === projectId && assignment.person?.harvest_user_id === userId;
        }
        return assignment.project?.harvest_id === projectId;
    });
}

export const getTeamHoursEntries = (teamEntries: TimeEntry[], assignments: AssignmentEntry[]): SpentProjectHours[] => {
    const teamHours = getTeamHours(teamEntries);
    return Object.values(teamHours).reduce((acc, entry) => {
        Object.values(entry.projects).forEach((project) => {
            const _assignments = findAssignment(assignments, project.projectId, entry.userId);
            const plannedHours = _assignments.reduce((acc, assignment) => {
                const days = (!!assignment?.start_date && !!assignment?.end_date) ? differenceInDays(new Date(assignment?.end_date), new Date(assignment?.start_date)) : 0;
                return acc + (days + 1) * (assignment?.allocation / 60 / 60) ?? 0;
            }, 0);
            acc.push({
                id: `${ entry.user }-${ project.name }`,
                projectId: project.projectId,
                user: entry.user,
                projectName: project.name,
                hours: project.hours,
                hours_forecast: plannedHours,
            })
        });
        return acc;
    }, [] as SpentProjectHours[]);
}

export const getHoursPerUser = (entries: TimeEntry[]): { user: string, hours: number }[] => {
    const list =  entries.reduce((acc, entry) => {
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
                hours_forecast: 0,
            };
        }

        acc[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<string, SpentProjectHours>)
}

export const getProjectsFromEntries = (entries: TimeEntry[]): Project[] => {
    return Array.from(entries.reduce((acc, entry) => {
        if (!acc.has(entry.project.id)) {
            acc.set(entry.project.id, entry.project);
        }
        return acc;
    }, new Map<number, Project>()).values());
}
