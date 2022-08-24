import { TimeEntry } from "./harvest-types";

export const getTeamHours = (teamEntries: TimeEntry[]) => {
    return teamEntries.reduce((acc, entry) => {
        if (!acc[entry.user.id]) {
            acc[entry.user.id] = {
                user: entry.user.name,
                projects: {}
            }
        }

        if (!acc[entry.user.id].projects[entry.project.id]) {
            acc[entry.user.id].projects[entry.project.id] = {
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.user.id].projects[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<number, { user: string, projects: Record<string, { name: string, hours: number }> }>)
}

export const getTeamHoursEntries = (teamEntries: TimeEntry[]) => {
    const teamHours = getTeamHours(teamEntries);
    return Object.values(teamHours).reduce((acc, entry) => {
        Object.values(entry.projects).forEach((project) => {
            acc.push({
                id: `${ entry.user }-${ project.name }`,
                user: entry.user,
                project: project.name,
                hours: project.hours,
            })
        });
        return acc;
    }, [] as { id: string, user: string, project: string, hours: number }[]);
}

export const getTeamProjectHours = (teamEntries: TimeEntry[]): Record<string, { name: string, hours: number }> => {
    return teamEntries.reduce((acc, entry) => {
        if (!acc[entry.project.id]) {
            acc[entry.project.id] = {
                name: !!entry.project.code ? entry.project.code : entry.project.name,
                hours: 0
            };
        }

        acc[entry.project.id].hours += entry.hours;

        return acc;
    }, {} as Record<string, { name: string, hours: number }>)
}
