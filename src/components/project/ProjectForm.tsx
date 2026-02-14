import { useState, useEffect } from 'react';
import { Project } from '../../types';
import { api } from '../../hooks/useDB';

interface Props {
  onProjectSelect: (project: Project) => void;
  onCreated: () => void;
  refreshKey: number;
}

export default function ProjectForm({ onProjectSelect, onCreated, refreshKey }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [spHours, setSpHours] = useState(4);
  const [dailyHours, setDailyHours] = useState(8);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.project.list();
      setProjects(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [refreshKey]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const dbPath = name.trim().toLowerCase().replace(/\s+/g, '_') + '.db';
    const project = await api.project.create({ name: name.trim(), db_path: dbPath, story_point_hours: spHours, daily_hours: dailyHours });
    onCreated();
    onProjectSelect(project);
  };

  const handleOpenProject = async (project: Project) => {
    setError(null);
    try {
      // Verify project DB can be opened by making a test call
      await api.developer.list(project.id);
      onProjectSelect(project);
    } catch (err: any) {
      setError(`Failed to open "${project.name}": ${err.message}`);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.project.delete(project.id);
      loadProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">SprintApp</h1>
      <p className="text-gray-500 text-center mb-8">Select a project or create a new one</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Your Projects ({projects.length})</h3>
          <div className="space-y-2">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => handleOpenProject(p)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-gray-400 ml-2">1 SP = {p.story_point_hours}h</span>
                  <span className="text-xs text-gray-300 ml-2">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(e, p)}
                  className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition px-2 py-1"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-center mb-8">No projects yet. Create your first one below.</p>
      )}

      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
        >
          + New Project
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">1 SP = hours</label>
              <input
                type="number"
                value={spHours}
                onChange={e => setSpHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Daily hours</label>
              <input
                type="number"
                value={dailyHours}
                onChange={e => setDailyHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
