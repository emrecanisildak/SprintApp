import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { ProjectStats } from '../../types';
import { api } from '../../hooks/useDB';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Props {
  projectId: number;
}

export default function ProjectReport({ projectId }: Props) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.sprintStory.getProjectStats(projectId).then(setStats).catch(console.error);
  }, [projectId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportPdf.printProjectReport(projectId);
    } finally {
      setExporting(false);
    }
  };

  if (!stats) return <div className="text-gray-400 p-8">Loading report...</div>;

  // Completion doughnut (completed vs remaining vs backlog)
  const remainingPoints = stats.total_points - stats.completed_points;
  const completionData = {
    labels: ['Completed', 'Remaining', 'Backlog'],
    datasets: [{
      data: [stats.completed_points, remainingPoints, stats.backlog_points],
      backgroundColor: ['#22c55e', '#f59e0b', '#9ca3af'],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // Sprint bar chart
  const sprintBarData = {
    labels: stats.sprint_stats.map(s => s.sprint_name),
    datasets: [
      {
        label: 'Completed SP',
        data: stats.sprint_stats.map(s => s.completed_points),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Remaining SP',
        data: stats.sprint_stats.map(s => s.total_points - s.completed_points),
        backgroundColor: '#e5e7eb',
      },
    ],
  };

  // Developer bar chart
  const devBarData = {
    labels: stats.developer_stats.map(d => d.name),
    datasets: [
      {
        label: 'Completed SP',
        data: stats.developer_stats.map(d => d.completed_points),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Total SP',
        data: stats.developer_stats.map(d => d.total_points - d.completed_points),
        backgroundColor: '#bfdbfe',
      },
    ],
  };

  // Epic doughnut
  const epicData = {
    labels: stats.epic_stats.map(e => e.name),
    datasets: [{
      data: stats.epic_stats.map(e => e.total_points),
      backgroundColor: stats.epic_stats.map(e => e.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  return (
    <div>
      <div className="mb-4 no-print">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Project Report</h2>
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2 no-print">
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Sprints</p>
          <p className="text-3xl font-bold">{stats.total_sprints}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Stories</p>
          <p className="text-3xl font-bold">{stats.total_stories}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total SP</p>
          <p className="text-3xl font-bold">{stats.total_points}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Completion</p>
          <p className="text-3xl font-bold text-green-600">{stats.completion_percent}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Backlog</p>
          <p className="text-3xl font-bold text-gray-500">{stats.backlog_stories} stories / {stats.backlog_points} SP</p>
        </div>
      </div>

      {/* Sprint summary table */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Sprint Summary</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-2">Sprint</th>
              <th className="px-3 py-2 text-right">Stories</th>
              <th className="px-3 py-2 text-right">Completed</th>
              <th className="px-3 py-2 text-right">Total SP</th>
              <th className="px-3 py-2 text-right">Completed SP</th>
              <th className="px-3 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {stats.sprint_stats.map(s => (
              <tr key={s.sprint_id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{s.sprint_name}</td>
                <td className="px-3 py-2 text-right">{s.total_stories}</td>
                <td className="px-3 py-2 text-right">{s.completed_stories}</td>
                <td className="px-3 py-2 text-right">{s.total_points}</td>
                <td className="px-3 py-2 text-right text-green-600">{s.completed_points}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs ${s.completion_percent === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {s.completion_percent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Overall Completion</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={completionData} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Sprint Progress</h3>
          <Bar data={sprintBarData} options={barOptions} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Developer Performance</h3>
          {stats.developer_stats.length > 0 ? (
            <Bar data={devBarData} options={barOptions} />
          ) : (
            <p className="text-gray-400 text-center py-4">No assigned stories</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Epic Distribution</h3>
          {stats.epic_stats.length > 0 ? (
            <div className="max-w-xs mx-auto">
              <Doughnut data={epicData} />
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No stories</p>
          )}
        </div>
      </div>
    </div>
  );
}
