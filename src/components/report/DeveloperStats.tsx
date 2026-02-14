import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { DeveloperStat } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  stats: DeveloperStat[];
}

export default function DeveloperStats({ stats }: Props) {
  const data = {
    labels: stats.map(s => s.name),
    datasets: [
      {
        label: 'Total SP',
        data: stats.map(s => s.total_points),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
      {
        label: 'Completed SP',
        data: stats.map(s => s.completed_points),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: '#22C55E',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div>
      <Bar data={data} options={options} />
      <div className="mt-4 space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
            <span className="font-medium">{s.name}</span>
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
