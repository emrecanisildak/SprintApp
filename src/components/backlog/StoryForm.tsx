import { useState, useEffect } from 'react';
import { Story, Epic, Developer } from '../../types';

interface Props {
  story?: Story | null;
  epics: Epic[];
  developers: Developer[];
  onSave: (data: Partial<Story>) => void;
  onCancel: () => void;
}

export default function StoryForm({ story, epics, developers, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(story?.title || '');
  const [description, setDescription] = useState(story?.description || '');
  const [storyPoints, setStoryPoints] = useState<string>(story?.story_points?.toString() || '');
  const [epicId, setEpicId] = useState<string>(story?.epic_id?.toString() || '');
  const [assigneeId, setAssigneeId] = useState<string>(story?.assignee_id?.toString() || '');

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || '');
      setStoryPoints(story.story_points?.toString() || '');
      setEpicId(story.epic_id?.toString() || '');
      setAssigneeId(story.assignee_id?.toString() || '');
    }
  }, [story]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      story_points: storyPoints ? Number(storyPoints) : undefined,
      epic_id: epicId ? Number(epicId) : null,
      assignee_id: assigneeId ? Number(assigneeId) : null,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Story title"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Story Points</label>
          <input type="number" value={storyPoints} onChange={e => setStoryPoints(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Epic</label>
          <select value={epicId} onChange={e => setEpicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">None</option>
            {epics.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Assignee</label>
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          {story ? 'Update' : 'Create'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-gray-500 hover:text-gray-700 transition">Cancel</button>
      </div>
    </div>
  );
}
