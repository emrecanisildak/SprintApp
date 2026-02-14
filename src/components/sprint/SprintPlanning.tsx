import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Story, StoryStatus, SprintMember } from '../../types';
import { useStories, useDevelopers, useSprintMembers, useEpics, api } from '../../hooks/useDB';
import { calculateIndividualCapacity, calculateTotalCapacity } from '../../utils/capacity';
import StoryCard from '../backlog/StoryCard';
import StoryForm from '../backlog/StoryForm';

interface Props {
  projectId: number;
  project: Project;
}

export default function SprintPlanning({ projectId, project }: Props) {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const sid = Number(sprintId);
  const [sprint, setSprint] = useState<any>(null);
  const { stories: backlogStories, refresh: refreshBacklog } = useStories(projectId, { backlog: true });
  const { stories: sprintStories, refresh: refreshSprint } = useStories(projectId, { sprint_id: sid });
  const { developers } = useDevelopers(projectId);
  const { epics } = useEpics(projectId);
  const { members, refresh: refreshMembers } = useSprintMembers(projectId, sid);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [allocations, setAllocations] = useState<Record<number, number>>({});

  useEffect(() => {
    api.sprint.get(projectId, sid).then(setSprint);
  }, [projectId, sid]);

  useEffect(() => {
    const alloc: Record<number, number> = {};
    members.forEach((m: SprintMember) => { alloc[m.developer_id] = m.allocation_percent; });
    setAllocations(alloc);
  }, [members]);

  const handleToggleMember = (devId: number) => {
    setAllocations(prev => {
      const next = { ...prev };
      if (next[devId] !== undefined) {
        delete next[devId];
      } else {
        next[devId] = 100;
      }
      return next;
    });
  };

  const handleAllocationChange = (devId: number, percent: number) => {
    setAllocations(prev => ({ ...prev, [devId]: percent }));
  };

  const handleSaveMembers = async () => {
    const memberList = Object.entries(allocations).map(([id, pct]) => ({
      developer_id: Number(id), allocation_percent: pct,
    }));
    await api.sprintStory.setMembers(projectId, sid, memberList);
    refreshMembers();
  };

  const handleAssignStory = async (storyId: number) => {
    await api.sprintStory.assignStory(projectId, storyId, sid);
    refreshBacklog();
    refreshSprint();
  };

  const handleUnassignStory = async (storyId: number) => {
    await api.sprintStory.unassignStory(projectId, storyId);
    refreshBacklog();
    refreshSprint();
  };

  const handleStatusChange = async (id: number, status: StoryStatus) => {
    await api.story.update(projectId, id, { status });
    refreshSprint();
  };

  const handleSprintStatusChange = async (status: 'Planning' | 'Active' | 'Completed') => {
    await api.sprint.update(projectId, sid, { status });
    setSprint({ ...sprint, status });
  };

  const handleCreateStory = async (data: Partial<Story>) => {
    await api.story.create(projectId, { ...data, sprint_id: sid });
    setShowStoryForm(false);
    refreshSprint();
  };

  const [exportingPlan, setExportingPlan] = useState(false);

  const handleExportPlan = async () => {
    setExportingPlan(true);
    try {
      await api.exportPdf.saveSprintPlan(projectId, sid);
    } finally {
      setExportingPlan(false);
    }
  };

  if (!sprint) return <div className="text-gray-400">Loading...</div>;

  const membersList = Object.entries(allocations).map(([id, pct]) => ({
    developer_id: Number(id), allocation_percent: pct,
  } as SprintMember));

  const totalCapacity = calculateTotalCapacity(sprint.duration_days, project.daily_hours, project.story_point_hours, membersList);
  const usedPoints = sprintStories.reduce((sum: number, s: Story) => sum + (s.story_points || 0), 0);
  const capacityPercent = totalCapacity > 0 ? Math.round((usedPoints / totalCapacity) * 100) : 0;

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{sprint.name} - Planning</h2>
          <p className="text-sm text-gray-500">{sprint.start_date} | {sprint.duration_days} days</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPlan} disabled={exportingPlan}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
            {exportingPlan ? 'Exporting...' : 'Export Plan PDF'}
          </button>
          {sprint.status === 'Planning' && (
            <button onClick={() => handleSprintStatusChange('Active')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Start Sprint</button>
          )}
          {sprint.status === 'Active' && (
            <button onClick={() => handleSprintStatusChange('Completed')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Complete Sprint</button>
          )}
        </div>
      </div>

      {/* Capacity section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Team Capacity</h3>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Used: {usedPoints.toFixed(1)} SP / {totalCapacity.toFixed(1)} SP capacity</span>
            <span className={capacityPercent > 100 ? 'text-red-600 font-bold' : ''}>{capacityPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${capacityPercent > 100 ? 'bg-red-500' : capacityPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          {developers.map((dev: any) => {
            const isActive = allocations[dev.id] !== undefined;
            const pct = allocations[dev.id] ?? 100;
            const cap = isActive ? calculateIndividualCapacity(sprint.duration_days, project.daily_hours, pct, project.story_point_hours) : 0;
            return (
              <div key={dev.id} className="flex items-center gap-3">
                <input type="checkbox" checked={isActive} onChange={() => handleToggleMember(dev.id)} />
                <span className="w-32 text-sm">{dev.name}</span>
                <input type="range" min={10} max={100} step={10} value={pct} disabled={!isActive}
                  onChange={e => handleAllocationChange(dev.id, Number(e.target.value))}
                  className="flex-1" />
                <span className="w-12 text-sm text-right">{pct}%</span>
                <span className="w-20 text-sm text-gray-500 text-right">{cap.toFixed(1)} SP</span>
              </div>
            );
          })}
        </div>
        <button onClick={handleSaveMembers}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save Members</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Backlog column */}
        <div>
          <h3 className="font-semibold mb-3">Backlog ({backlogStories.length})</h3>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {backlogStories.map((story: Story) => (
              <div key={story.id} className="flex items-center gap-2">
                <button onClick={() => handleAssignStory(story.id)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">→</button>
                <div className="flex-1 bg-white rounded p-2 text-sm border border-gray-200">
                  <span className="font-medium">{story.title}</span>
                  {story.story_points != null && <span className="ml-2 text-xs text-blue-600">{story.story_points} SP</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sprint stories column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Sprint Stories ({sprintStories.length} | {usedPoints} SP)</h3>
            <button onClick={() => setShowStoryForm(!showStoryForm)}
              className="text-sm text-blue-600 hover:text-blue-800">+ New</button>
          </div>
          {showStoryForm && (
            <div className="mb-3">
              <StoryForm epics={epics} developers={developers} onSave={handleCreateStory}
                onCancel={() => setShowStoryForm(false)} />
            </div>
          )}
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {sprintStories.map((story: Story) => (
              <StoryCard key={story.id} story={story} onStatusChange={handleStatusChange}
                onEdit={() => {}} onDelete={async (id) => { await api.story.delete(projectId, id); refreshSprint(); }}
                onRemoveFromSprint={handleUnassignStory} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
