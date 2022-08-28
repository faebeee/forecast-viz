import axios from "axios";

export type AssignmentEntry = Forecast.Assignment & {
    person?: Forecast.Person,
    project?: Forecast.Project,
}


declare module Forecast {


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
        id: number;
        name: string;
        color: string;
        code: string;
        notes: string;
        start_date: string;
        end_date: string;
        harvest_id?: number;
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
            return response.data.projects;
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    const getPersons = async (): Promise<Forecast.Person[]> => {
        try {
            const response = await api.get<Forecast.GetPeopleResponse>(`/people`);
            return response.data.people;
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    const getAssignments = async (from: string, to: string): Promise<AssignmentEntry[]> => {
        const projects = await getProjects();
        const persons = await getPersons();
        const projectMap = new Map<number, Forecast.Project>();
        projects.forEach(((p) => {
            projectMap.set(p.id, p)
        }))

        const personMap = new Map<number, Forecast.Person>();
        persons.forEach(((p) => {
            personMap.set(p.id, p)
        }))


        try {
            const response = await api.get<{ assignments: Forecast.Assignment[] }>(`/assignments?start_date=${ from }&end_date=${to}`);
            const entries = response.data.assignments;
            const r = entries.map((e) => {
                return {
                    ...e,
                    project: projectMap.get(e.project_id),
                    person: personMap.get(e.person_id),
                }
            })
            return r;
        } catch (e) {
            console.error(e);
        }
        return [];
    }

    return {
        getAssignments,
        getPersons
    }
}
