import { useState, useEffect } from 'react';
import { Project, Status } from '../../types';
import { api } from '../../hooks/useDB';

interface Props {
    project: Project;
}

export default function StatusSettings({ project }: Props) {
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [items, setItems] = useState<Status[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatuses = async () => {
        try {
            const data = await api.status.list(project.id);
            setStatuses(data);
        } catch (error) {
            console.error('Failed to fetch statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, [project.id]);

    const handleAdd = async () => {
        try {
            // Find a color that's not used or just random/default
            const newStatus = await api.status.create(project.id, {
                name: 'New Status',
                color: '#6B7280',
                is_default: 0,
                is_completed: 0,
                position: statuses.length,
            });
            setStatuses([...statuses, newStatus]);
        } catch (error) {
            console.error('Failed to create status:', error);
        }
    };

    const handleUpdate = async (id: number, updates: Partial<Status>) => {
        try {
            const updated = await api.status.update(project.id, id, updates);
            setStatuses(statuses.map(s => (s.id === id ? updated : s)));
            // If default changed, refresh all to ensure only one default
            if (updates.is_default) {
                fetchStatuses();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? Stories with this status will be moved to default status.')) return;
        try {
            await api.status.delete(project.id, id);
            setStatuses(statuses.filter(s => s.id !== id));
        } catch (error: any) {
            alert(error.message || 'Failed to delete status');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Project Statuses</h3>
                <button
                    onClick={handleAdd}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                    Add Status
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {statuses.map((status) => (
                            <tr key={status.id}>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={status.name}
                                        onChange={(e) => handleUpdate(status.id, { name: e.target.value })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="color"
                                        value={status.color}
                                        onChange={(e) => handleUpdate(status.id, { color: e.target.value })}
                                        className="h-8 w-14 cursor-pointer border border-gray-300 rounded bg-transparent p-0.5"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!status.is_completed}
                                        onChange={(e) => handleUpdate(status.id, { is_completed: e.target.checked ? 1 : 0 })}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="radio"
                                        name="default_status"
                                        checked={!!status.is_default}
                                        onChange={() => handleUpdate(status.id, { is_default: 1 })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {!status.is_default && (
                                        <button
                                            onClick={() => handleDelete(status.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
                * "Completed" statuses are used to determine sprint velocity and closure.
                <br />
                * "Default" status is assigned to new stories.
            </p>
        </div>
    );
}
