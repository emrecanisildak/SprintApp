import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Project, SprintStats } from '../../types';
import { useSprintMembers, api } from '../../hooks/useDB';
import { calculateTotalCapacity } from '../../utils/capacity';
import BurndownChart from './BurndownChart';
import DeveloperStats from './DeveloperStats';
import EpicStats from './EpicStats';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  projectId: number;
  project: Project;
}

const statusColorMap: Record<string, string> = {
  'Open': '#9CA3AF',
  'In Progress': '#3B82F6',
  'On Hold': '#F59E0B',
  'Resolved': '#22C55E',
  'Closed': '#8B5CF6',
  'Deployed': '#14B8A6',
};

export default function SprintReport({ projectId, project }: Props) {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const sid = Number(sprintId);
  const [sprint, setSprint] = useState<any>(null);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const { members } = useSprintMembers(projectId, sid);

  useEffect(() => {
    api.sprint.get(projectId, sid).then(setSprint).catch(console.error);
    api.sprintStory.getSprintStats(projectId, sid).then(setStats).catch(console.error);
  }, [projectId, sid]);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      await api.exportPdf.printPage(projectId, sid);
    } finally {
      setExporting(false);
    }
  };

  if (!sprint || !stats) return <div className="text-gray-400 p-8">Loading report...</div>;

  const totalCapacity = calculateTotalCapacity(sprint.duration_days, project.daily_hours, project.story_point_hours, members);

  const statusLabels = Object.keys(stats.status_points);
  const statusData = {
    labels: statusLabels,
    datasets: [{
      data: statusLabels.map(s => stats.status_points[s]),
      backgroundColor: statusLabels.map(s => statusColorMap[s] || '#9CA3AF'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{sprint.name} - Report</h2>
        <button onClick={handleExportReport} disabled={exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2">
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Stories</p>
          <p className="text-3xl font-bold">{stats.total_stories}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total SP</p>
          <p className="text-3xl font-bold">{stats.total_points}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Completed SP</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed_points}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="text-3xl font-bold text-blue-600">{totalCapacity.toFixed(1)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Completion</span>
          <span className="font-bold">{stats.completion_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="h-4 rounded-full bg-green-500 transition-all" style={{ width: `${stats.completion_percent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Burndown */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Burndown Chart</h3>
          <BurndownChart
            totalPoints={stats.total_points}
            completedPoints={stats.completed_points}
            durationDays={sprint.duration_days}
            startDate={sprint.start_date}
          />
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Status Distribution</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={statusData} />
          </div>
        </div>
      </div>

      {/* Epic stats */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Epic Breakdown</h3>
        {stats.epic_stats.length > 0 ? (
          <EpicStats stats={stats.epic_stats} />
        ) : (
          <p className="text-gray-400 text-center py-4">No stories in this sprint</p>
        )}
      </div>

      {/* Developer stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Developer Statistics</h3>
        {stats.developer_stats.length > 0 ? (
          <DeveloperStats stats={stats.developer_stats} />
        ) : (
          <p className="text-gray-400 text-center py-4">No assigned stories</p>
        )}
      </div>
    </div>
  );
}
