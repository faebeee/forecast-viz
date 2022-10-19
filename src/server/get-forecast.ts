import axios from "axios";
import { differenceInDays, isAfter, isBefore } from "date-fns";

export type AssignmentEntry = Forecast.Assignment & {
    person?: Forecast.Person,
    project?: Forecast.Project,
    hoursPerDay?: number;
    totalHours?: number;
    days?: number;
}


export declare module Forecast {
    export interface Assignment {
        id: number;
        start_date: string;
        end_date: string;
        allocation?: any;
        notes?: any;
        updated_at: Date;
        updated_by_id: number;
        project_id: number;
        person_id: number;
        placeholder_id?: any;
        repeated_assignment_set_id: number;
        active_on_days_off: boolean;
    }

    export interface Project {
        id: number | string;
        name: string;
        color: string;
        code: string;
        notes: string;
        start_date: string;
        end_date: string;
        harvest_id?: string | number;
        archived: boolean;
        updated_at: Date;
        updated_by_id: number;
        client_id?: number;
        tags: string[];
    }

    export interface GetProjectsResponse {
        projects: Project[];
    }


    export interface GetPeopleResponse {
        people: Person[];
    }


    export interface WorkingDays {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
    }

    export interface Person {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        login: string;
        admin: boolean;
        archived: boolean;
        subscribed: boolean;
        avatar_url: string;
        roles: string[];
        updated_at: Date;
        updated_by_id?: number;
        harvest_user_id: number;
        weekly_capacity: number;
        working_days: WorkingDays;
        color_blind: boolean;
        personal_feed_token_id?: number;
    }
}


export const getForecast = (accessToken: string, accountId: number) => {
    const api = axios.create({
        baseURL: 'https://api.forecastapp.com/',
        headers: {
            Authorization: ` Bearer ${ accessToken }`,
            'Forecast-Account-ID': accountId
        }
    })

    const getProjects = async (): Promise<Forecast.Project[]> => {
        try {
            const response = await api.get<Forecast.GetProjectsResponse>(`/projects`);
            const projects: Forecast.Project[] = response.data.projects;
            return projects.map(p => ({ ...p, harvest_id: p.harvest_id ?? p.name })).filter(p => true);
        } catch (e) {
            console.error(e);
        }
        return [];
    }


    const getProjectsMap = (projects: Forecast.Project[]): Map<number | string, Forecast.Project> => {
        return projects.reduce((map, project) => {
            if ((project.harvest_id && !map.has(project.harvest_id) && !project.archived)) {
                map.set(project.harvest_id, project);
            }
            return map;
        }, new Map<number | string, Forecast.Project>())
    }

    const getPersons = async (): Promise<Forecast.Person[]> => {

        try {
            const response = await api.get<Forecast.GetPeopleResponse>(`/people`);
            return response.data.people.filter((p) => !p.archived && p.login === 'enabled');
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    const getAssignments = async (from: string, to: string): Promise<AssignmentEntry[]> => {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const projects = await getProjects();
        const persons = await getPersons();
        const projectMap = new Map<number | string, Forecast.Project>();
        projects.forEach(((p) => {
            projectMap.set(p.id, p)
        }))

        const personMap = new Map<number, Forecast.Person>();
        persons.forEach(((p) => {
            personMap.set(p.id, p)
        }))


        try {
            const response = await api.get<{ assignments: Forecast.Assignment[] }>(`/assignments?start_date=${ from }&end_date=${ to }`);
            const entries = response.data.assignments;
            const r = entries.map((e) => {
                const startDate = isBefore(new Date(e?.start_date), fromDate) ? fromDate : new Date(e?.start_date);
                const endDate = isAfter(new Date(e?.end_date), toDate) ? toDate : new Date(e?.end_date);
                const days = (!!e?.start_date && !!e?.end_date) ? differenceInDays(endDate, startDate) : 0;

                return {
                    ...e,
                    days: days + 1,
                    hoursPerDay: (e?.allocation / 60 / 60),
                    totalHours: (days + 1) * (e?.allocation / 60 / 60),
                    project: projectMap.get(e.project_id),
                    person: personMap.get(e.person_id),
                }
            })
            return r.filter((entry) => !entry.project?.archived);
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    return {
        getAssignments,
        getPersons,
        getProjects,
        getProjectsMap,
    }
}
