import { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../hooks/useDB';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
}

export default function ProjectSettings({ project, onUpdate }: Props) {
  const [name, setName] = useState(project.name);
  const [spHours, setSpHours] = useState(project.story_point_hours);
  const [dailyHours, setDailyHours] = useState(project.daily_hours);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const updated = await api.project.update(project.id, {
      name, story_point_hours: spHours, daily_hours: dailyHours,
    });
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Project Settings</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1 Story Point = Hours</label>
          <input type="number" value={spHours} onChange={e => setSpHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Working Hours</label>
          <input type="number" value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={handleSave}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
