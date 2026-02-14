import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Project } from './types';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BacklogView from './components/backlog/BacklogView';
import SprintList from './components/sprint/SprintList';
import SprintPlanning from './components/sprint/SprintPlanning';
import SprintBoard from './components/sprint/SprintBoard';
import SprintReport from './components/report/SprintReport';
import ProjectReport from './components/report/ProjectReport';
import ProjectSettings from './components/project/ProjectSettings';
import DeveloperList from './components/project/DeveloperList';
import ProjectForm from './components/project/ProjectForm';
import EpicsView from './components/epics/EpicsView';

export default function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    navigate('/backlog');
  };

  const handleProjectCreated = () => {
    setSidebarRefreshKey(k => k + 1);
  };

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-2xl w-full">
          <ProjectForm
            onProjectSelect={handleProjectSelect}
            onCreated={handleProjectCreated}
            refreshKey={sidebarRefreshKey}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        currentProject={currentProject}
        onProjectChange={() => setCurrentProject(null)}
        refreshKey={sidebarRefreshKey}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header project={currentProject} />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Routes>
            <Route path="/backlog" element={<BacklogView projectId={currentProject.id} project={currentProject} />} />
            <Route path="/sprints" element={<SprintList projectId={currentProject.id} />} />
            <Route path="/sprint/:sprintId/planning" element={<SprintPlanning projectId={currentProject.id} project={currentProject} />} />
            <Route path="/sprint/:sprintId/board" element={<SprintBoard projectId={currentProject.id} />} />
            <Route path="/sprint/:sprintId/report" element={<SprintReport projectId={currentProject.id} project={currentProject} />} />
            <Route path="/project-report" element={<ProjectReport projectId={currentProject.id} />} />
            <Route path="/epics" element={<EpicsView projectId={currentProject.id} project={currentProject} />} />
            <Route path="/developers" element={<DeveloperList projectId={currentProject.id} />} />
            <Route path="/settings" element={<ProjectSettings project={currentProject} onUpdate={p => setCurrentProject(p)} />} />
            <Route path="*" element={<BacklogView projectId={currentProject.id} project={currentProject} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
