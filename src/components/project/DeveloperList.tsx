import { useState } from 'react';
import { useDevelopers, api } from '../../hooks/useDB';

interface Props {
  projectId: number;
}

export default function DeveloperList({ projectId }: Props) {
  const { developers, refresh } = useDevelopers(projectId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await api.developer.create(projectId, { name: name.trim(), email: email.trim() || undefined });
    setName('');
    setEmail('');
    refresh();
  };

  const handleUpdate = async (id: number) => {
    await api.developer.update(projectId, id, { name: editName, email: editEmail });
    setEditingId(null);
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this developer?')) return;
    await api.developer.delete(projectId, id);
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Developers</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Add</button>
      </div>

      <div className="space-y-2">
        {developers.map((dev: any) => (
          <div key={dev.id} className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
            {editingId === dev.id ? (
              <div className="flex gap-2 flex-1">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded" />
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded" />
                <button onClick={() => handleUpdate(dev.id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Save</button>
                <button onClick={() => setEditingId(null)} className="px-3 py-1 text-gray-500 text-sm">Cancel</button>
              </div>
            ) : (
              <>
                <div>
                  <span className="font-medium">{dev.name}</span>
                  {dev.email && <span className="text-sm text-gray-400 ml-2">{dev.email}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(dev.id); setEditName(dev.name); setEditEmail(dev.email || ''); }}
                    className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(dev.id)}
                    className="text-sm text-red-600 hover:text-red-800">Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
        {developers.length === 0 && <p className="text-gray-400 text-center py-8">No developers yet. Add one above.</p>}
      </div>
    </div>
  );
}
