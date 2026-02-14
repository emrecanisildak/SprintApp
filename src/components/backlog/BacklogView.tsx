import { useState, useEffect } from 'react';
import { Story, StoryStatus, Project } from '../../types';
import { useStories, useEpics, useDevelopers, useSprints, api } from '../../hooks/useDB';
import StoryCard from './StoryCard';
import StoryForm from './StoryForm';

interface Props {
  projectId: number;
  project: Project;
}

function ImportBacklogCsvModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h3 className="text-lg font-bold mb-3">Import CSV to Backlog</h3>
        <p className="text-sm text-gray-600 mb-3">CSV dosyanız aşağıdaki formatta olmalıdır:</p>
        <div className="bg-gray-100 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Header:</p>
          <p className="font-mono text-xs text-gray-800">Epic,Story,Description,Developer,Story Points,Status</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Örnek:</p>
          <p className="font-mono text-xs text-gray-800">Auth,Login page,User login,John,3,Open</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800">Olmayan epic, developer ve statusler otomatik oluşturulur. Aynı isimde story varsa güncellenir.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">OK, Import</button>
        </div>
      </div>
    </div>
  );
}

export default function BacklogView({ projectId }: Props) {
  const { stories, refresh } = useStories(projectId, { backlog: true });
  const { epics, refresh: refreshEpics } = useEpics(projectId);
  const { developers } = useDevelopers(projectId);
  const { sprints } = useSprints(projectId);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [filterEpic, setFilterEpic] = useState<string>('');
  const [sprintSelectStory, setSprintSelectStory] = useState<number | null>(null);

  // Epic management
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [epicName, setEpicName] = useState('');
  const [epicColor, setEpicColor] = useState('#3B82F6');

  useEffect(() => {
    api.status.list(projectId).then(setStatuses);
  }, [projectId]);

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
    try {
      await api.epic.create(projectId, { name: epicName.trim(), color: epicColor });
      setEpicName('');
      setShowEpicForm(false);
      refreshEpics();
    } catch (err: any) {
      alert(err.message || 'Failed to create epic');
    }
  };

  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportCsv = async () => {
    setShowImportModal(false);
    const result = await api.exportPdf.importBacklogCsv(projectId);
    if (result.success && result.imported) {
      alert(`${result.imported} story imported.`);
      refresh();
      refreshEpics();
    }
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

          <button onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition">
            Import CSV
          </button>
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
            projectId={projectId}
            story={editingStory}
            epics={epics}
            developers={developers}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingStory(null); }}
          />
        </div>
      )}

      <div className="space-y-6">
        {(() => {
          // Group stories by epic
          const storiesByEpic: Record<string, Story[]> = {};
          const noEpicStories: Story[] = [];

          filteredStories.forEach(story => {
            if (story.epic_id) {
              const key = story.epic_id.toString();
              if (!storiesByEpic[key]) storiesByEpic[key] = [];
              storiesByEpic[key].push(story);
            } else {
              noEpicStories.push(story);
            }
          });

          return (
            <>
              {Object.entries(storiesByEpic).map(([epicId, epicStories]) => {
                const epic = epics.find(e => e.id.toString() === epicId);
                const epicName = epic?.name || 'Unknown Epic';
                const epicColor = epic?.color || '#e5e7eb';
                const epicPoints = epicStories.reduce((sum, s) => sum + (s.story_points || 0), 0);

                return (
                  <div key={epicId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: epicColor }} />
                      <h3 className="font-bold text-lg text-gray-800">{epicName}</h3>
                      <span className="text-sm text-gray-500 ml-auto">{epicStories.length} stories | {epicPoints} SP</span>
                    </div>
                    <div className="grid gap-3">
                      {epicStories.map(story => (
                        <div key={story.id} className="relative">
                          <StoryCard
                            story={story}
                            statuses={statuses}
                            onStatusChange={handleStatusChange}
                            onEdit={s => { setEditingStory(s); setShowForm(false); }}
                            onDelete={handleDelete}
                            onMoveToSprint={() => setSprintSelectStory(story.id)}
                          />
                          {sprintSelectStory === story.id && (
                            <div className="absolute right-0 top-0 bg-white shadow-lg rounded-lg p-3 z-10 border">
                              <p className="text-xs text-gray-500 mb-2">Move to sprint:</p>
                              {sprints?.filter((s: any) => s.status !== 'Completed').map((s: any) => (
                                <button key={s.id} onClick={() => handleMoveToSprint(story.id, s.id)}
                                  className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-50 rounded">{s.name}</button>
                              ))}
                              {(!sprints || sprints.filter((s: any) => s.status !== 'Completed').length === 0) && (
                                <p className="text-xs text-gray-400">No active sprints</p>
                              )}
                              <button onClick={() => setSprintSelectStory(null)}
                                className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {noEpicStories.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <h3 className="font-bold text-lg text-gray-800">No Epic</h3>
                    <span className="text-sm text-gray-500 ml-auto">{noEpicStories.length} stories | {noEpicStories.reduce((sum, s) => sum + (s.story_points || 0), 0)} SP</span>
                  </div>
                  <div className="grid gap-3">
                    {noEpicStories.map(story => (
                      <div key={story.id} className="relative">
                        <StoryCard
                          story={story}
                          statuses={statuses}
                          onStatusChange={handleStatusChange}
                          onEdit={s => { setEditingStory(s); setShowForm(false); }}
                          onDelete={handleDelete}
                          onMoveToSprint={() => setSprintSelectStory(story.id)}
                        />
                        {sprintSelectStory === story.id && (
                          <div className="absolute right-0 top-0 bg-white shadow-lg rounded-lg p-3 z-10 border">
                            <p className="text-xs text-gray-500 mb-2">Move to sprint:</p>
                            {sprints?.filter((s: any) => s.status !== 'Completed').map((s: any) => (
                              <button key={s.id} onClick={() => handleMoveToSprint(story.id, s.id)}
                                className="block w-full text-left px-3 py-1 text-sm hover:bg-blue-50 rounded">{s.name}</button>
                            ))}
                            {(!sprints || sprints.filter((s: any) => s.status !== 'Completed').length === 0) && (
                              <p className="text-xs text-gray-400">No active sprints</p>
                            )}
                            <button onClick={() => setSprintSelectStory(null)}
                              className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
        {filteredStories.length === 0 && (
          <p className="text-gray-400 text-center py-12">No stories in backlog. Create one to get started.</p>
        )}
      </div>

      {showImportModal && (
        <ImportBacklogCsvModal
          onConfirm={handleImportCsv}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
