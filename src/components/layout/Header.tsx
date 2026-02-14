import { Project } from '../../types';

interface Props {
  project: Project;
}

export default function Header({ project }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
        <p className="text-sm text-gray-500">
          1 SP = {project.story_point_hours}h | Daily: {project.daily_hours}h
        </p>
      </div>
    </header>
  );
}
