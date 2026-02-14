import { useState, useEffect, useCallback } from 'react';

const api = window.api;

export function useProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await api.project.list();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { projects, loading, refresh };
}

export function useDevelopers(projectId: number | null) {
  const [developers, setDevelopers] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    if (!projectId) return;
    setDevelopers(await api.developer.list(projectId));
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { developers, refresh };
}

export function useEpics(projectId: number | null) {
  const [epics, setEpics] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    if (!projectId) return;
    setEpics(await api.epic.list(projectId));
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { epics, refresh };
}

export function useStories(projectId: number | null, filters?: any) {
  const [stories, setStories] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    if (!projectId) return;
    setStories(await api.story.list(projectId, filters));
  }, [projectId, JSON.stringify(filters)]);
  useEffect(() => { refresh(); }, [refresh]);
  return { stories, refresh };
}

export function useSprints(projectId: number | null) {
  const [sprints, setSprints] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    if (!projectId) return;
    setSprints(await api.sprint.list(projectId));
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { sprints, refresh };
}

export function useSprintMembers(projectId: number | null, sprintId: number | null) {
  const [members, setMembers] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    if (!projectId || !sprintId) return;
    setMembers(await api.sprintStory.getMembers(projectId, sprintId));
  }, [projectId, sprintId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { members, refresh };
}

export function useSprintStats(projectId: number | null, sprintId: number | null) {
  const [stats, setStats] = useState<any>(null);
  const refresh = useCallback(async () => {
    if (!projectId || !sprintId) return;
    setStats(await api.sprintStory.getSprintStats(projectId, sprintId));
  }, [projectId, sprintId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { stats, refresh };
}

export { api };
