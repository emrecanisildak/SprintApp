import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story, Status } from '../../types';
import { useStories, api } from '../../hooks/useDB';

interface Props {
  projectId: number;
}

export default function SprintBoard({ projectId }: Props) {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const sid = Number(sprintId);
  const { stories, refresh } = useStories(projectId, { sprint_id: sid });
  const [sprint, setSprint] = useState<any>(null);
  const [draggedStory, setDraggedStory] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);

  useEffect(() => {
    api.sprint.get(projectId, sid).then(setSprint);
    api.status.list(projectId).then(setStatuses);
  }, [projectId, sid]);

  const handleDrop = async (status: string) => {
    if (draggedStory === null) return;
    await api.story.update(projectId, draggedStory, { status });
    setDraggedStory(null);
    refresh();
  };

  if (!sprint) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-4 no-print">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-6">{sprint.name} - Board</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {statuses.map(status => {
          const columnStories = stories.filter((s: Story) => s.status === status.name);
          return (
            <div key={status.id}
              className="min-w-[240px] w-[240px] bg-gray-100 rounded-lg border-t-4"
              style={{ borderColor: status.color }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(status.name)}
            >
              <div className="p-3 font-semibold text-sm flex justify-between">
                <span>{status.name}</span>
                <span className="text-gray-400">{columnStories.length}</span>
              </div>
              <div className="p-2 space-y-2">
                {columnStories.map((story: Story) => (
                  <div key={story.id}
                    draggable
                    onDragStart={() => setDraggedStory(story.id)}
                    className="bg-white rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium leading-snug">{story.title}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {story.story_points != null && (
                        <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded font-mono">{story.story_points}</span>
                      )}
                      {story.assignee_name && (
                        <span className="text-xs text-gray-500" title={`Assigned to ${story.assignee_name}`}>
                          <span className="inline-block w-5 h-5 bg-gray-200 rounded-full text-center leading-5 text-[10px] font-bold text-gray-600">
                            {story.assignee_name.charAt(0).toUpperCase()}
                          </span>
                        </span>
                      )}
                    </div>
                    {story.epic_name && (
                      <div className="mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-full inline-block"
                          style={{ backgroundColor: (story.epic_color || '#3B82F6') + '20', color: story.epic_color || '#3B82F6' }}>
                          {story.epic_name}
                        </span>
                      </div>
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
