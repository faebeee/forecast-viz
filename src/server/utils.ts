import { TimeEntry } from "./harvest-types";
import { AssignmentEntry } from "./get-forecast";

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

export const findAssignment = (assignments: AssignmentEntry[], projectId: number, userId?: number):AssignmentEntry | null => {
    return assignments.find((assignment) => {
        if (projectId && userId) {
            return assignment.project?.harvest_id === projectId && assignment.person?.harvest_user_id === userId;
        }
        return assignment.project?.harvest_id === projectId;
    }) ?? null;
}

export const getTeamHoursEntries = (teamEntries: TimeEntry[], assignments: AssignmentEntry[]) => {
    const teamHours = getTeamHours(teamEntries);
    return Object.values(teamHours).reduce((acc, entry) => {
        Object.values(entry.projects).forEach((project) => {
            const assignment = findAssignment(assignments, project.projectId, entry.userId);
            acc.push({
                id: `${ entry.user }-${ project.name }`,
                user: entry.user,
                project: project.name,
                hours: project.hours,
                hours_forecast: assignment?.allocation ?? 0,
            })
        });
        return acc;
    }, [] as { id: string, user: string, project: string, hours: number, hours_forecast: number }[]);
}

export const getTeamProjectHours = (teamEntries: TimeEntry[]): Record<string, { id: number, name: string, hours: number }> => {
    return teamEntries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                id: entry.project.id,
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<string, { id: number, name: string, hours: number }>)
}
