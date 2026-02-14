import { useState } from 'react';
import { Story, StoryStatus, Project } from '../../types';
import { useStories, useEpics, useDevelopers, useSprints, api } from '../../hooks/useDB';
import StoryCard from './StoryCard';
import StoryForm from './StoryForm';

interface Props {
  projectId: number;
  project: Project;
}

export default function BacklogView({ projectId }: Props) {
  const { stories, refresh } = useStories(projectId, { backlog: true });
  const { epics, refresh: refreshEpics } = useEpics(projectId);
  const { developers } = useDevelopers(projectId);
  const { sprints } = useSprints(projectId);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [filterEpic, setFilterEpic] = useState<string>('');
  const [sprintSelectStory, setSprintSelectStory] = useState<number | null>(null);

  // Epic management
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [epicName, setEpicName] = useState('');
  const [epicColor, setEpicColor] = useState('#3B82F6');

  const handleSave = async (data: Partial<Story>) => {
    if (editingStory) {
      await api.story.update(projectId, editingStory.id, data);
    } else {
      await api.story.create(projectId, data);
    }
    setShowForm(false);
    setEditingStory(null);
    refresh();
  };

  const handleStatusChange = async (id: number, status: StoryStatus) => {
    await api.story.update(projectId, id, { status });
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this story?')) return;
    await api.story.delete(projectId, id);
    refresh();
  };

  const handleMoveToSprint = async (storyId: number, sprintId: number) => {
    await api.sprintStory.assignStory(projectId, storyId, sprintId);
    setSprintSelectStory(null);
    refresh();
  };

  const handleCreateEpic = async () => {
    if (!epicName.trim()) return;
    await api.epic.create(projectId, { name: epicName.trim(), color: epicColor });
    setEpicName('');
    setShowEpicForm(false);
    refreshEpics();
  };

  const filteredStories = filterEpic ? stories.filter((s: Story) => s.epic_id?.toString() === filterEpic) : stories;
  const totalPoints = filteredStories.reduce((sum: number, s: Story) => sum + (s.story_points || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Backlog</h2>
          <p className="text-sm text-gray-500">{filteredStories.length} stories | {totalPoints} SP</p>
        </div>
        <div className="flex gap-2">
          <select value={filterEpic} onChange={e => setFilterEpic(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Epics</option>
            {epics.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button onClick={() => setShowEpicForm(!showEpicForm)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            + Epic
          </button>
          <button onClick={() => { setShowForm(true); setEditingStory(null); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + Story
          </button>
        </div>
      </div>

      {showEpicForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Epic Name</label>
            <input value={epicName} onChange={e => setEpicName(e.target.value)} placeholder="Epic name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <input type="color" value={epicColor} onChange={e => setEpicColor(e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
          </div>
          <button onClick={handleCreateEpic} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create</button>
          <button onClick={() => setShowEpicForm(false)} className="px-4 py-2 text-gray-500">Cancel</button>
        </div>
      )}

      {(showForm || editingStory) && (
        <div className="mb-4">
          <StoryForm
            story={editingStory}
            epics={epics}
            developers={developers}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingStory(null); }}
          />
        </div>
      )}

      <div className="grid gap-3">
        {filteredStories.map((story: Story) => (
          <div key={story.id} className="relative">
            <StoryCard
              story={story}
              onStatusChange={handleStatusChange}
              onEdit={s => { setEditingStory(s); setShowForm(false); }}
              onDelete={handleDelete}
              onMoveToSprint={() => setSprintSelectStory(story.id)}
            />
            {sprintSelectStory === story.id && (
              <div className="absolute right-0 top-0 bg-white shadow-lg rounded-lg p-3 z-10 border">
                <p className="text-xs text-gray-500 mb-2">Move to sprint:</p>
                {sprints.filter((s: any) => s.status !== 'Completed').map((s: any) => (
                  <button key={s.id} onClick={() => handleMoveToSprint(story.id, s.id)}
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-50 rounded">{s.name}</button>
                ))}
                {sprints.filter((s: any) => s.status !== 'Completed').length === 0 && (
                  <p className="text-xs text-gray-400">No active sprints</p>
                )}
                <button onClick={() => setSprintSelectStory(null)}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}
          </div>
        ))}
        {filteredStories.length === 0 && (
          <p className="text-gray-400 text-center py-12">No stories in backlog. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
