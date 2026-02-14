import { useNavigate, useLocation } from 'react-router-dom';
import { Project } from '../../types';

interface Props {
  currentProject: Project;
  onProjectChange: () => void;
  refreshKey: number;
}

const navItems = [
  { path: '/backlog', label: 'Backlog', icon: '📋' },
  { path: '/sprints', label: 'Sprints', icon: '🏃' },
  { path: '/developers', label: 'Developers', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ currentProject, onProjectChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">SprintApp</h1>
        <button
          onClick={onProjectChange}
          className="mt-2 text-sm text-gray-400 hover:text-white transition"
        >
          ← Change Project
        </button>
      </div>
      <div className="p-4 border-b border-gray-700">
        <p className="text-sm text-gray-400">Current Project</p>
        <p className="font-semibold">{currentProject.name}</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 transition ${
              location.pathname === item.path || location.pathname.startsWith(item.path.replace(/s$/, '/'))
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
