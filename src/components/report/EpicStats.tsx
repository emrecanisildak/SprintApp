import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { EpicStat } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Props {
  stats: EpicStat[];
}

export default function EpicStats({ stats }: Props) {
  const barData = {
    labels: stats.map(s => s.name),
    datasets: [
      {
        label: 'Total SP',
        data: stats.map(s => s.total_points),
        backgroundColor: stats.map(s => s.color + '80'),
        borderColor: stats.map(s => s.color),
        borderWidth: 1,
      },
      {
        label: 'Completed SP',
        data: stats.map(s => s.completed_points),
        backgroundColor: stats.map(s => s.color + '40'),
        borderColor: stats.map(s => s.color),
        borderWidth: 1,
        borderDash: [4, 4],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutData = {
    labels: stats.map(s => s.name),
    datasets: [{
      data: stats.map(s => s.total_points),
      backgroundColor: stats.map(s => s.color),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">SP by Epic</h4>
          <Bar data={barData} options={barOptions} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">SP Distribution</h4>
          <div className="max-w-xs mx-auto">
            <Doughnut data={doughnutData} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              <span className="font-medium">{s.name}</span>
            </div>
            <div className="flex gap-4">
              <span>{s.story_count} stories</span>
              <span>{s.completed_points}/{s.total_points} SP</span>
              <span className="font-medium">
                {s.total_points > 0 ? Math.round((s.completed_points / s.total_points) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
