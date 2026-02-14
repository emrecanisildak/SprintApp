import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Project, SprintStats, Status } from '../../types';
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

export default function SprintReport({ projectId, project }: Props) {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId: string }>();
  const sid = Number(sprintId);
  const [sprint, setSprint] = useState<any>(null);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const { members } = useSprintMembers(projectId, sid);

  useEffect(() => {
    api.sprint.get(projectId, sid).then(setSprint).catch(console.error);
    api.sprintStory.getSprintStats(projectId, sid).then(setStats).catch(console.error);
    api.status.list(projectId).then(setStatuses).catch(console.error);
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
  const statusColorMap = statuses.reduce((acc, s) => ({ ...acc, [s.name]: s.color }), {} as Record<string, string>);

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
      <div className="mb-4 no-print">
        <button onClick={() => navigate('/sprints')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
          ← Back to Sprints
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{sprint.name} - Report</h2>
        <button onClick={handleExportReport} disabled={exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2 no-print">
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
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Developer Statistics</h3>
        {stats.developer_stats.length > 0 ? (
          <DeveloperStats stats={stats.developer_stats} />
        ) : (
          <p className="text-gray-400 text-center py-4">No assigned stories</p>
        )}
      </div>

      {/* Uncompleted Stories Detailed List */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 print:break-before-page">
        <h3 className="font-semibold text-lg mb-4 text-orange-600">Uncompleted Stories</h3>
        {(() => {
          const uncompletedStories = stats.stories.filter((s: any) => !['Resolved', 'Closed', 'Deployed'].includes(s.status));
          if (uncompletedStories.length === 0) return <p className="text-gray-400 text-center">No uncompleted stories.</p>;

          const storiesByEpic: Record<string, any[]> = {};
          uncompletedStories.forEach((s: any) => {
            const key = s.epic_id ? String(s.epic_id) : '_none';
            if (!storiesByEpic[key]) storiesByEpic[key] = [];
            storiesByEpic[key].push(s);
          });

          return (
            <div className="space-y-6">
              {Object.entries(storiesByEpic).map(([epicKey, stories]) => {
                const firstStory = stories[0];
                const epicName = firstStory.epic_name || 'No Epic';
                const epicColor = firstStory.epic_color || '#9CA3AF';

                return (
                  <div key={epicKey} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: epicColor }} />
                      {epicName}
                    </h4>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="px-3 py-2 rounded-l-lg">Story</th>
                          <th className="px-3 py-2">Assignee</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right rounded-r-lg">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stories.map((story: any) => (
                          <tr key={story.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2 max-w-md truncate">{story.title}</td>
                            <td className="px-3 py-2 text-gray-600">{story.assignee_name || '-'}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: statusColorMap[story.status] || '#9CA3AF' }}>
                                {story.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-600">{story.story_points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Completed Stories Detailed List */}
      <div className="bg-white rounded-lg shadow p-6 print:break-before-page">
        <h3 className="font-semibold text-lg mb-4 text-green-600">Completed Stories</h3>
        {(() => {
          const completedStories = stats.stories.filter((s: any) => ['Resolved', 'Closed', 'Deployed'].includes(s.status));
          if (completedStories.length === 0) return <p className="text-gray-400 text-center">No completed stories in this sprint.</p>;

          const storiesByEpic: Record<string, any[]> = {};
          completedStories.forEach((s: any) => {
            const key = s.epic_id ? String(s.epic_id) : '_none';
            if (!storiesByEpic[key]) storiesByEpic[key] = [];
            storiesByEpic[key].push(s);
          });

          return (
            <div className="space-y-6">
              {Object.entries(storiesByEpic).map(([epicKey, stories]) => {
                const firstStory = stories[0];
                const epicName = firstStory.epic_name || 'No Epic';
                const epicColor = firstStory.epic_color || '#9CA3AF';

                return (
                  <div key={epicKey} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: epicColor }} />
                      {epicName}
                    </h4>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="px-3 py-2 rounded-l-lg">Story</th>
                          <th className="px-3 py-2">Assignee</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right rounded-r-lg">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stories.map((story: any) => (
                          <tr key={story.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2 max-w-md truncate">{story.title}</td>
                            <td className="px-3 py-2 text-gray-600">{story.assignee_name || '-'}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: statusColorMap[story.status] || '#9CA3AF' }}>
                                {story.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-600">{story.story_points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
