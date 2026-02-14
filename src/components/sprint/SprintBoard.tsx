import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story, STORY_STATUSES, StoryStatus } from '../../types';
import { useStories, api } from '../../hooks/useDB';

interface Props {
  projectId: number;
}

const columnColors: Record<string, string> = {
  'Open': 'border-t-gray-400',
  'In Progress': 'border-t-blue-500',
  'On Hold': 'border-t-yellow-500',
  'Resolved': 'border-t-green-500',
  'Closed': 'border-t-purple-500',
  'Deployed': 'border-t-teal-500',
};

export default function SprintBoard({ projectId }: Props) {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const sid = Number(sprintId);
  const { stories, refresh } = useStories(projectId, { sprint_id: sid });
  const [sprint, setSprint] = useState<any>(null);
  const [draggedStory, setDraggedStory] = useState<number | null>(null);

  useEffect(() => {
    api.sprint.get(projectId, sid).then(setSprint);
  }, [projectId, sid]);

  const handleDrop = async (status: StoryStatus) => {
    if (draggedStory === null) return;
    await api.story.update(projectId, draggedStory, { status });
    setDraggedStory(null);
    refresh();
  };

  if (!sprint) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-6">{sprint.name} - Board</h2>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STORY_STATUSES.map(status => {
          const columnStories = stories.filter((s: Story) => s.status === status);
          return (
            <div key={status}
              className={`min-w-[220px] w-[220px] bg-gray-100 rounded-lg border-t-4 ${columnColors[status]}`}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="p-3 font-semibold text-sm flex justify-between">
                <span>{status}</span>
                <span className="text-gray-400">{columnStories.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {columnStories.map((story: Story) => (
                  <div key={story.id}
                    draggable
                    onDragStart={() => setDraggedStory(story.id)}
                    className="bg-white rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing border border-gray-200 hover:shadow-md transition"
                  >
                    <p className="text-sm font-medium mb-1">{story.title}</p>
                    <div className="flex items-center gap-2">
                      {story.story_points != null && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{story.story_points} SP</span>
                      )}
                      {story.assignee_name && (
                        <span className="text-xs text-gray-500">👤 {story.assignee_name}</span>
                      )}
                    </div>
                    {story.epic_name && (
                      <span className="text-xs mt-1 inline-block px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: (story.epic_color || '#3B82F6') + '20', color: story.epic_color }}>
                        {story.epic_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
