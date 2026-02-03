import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CreateRecurringChoreRequest {
    weekday: bigint;
    assignedTo?: Principal;
    name: string;
    description: string;
    timeline: Timeline;
}
export interface GetCookingAssignment {
    day: string;
}
export type Time = bigint;
export interface RecurringChore {
    id: bigint;
    weekday: bigint;
    assignedTo?: Principal;
    name: string;
    createdBy: Principal;
    description: string;
    paused: boolean;
    timeline: Timeline;
}
export interface GetCalendarRequest {
    endDate: Time;
    startDate: Time;
}
export interface SortTasksByDueDateRequest {
    tasks: Array<Task>;
}
export interface Task {
    id: bigint;
    assignedTo?: Principal;
    name: string;
    createdBy: Principal;
    completed: boolean;
    dueDate?: Time;
    description: string;
    recurringChoreId?: bigint;
}
export interface CookingAssignment {
    day: string;
    assignedBy: Principal;
    cook?: Principal;
    cookName?: string;
}
export interface CalendarDay {
    tasks: Array<Task>;
    date: Time;
    cookingAssignment?: CookingAssignment;
}
export interface UpdateCookingDayRequest {
    day: string;
    cook?: Principal;
    cookName?: string;
}
export interface PauseResumeChoreRequest {
    id: bigint;
    pause: boolean;
}
export interface AssignCookingDayRequest {
    day: string;
    cook?: Principal;
    cookName?: string;
}
export interface FilterByAssigneeRequest {
    assignee: Principal;
}
export interface AddTaskRequest {
    assignedTo?: Principal;
    name: string;
    dueDate?: Time;
    description: string;
}
export interface UpdateRecurringChoreRequest {
    id: bigint;
    weekday: bigint;
    assignedTo?: Principal;
    name: string;
    description: string;
    timeline: Timeline;
}
export interface PersonProfile {
    principal: Principal;
    displayName: string;
    color: string;
}
export enum Timeline {
    fortnightly = "fortnightly",
    weeklies = "weeklies",
    monthly = "monthly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTask(request: AddTaskRequest): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignCookingDay(request: AssignCookingDayRequest): Promise<void>;
    clearCompletedTasks(): Promise<void>;
    createRecurringChore(request: CreateRecurringChoreRequest): Promise<bigint>;
    deleteProfile(principal: Principal): Promise<void>;
    deleteRecurringChore(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getActiveRecurringChores(): Promise<Array<RecurringChore>>;
    getAllProfiles(): Promise<Array<PersonProfile>>;
    getAllRecurringChores(): Promise<Array<RecurringChore>>;
    getAllTasks(): Promise<Array<Task>>;
    getCalendar(request: GetCalendarRequest): Promise<Array<CalendarDay>>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletedTasks(): Promise<Array<Task>>;
    getCookingAssignment(request: GetCookingAssignment): Promise<CookingAssignment>;
    getCookingAssignments(): Promise<Array<CookingAssignment>>;
    getPendingTasks(): Promise<Array<Task>>;
    getProfile(principal: Principal): Promise<PersonProfile>;
    getRecurringChore(id: bigint): Promise<RecurringChore>;
    getTask(id: bigint): Promise<Task>;
    getTasksByAssignee(request: FilterByAssigneeRequest): Promise<Array<Task>>;
    getTasksByDate(date: Time): Promise<Array<Task>>;
    isCallerAdmin(): Promise<boolean>;
    pauseResumeRecurringChore(request: PauseResumeChoreRequest): Promise<void>;
    sortTasksByDueDate(request: SortTasksByDueDateRequest): Promise<Array<Task>>;
    toggleTaskCompletion(id: bigint): Promise<void>;
    updateCookingDay(request: UpdateCookingDayRequest): Promise<void>;
    updateRecurringChore(request: UpdateRecurringChoreRequest): Promise<void>;
    updateTask(id: bigint, name: string, description: string, dueDate: Time | null, assignedTo: Principal | null): Promise<void>;
    upsertProfile(profile: PersonProfile): Promise<void>;
}
