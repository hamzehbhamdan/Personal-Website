
export type TaskStatus = "todo" | "in-progress" | "review" | "done";

export interface CustomField {
    id: string;
    label: string;
    value: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Project {
    id: string;
    name: string;
    color: string;
    description?: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: "low" | "medium" | "high";
    urgency?: "low" | "medium" | "high";
    importance?: "low" | "medium" | "high";
    timeSpent?: number; // minutes
    timerStartedAt?: Date | null; // when timer was started (for persistent tracking)
    dueDate: Date | null;
    subtasks: Subtask[];
    customFields?: CustomField[];
    projectId?: string;
    sprintId?: string; // sprint this task belongs to
    tags: string[];
    user_id?: string;
    created_at?: string;
    blockedBy?: string[]; // IDs of tasks blocking this one
}

export interface Sprint {
    id: string;
    name: string;
    goal?: string;
    startDate: Date;
    endDate: Date;
    status: "planning" | "active" | "completed";
    taskIds?: string[]; // optional - for denormalized access
}

export interface Connection {
    id: string;
    contactId: string;
    type: string;
    metadata?: any;
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    company: string;
    email?: string;
    phone?: string;
    avatarColor: string;
    lastContacted: Date;
    lastInteractionSummary?: string;
    frequency: number; // in days
    nickname?: string;
    tags: string[];
    customFields?: CustomField[];
    connections?: Connection[];
}

export interface Quote {
    id: string;
    text: string;
    author: string;
    isFavorite: boolean;
    displayDuration?: number; // in seconds
    order: number;
}

export interface DashboardSettings {
    userName: string;
    background: string;
    font: string;
    widgets: string[];
    glassOpacity: number;
    glassBlur: number;
    theme: "glass" | "solid" | "minimal";
    primaryColor: string;
    secondaryColor?: string;
    themeMode: "light" | "dark" | "system";
    recentBackgrounds: string[];
    showQuotes: boolean;
    quotes: Quote[];
    onlyShowFavoriteQuotes: boolean;
    gcalConnected: boolean;
    showNicknames: boolean;
    neuralSettings: ChatParameters;
    weatherUnit?: "C" | "F";
    autonomousSync: boolean;
    lastBriefingAt?: string;
    openSearchInNewTab?: boolean;
}

export interface VectorStore {
    id: string;
    name: string;
    documentCount: number;
    lastSync: Date;
    isActive: boolean;
}

export interface ChatParameters {
    temperature: number;
    model: "gpt-4-turbo" | "gpt-3.5-turbo";
    maxTokens: number;
    retrievalCount: number;
    activeStoreId?: string;
}
export interface Note {
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface FocusSession {
    id: string;
    userId: string;
    duration: number; // seconds
    createdAt: Date;
}
