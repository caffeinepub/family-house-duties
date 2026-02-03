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
}
export interface CalendarDay {
    tasks: Array<Task>;
    date: Time;
    cookingAssignment?: CookingAssignment;
}
export interface UpdateCookingDayRequest {
    day: string;
    cook?: Principal;
}
export interface AssignCookingDayRequest {
    day: string;
    cook?: Principal;
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
export interface GetTaskRequest {
    id: bigint;
}
export interface UpdateRecurringChoreRequest {
    id: bigint;
    weekday: bigint;
    assignedTo?: Principal;
    name: string;
    description: string;
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
    deleteRecurringChore(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getAllRecurringChores(): Promise<Array<RecurringChore>>;
    getAllTasks(): Promise<Array<Task>>;
    getCalendar(request: GetCalendarRequest): Promise<Array<CalendarDay>>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletedTasks(): Promise<Array<Task>>;
    getCookingAssignment(request: GetCookingAssignment): Promise<CookingAssignment>;
    getCookingAssignments(): Promise<Array<CookingAssignment>>;
    getPendingTasks(): Promise<Array<Task>>;
    getRecurringChore(id: bigint): Promise<RecurringChore>;
    getTask(request: GetTaskRequest): Promise<Task>;
    getTasksByAssignee(request: FilterByAssigneeRequest): Promise<Array<Task>>;
    getTasksByDate(date: Time): Promise<Array<Task>>;
    isCallerAdmin(): Promise<boolean>;
    sortTasksByDueDate(request: SortTasksByDueDateRequest): Promise<Array<Task>>;
    toggleTaskCompletion(id: bigint): Promise<void>;
    updateCookingDay(request: UpdateCookingDayRequest): Promise<void>;
    updateRecurringChore(request: UpdateRecurringChoreRequest): Promise<void>;
    updateTask(id: bigint, name: string, description: string, dueDate: Time | null, assignedTo: Principal | null): Promise<void>;
}
