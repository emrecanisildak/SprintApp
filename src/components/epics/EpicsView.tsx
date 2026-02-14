import { useState } from 'react';
import { Epic, Project } from '../../types';
import { useEpics, api } from '../../hooks/useDB';

interface Props {
    projectId: number;
    project: Project;
}

export default function EpicsView({ projectId }: Props) {
    const { epics, refresh } = useEpics(projectId);
    const [showForm, setShowForm] = useState(false);
    const [editingEpic, setEditingEpic] = useState<Epic | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3B82F6');

    const handleEdit = (epic: Epic) => {
        setEditingEpic(epic);
        setName(epic.name);
        setDescription(epic.description || '');
        setColor(epic.color);
        setShowForm(true);
    };

    const handleCreateNew = () => {
        setEditingEpic(null);
        setName('');
        setDescription('');
        setColor('#3B82F6');
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        const data = {
            name: name.trim(),
            description: description.trim() || undefined,
            color
        };

        try {
            if (editingEpic) {
                await api.epic.update(projectId, editingEpic.id, data);
            } else {
                await api.epic.create(projectId, data);
            }

            setShowForm(false);
            refresh();
        } catch (err: any) {
            alert(err.message || 'Failed to save epic');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this epic? Associated stories will be unassigned from this epic.')) return;
        await api.epic.delete(projectId, id);
        refresh();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Epics</h2>
                    <p className="text-sm text-gray-500">Manage large bodies of work</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <span>+</span> New Epic
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in border border-gray-100">
                    <h3 className="font-semibold text-lg mb-4">{editingEpic ? 'Edit Epic' : 'New Epic'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Epic name (e.g. User Authentication)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What is this epic about?"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="h-10 w-16 rounded cursor-pointer border border-gray-300"
                                />
                                <span className="text-sm text-gray-500 uppercase">{color}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {editingEpic ? 'Update Epic' : 'Create Epic'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {epics.map(epic => (
                    <div key={epic.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: epic.color }}
                                />
                                <h3 className="font-semibold text-lg">{epic.name}</h3>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(epic)}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition"
                                    title="Edit"
                                >
                                    <span className="text-lg">✎</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(epic.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                                    title="Delete"
                                >
                                    <span className="text-lg">×</span>
                                </button>
                            </div>
                        </div>

                        {epic.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{epic.description}</p>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-400">ID: {epic.id}</span>
                        </div>
                    </div>
                ))}

                {epics.length === 0 && !showForm && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 mb-2">No epics found.</p>
                        <button
                            onClick={handleCreateNew}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create your first epic
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
