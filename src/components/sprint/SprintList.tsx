import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSprints, api } from '../../hooks/useDB';

function ImportStatusCsvModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h3 className="text-lg font-bold mb-3">Import Status Update CSV</h3>
        <p className="text-sm text-gray-600 mb-3">Jira'dan export edilen CSV ile story statuslerini güncelleyin. CSV aşağıdaki formatta olmalıdır:</p>
        <div className="bg-gray-100 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Header:</p>
          <p className="font-mono text-xs text-gray-800">Story,Status</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Örnek:</p>
          <p className="font-mono text-xs text-gray-800">Login page,In Progress</p>
          <p className="font-mono text-xs text-gray-800">User settings,Done</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800">Projede bulunmayan statusler otomatik olarak eklenecektir (completed olarak işaretlenmez).</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">OK, Import</button>
        </div>
      </div>
    </div>
  );
}

function ImportCsvModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h3 className="text-lg font-bold mb-3">Import CSV</h3>
        <p className="text-sm text-gray-600 mb-3">CSV dosyanız aşağıdaki formatta olmalıdır:</p>
        <div className="bg-gray-100 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Header:</p>
          <p className="font-mono text-xs text-gray-800">Epic,Story,Description,Developer,Story Points,Status</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Örnek Satır:</p>
          <p className="font-mono text-xs text-gray-800">Auth,Login page,User login,John,3,Open</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">OK, Import</button>
        </div>
      </div>
    </div>
  );
}

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

  const [importSprintId, setImportSprintId] = useState<number | null>(null);
  const [importStatusSprintId, setImportStatusSprintId] = useState<number | null>(null);

  const handleImport = async (sprintId: number) => {
    setImportSprintId(null);
    const result = await api.exportPdf.importCsv(projectId, sprintId);
    if (result.success && result.imported) {
      alert(`${result.imported} story imported.`);
      refresh();
    }
  };

  const handleImportStatus = async (sprintId: number) => {
    setImportStatusSprintId(null);
    const result = await api.exportPdf.importStatusCsv(projectId, sprintId);
    if (result.success && result.updated) {
      alert(`${result.updated} story status updated.`);
      refresh();
    }
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
        <div className="flex gap-2">
          <button onClick={() => navigate('/project-report')}
            className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition">
            Project Report
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + New Sprint
          </button>
        </div>
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
              <button onClick={() => setImportSprintId(sprint.id)}
                className="px-3 py-1 text-sm border border-orange-300 text-orange-700 rounded hover:bg-orange-50">Import CSV</button>
              <button onClick={() => setImportStatusSprintId(sprint.id)}
                className="px-3 py-1 text-sm border border-purple-300 text-purple-700 rounded hover:bg-purple-50">Import Status</button>
              <button onClick={() => handleDelete(sprint.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
        {sprints.length === 0 && <p className="text-gray-400 text-center py-12">No sprints yet. Create one to start planning.</p>}
      </div>

      {importSprintId !== null && (
        <ImportCsvModal
          onConfirm={() => handleImport(importSprintId)}
          onCancel={() => setImportSprintId(null)}
        />
      )}
      {importStatusSprintId !== null && (
        <ImportStatusCsvModal
          onConfirm={() => handleImportStatus(importStatusSprintId)}
          onCancel={() => setImportStatusSprintId(null)}
        />
      )}
    </div>
  );
}
