import { contextBridge, ipcRenderer } from 'electron';

const api = {
  project: {
    list: () => ipcRenderer.invoke('project:list'),
    create: (data: any) => ipcRenderer.invoke('project:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id),
    get: (id: number) => ipcRenderer.invoke('project:get', id),
  },
  developer: {
    list: (projectId: number) => ipcRenderer.invoke('developer:list', projectId),
    create: (projectId: number, data: any) => ipcRenderer.invoke('developer:create', projectId, data),
    update: (projectId: number, id: number, data: any) => ipcRenderer.invoke('developer:update', projectId, id, data),
    delete: (projectId: number, id: number) => ipcRenderer.invoke('developer:delete', projectId, id),
  },
  epic: {
    list: (projectId: number) => ipcRenderer.invoke('epic:list', projectId),
    create: (projectId: number, data: any) => ipcRenderer.invoke('epic:create', projectId, data),
    update: (projectId: number, id: number, data: any) => ipcRenderer.invoke('epic:update', projectId, id, data),
    delete: (projectId: number, id: number) => ipcRenderer.invoke('epic:delete', projectId, id),
  },
  story: {
    list: (projectId: number, filters?: any) => ipcRenderer.invoke('story:list', projectId, filters),
    create: (projectId: number, data: any) => ipcRenderer.invoke('story:create', projectId, data),
    update: (projectId: number, id: number, data: any) => ipcRenderer.invoke('story:update', projectId, id, data),
    delete: (projectId: number, id: number) => ipcRenderer.invoke('story:delete', projectId, id),
    get: (projectId: number, id: number) => ipcRenderer.invoke('story:get', projectId, id),
  },
  sprint: {
    list: (projectId: number) => ipcRenderer.invoke('sprint:list', projectId),
    create: (projectId: number, data: any) => ipcRenderer.invoke('sprint:create', projectId, data),
    update: (projectId: number, id: number, data: any) => ipcRenderer.invoke('sprint:update', projectId, id, data),
    delete: (projectId: number, id: number) => ipcRenderer.invoke('sprint:delete', projectId, id),
    get: (projectId: number, id: number) => ipcRenderer.invoke('sprint:get', projectId, id),
  },
  sprintStory: {
    getMembers: (projectId: number, sprintId: number) => ipcRenderer.invoke('sprintStory:getMembers', projectId, sprintId),
    setMembers: (projectId: number, sprintId: number, members: any[]) => ipcRenderer.invoke('sprintStory:setMembers', projectId, sprintId, members),
    assignStory: (projectId: number, storyId: number, sprintId: number) => ipcRenderer.invoke('sprintStory:assignStory', projectId, storyId, sprintId),
    unassignStory: (projectId: number, storyId: number) => ipcRenderer.invoke('sprintStory:unassignStory', projectId, storyId),
    getSprintStats: (projectId: number, sprintId: number) => ipcRenderer.invoke('sprintStory:getSprintStats', projectId, sprintId),
    getProjectStats: (projectId: number) => ipcRenderer.invoke('project:getProjectStats', projectId),
  },
  status: {
    list: (projectId: number) => ipcRenderer.invoke('status:list', projectId),
    create: (projectId: number, data: any) => ipcRenderer.invoke('status:create', projectId, data),
    update: (projectId: number, id: number, data: any) => ipcRenderer.invoke('status:update', projectId, id, data),
    delete: (projectId: number, id: number) => ipcRenderer.invoke('status:delete', projectId, id),
  },
  exportPdf: {
    printPage: (projectId: number, sprintId: number) => ipcRenderer.invoke('export:printPage', projectId, sprintId),
    printProjectReport: (projectId: number) => ipcRenderer.invoke('export:printProjectReport', projectId),
    saveSprintPlan: (projectId: number, sprintId: number) => ipcRenderer.invoke('export:saveSprintPlan', projectId, sprintId),
    exportCsv: (projectId: number, sprintId: number) => ipcRenderer.invoke('export:csv', projectId, sprintId),
    importCsv: (projectId: number, sprintId: number) => ipcRenderer.invoke('export:importCsv', projectId, sprintId),
    importBacklogCsv: (projectId: number) => ipcRenderer.invoke('export:importBacklogCsv', projectId),
    importStatusCsv: (projectId: number, sprintId: number) => ipcRenderer.invoke('export:importStatusCsv', projectId, sprintId),
  },
};

contextBridge.exposeInMainWorld('api', api);
