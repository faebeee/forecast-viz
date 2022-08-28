export type APIError = {
    error: string,
    error_description: string
}


export interface User {
    id: number;
    name: string;
}

export interface Client {
    id: number;
    name: string;
}

export interface Project {
    id: number;
    name: string;
    code: string;
}

export interface Task {
    id: number;
    name: string;
}

export interface UserAssignment {
    id: number;
    is_project_manager: boolean;
    is_active: boolean;
    budget?: any;
    created_at: Date;
    updated_at: Date;
    hourly_rate: number;
}

export interface TaskAssignment {
    id: number;
    billable: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    hourly_rate: number;
    budget?: any;
}

export interface Invoice {
    id: number;
    number: string;
}

export interface TimeEntry {
    id: number;
    spent_date: string;
    user: User;
    client: Client;
    project: Project;
    task: Task;
    user_assignment: UserAssignment;
    task_assignment: TaskAssignment;
    hours: number;
    hours_without_timer: number;
    rounded_hours: number;
    notes: string;
    created_at: Date;
    updated_at: Date;
    is_locked: boolean;
    locked_reason: string;
    is_closed: boolean;
    is_billed: boolean;
    timer_started_at?: any;
    started_time: string;
    ended_time: string;
    is_running: boolean;
    invoice: Invoice;
    external_reference?: any;
    billable: boolean;
    budgeted: boolean;
    billable_rate?: number;
    cost_rate: number;
}

export interface Links {
    first: string;
    next?: any;
    previous?: any;
    last: string;
}

export interface GetTimeEntriesResponse {
    time_entries: TimeEntry[];
    per_page: number;
    total_pages: number;
    total_entries: number;
    next_page?: any;
    previous_page?: any;
    page: number;
    links: Links;
}

export namespace GetProjectReports {

    export interface Result {
        project_id: number;
        project_name: string;
        client_id: number;
        client_name: string;
        total_hours: number;
        billable_hours: number;
        currency: string;
        billable_amount: number;
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface Response {
        results: Result[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}


export namespace GetTaskReport{

    export interface Result {
        task_id: number;
        task_name: string;
        total_hours: number;
        billable_hours: number;
        currency: string;
        billable_amount: number;
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface Response {
        results: Result[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}

export namespace GetUser{

    export interface User {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        telephone: string;
        timezone: string;
        has_access_to_all_future_projects: boolean;
        is_contractor: boolean;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        weekly_capacity: number;
        default_hourly_rate: number;
        cost_rate: number;
        roles: string[];
        avatar_url: string;
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface GetUserResponse {
        users: User[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}


export namespace GetMe{

    export interface GetMeResponse {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        telephone: string;
        timezone: string;
        has_access_to_all_future_projects: boolean;
        is_contractor: boolean;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        weekly_capacity: number;
        default_hourly_rate: number;
        cost_rate: number;
        roles: string[];
        avatar_url: string;
    }

}


export namespace GetProjectAssignment {

    export interface Project {
        id: number;
        name: string;
        code: string;
    }

    export interface Client {
        id: number;
        name: string;
    }

    export interface Task {
        id: number;
        name: string;
    }

    export interface TaskAssignment {
        id: number;
        billable: boolean;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        hourly_rate: number;
        budget?: any;
        task: Task;
    }

    export interface ProjectAssignment {
        id: number;
        is_project_manager: boolean;
        is_active: boolean;
        use_default_rates: boolean;
        budget?: any;
        created_at: Date;
        updated_at: Date;
        hourly_rate: number;
        project: Project;
        client: Client;
        task_assignments: TaskAssignment[];
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface GetProjectAssignmentResponse {
        project_assignments: ProjectAssignment[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}


export namespace GetProjectBudget {

    export interface Result {
        project_id: number;
        project_name: string;
        client_id: number;
        client_name: string;
        budget_is_monthly: boolean;
        budget_by: string;
        is_active: boolean;
        budget: number;
        budget_spent: number;
        budget_remaining: number;
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface Response {
        results: Result[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}

export namespace GetUsersAPI {

    export interface User {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        telephone: string;
        timezone: string;
        has_access_to_all_future_projects: boolean;
        is_contractor: boolean;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        weekly_capacity: number;
        default_hourly_rate: number;
        cost_rate: number;
        roles: string[];
        avatar_url: string;
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface Response {
        users: User[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}

export namespace RolesApi {

    export interface Role {
        id: number;
        name: string;
        created_at: Date;
        updated_at: Date;
        user_ids: number[];
    }

    export interface Links {
        first: string;
        next?: any;
        previous?: any;
        last: string;
    }

    export interface Response {
        roles: Role[];
        per_page: number;
        total_pages: number;
        total_entries: number;
        next_page?: any;
        previous_page?: any;
        page: number;
        links: Links;
    }

}

