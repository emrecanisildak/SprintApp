export interface Project {
  id: number;
  name: string;
  db_path: string;
  story_point_hours: number;
  daily_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Developer {
  id: number;
  name: string;
  email: string | null;
  created_at: string;
}

export interface Epic {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export interface Story {
  id: number;
  title: string;
  description: string | null;
  story_points: number | null;
  epic_id: number | null;
  assignee_id: number | null;
  sprint_id: number | null;
  status: StoryStatus;
  created_at: string;
  updated_at: string;
  epic_name?: string;
  epic_color?: string;
  assignee_name?: string;
}

export type StoryStatus = string;

// export const STORY_STATUSES: StoryStatus[] = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Deployed'];

export interface Sprint {
  id: number;
  name: string;
  start_date: string;
  duration_days: number;
  status: SprintStatus;
  created_at: string;
}

export type SprintStatus = 'Planning' | 'Active' | 'Completed';

export interface SprintMember {
  id: number;
  sprint_id: number;
  developer_id: number;
  allocation_percent: number;
  developer_name: string;
  developer_email?: string;
}

export interface SprintStats {
  total_stories: number;
  total_points: number;
  completed_points: number;
  completion_percent: number;
  status_counts: Record<string, number>;
  status_points: Record<string, number>;
  developer_stats: DeveloperStat[];
  epic_stats: EpicStat[];
  stories: Story[];
}

export interface EpicStat {
  name: string;
  color: string;
  total_points: number;
  completed_points: number;
  story_count: number;
}

export interface DeveloperStat {
  name: string;
  total_points: number;
  completed_points: number;
  story_count: number;
}

export interface Status {
  id: number;
  name: string;
  color: string;
  is_default: number;
  is_completed: number;
  position: number;
}

export interface ElectronAPI {
  project: {
    list: () => Promise<Project[]>;
    create: (data: Partial<Project>) => Promise<Project>;
    update: (id: number, data: Partial<Project>) => Promise<Project>;
    delete: (id: number) => Promise<void>;
    get: (id: number) => Promise<Project>;
  };
  developer: {
    list: (projectId: number) => Promise<Developer[]>;
    create: (projectId: number, data: Partial<Developer>) => Promise<Developer>;
    update: (projectId: number, id: number, data: Partial<Developer>) => Promise<Developer>;
    delete: (projectId: number, id: number) => Promise<void>;
  };
  epic: {
    list: (projectId: number) => Promise<Epic[]>;
    create: (projectId: number, data: Partial<Epic>) => Promise<Epic>;
    update: (projectId: number, id: number, data: Partial<Epic>) => Promise<Epic>;
    delete: (projectId: number, id: number) => Promise<void>;
  };
  story: {
    list: (projectId: number, filters?: any) => Promise<Story[]>;
    create: (projectId: number, data: Partial<Story>) => Promise<Story>;
    update: (projectId: number, id: number, data: Partial<Story>) => Promise<Story>;
    delete: (projectId: number, id: number) => Promise<void>;
    get: (projectId: number, id: number) => Promise<Story>;
  };
  sprint: {
    list: (projectId: number) => Promise<Sprint[]>;
    create: (projectId: number, data: Partial<Sprint>) => Promise<Sprint>;
    update: (projectId: number, id: number, data: Partial<Sprint>) => Promise<Sprint>;
    delete: (projectId: number, id: number) => Promise<void>;
    get: (projectId: number, id: number) => Promise<Sprint>;
  };
  sprintStory: {
    getMembers: (projectId: number, sprintId: number) => Promise<SprintMember[]>;
    setMembers: (projectId: number, sprintId: number, members: { developer_id: number; allocation_percent: number }[]) => Promise<SprintMember[]>;
    assignStory: (projectId: number, storyId: number, sprintId: number) => Promise<void>;
    unassignStory: (projectId: number, storyId: number) => Promise<void>;
    getSprintStats: (projectId: number, sprintId: number) => Promise<SprintStats>;
  };
  status: {
    list: (projectId: number) => Promise<Status[]>;
    create: (projectId: number, data: Partial<Status>) => Promise<Status>;
    update: (projectId: number, id: number, data: Partial<Status>) => Promise<Status>;
    delete: (projectId: number, id: number) => Promise<void>;
  };
  exportPdf: {
    printPage: (projectId: number, sprintId: number) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>;
    saveSprintPlan: (projectId: number, sprintId: number) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>;
    exportCsv: (projectId: number, sprintId: number) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>;
    importCsv: (projectId: number, sprintId: number) => Promise<{ success: boolean; imported?: number; cancelled?: boolean }>;
    importBacklogCsv: (projectId: number) => Promise<{ success: boolean; imported?: number; cancelled?: boolean }>;
    importStatusCsv: (projectId: number, sprintId: number) => Promise<{ success: boolean; updated?: number; cancelled?: boolean }>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
