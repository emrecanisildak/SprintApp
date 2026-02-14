import { Story, STORY_STATUSES, StoryStatus } from '../../types';

interface Props {
  story: Story;
  onStatusChange: (id: number, status: StoryStatus) => void;
  onEdit: (story: Story) => void;
  onDelete: (id: number) => void;
  onMoveToSprint?: (storyId: number) => void;
  onRemoveFromSprint?: (storyId: number) => void;
}

const statusColors: Record<string, string> = {
  'Open': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  'Resolved': 'bg-green-100 text-green-700',
  'Closed': 'bg-purple-100 text-purple-700',
  'Deployed': 'bg-teal-100 text-teal-700',
};

export default function StoryCard({ story, onStatusChange, onEdit, onDelete, onMoveToSprint, onRemoveFromSprint }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: story.epic_color || '#e5e7eb' }}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-800">{story.title}</h4>
        <div className="flex items-center gap-1">
          {story.story_points != null && (
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">{story.story_points} SP</span>
          )}
        </div>
      </div>
      {story.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{story.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {story.epic_name && (
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: story.epic_color + '20', color: story.epic_color }}>
            {story.epic_name}
          </span>
        )}
        {story.assignee_name && <span className="text-xs text-gray-500">👤 {story.assignee_name}</span>}
        <select
          value={story.status}
          onChange={e => onStatusChange(story.id, e.target.value as StoryStatus)}
          className={`text-xs px-2 py-0.5 rounded border-0 cursor-pointer ${statusColors[story.status] || ''}`}
        >
          {STORY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
        <button onClick={() => onEdit(story)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button onClick={() => onDelete(story.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
        {onMoveToSprint && !story.sprint_id && (
          <button onClick={() => onMoveToSprint(story.id)} className="text-xs text-green-600 hover:text-green-800">→ Sprint</button>
        )}
        {onRemoveFromSprint && story.sprint_id && (
          <button onClick={() => onRemoveFromSprint(story.id)} className="text-xs text-orange-600 hover:text-orange-800">← Backlog</button>
        )}
      </div>
    </div>
  );
}
