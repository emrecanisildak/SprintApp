import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSprints, api } from '../../hooks/useDB';

interface Props {
  projectId: number;
}

export default function SprintList({ projectId }: Props) {
  const { sprints, refresh } = useSprints(projectId);
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState(10);

  const handleCreate = async () => {
    if (!name.trim() || !startDate) return;
    const sprint = await api.sprint.create(projectId, {
      name: name.trim(), start_date: startDate, duration_days: durationDays,
    });
    setShowForm(false);
    setName('');
    setStartDate('');
    refresh();
    navigate(`/sprint/${sprint.id}/planning`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this sprint?')) return;
    await api.sprint.delete(projectId, id);
    refresh();
  };

  const statusColors: Record<string, string> = {
    'Planning': 'bg-yellow-100 text-yellow-700',
    'Active': 'bg-green-100 text-green-700',
    'Completed': 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Sprints</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          + New Sprint
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Sprint name (e.g. Sprint 1)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (business days)</label>
              <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sprints.map((sprint: any) => (
          <div key={sprint.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{sprint.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[sprint.status] || ''}`}>{sprint.status}</span>
              </div>
              <p className="text-sm text-gray-500">
                {sprint.start_date} | {sprint.duration_days} business days
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/sprint/${sprint.id}/planning`)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Planning</button>
              <button onClick={() => navigate(`/sprint/${sprint.id}/board`)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Board</button>
              <button onClick={() => navigate(`/sprint/${sprint.id}/report`)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Report</button>
              <button onClick={() => api.exportPdf.exportCsv(projectId, sprint.id)}
                className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded hover:bg-green-50">Export CSV</button>
              <button onClick={async () => {
                const result = await api.exportPdf.importCsv(projectId, sprint.id);
                if (result.success && result.imported) {
                  alert(`${result.imported} story imported.`);
                  refresh();
                }
              }}
                className="px-3 py-1 text-sm border border-orange-300 text-orange-700 rounded hover:bg-orange-50">Import CSV</button>
              <button onClick={() => handleDelete(sprint.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
        {sprints.length === 0 && <p className="text-gray-400 text-center py-12">No sprints yet. Create one to start planning.</p>}
      </div>
    </div>
  );
}
