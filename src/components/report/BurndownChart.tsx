import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  totalPoints: number;
  completedPoints: number;
  durationDays: number;
  startDate: string;
}

export default function BurndownChart({ totalPoints, completedPoints, durationDays, startDate }: Props) {
  const labels: string[] = [];
  const idealLine: number[] = [];
  const start = new Date(startDate);

  for (let i = 0; i <= durationDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    idealLine.push(totalPoints - (totalPoints / durationDays) * i);
  }

  // Simplified actual line: just show current remaining at current day
  const today = new Date();
  const daysPassed = Math.min(
    Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
    durationDays
  );
  const actualLine = labels.map((_, i) => {
    if (i <= daysPassed) {
      const progress = daysPassed > 0 ? (completedPoints / daysPassed) * i : 0;
      return Math.max(0, totalPoints - progress);
    }
    return null as any;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Ideal',
        data: idealLine,
        borderColor: '#9CA3AF',
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
      },
      {
        label: 'Actual',
        data: actualLine,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        pointRadius: 2,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Story Points' } },
    },
  };

  return <Line data={data} options={options} />;
}
