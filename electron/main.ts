import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { getAppDb, getProjectDb, closeAll } from './db/connection';
import { runAppMigrations, runProjectMigrations } from './db/migrations';
import { ProjectRepository } from './db/repositories/project';
import { DeveloperRepository } from './db/repositories/developer';
import { EpicRepository } from './db/repositories/epic';
import { StoryRepository } from './db/repositories/story';
import { SprintRepository } from './db/repositories/sprint';
import { SprintStoryRepository } from './db/repositories/sprintStory';

let mainWindow: BrowserWindow | null = null;

const DIST = path.join(__dirname, '../dist');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(DIST, 'index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize app database
  const appDb = getAppDb();
  runAppMigrations(appDb);

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeAll();
  if (process.platform !== 'darwin') app.quit();
});

function setupIpcHandlers() {
  const appDb = getAppDb();
  const projectRepo = new ProjectRepository(appDb);

  // === Project handlers ===
  ipcMain.handle('project:list', () => projectRepo.list());
  ipcMain.handle('project:create', (_, data) => projectRepo.create(data));
  ipcMain.handle('project:update', (_, id, data) => projectRepo.update(id, data));
  ipcMain.handle('project:delete', (_, id) => projectRepo.delete(id));
  ipcMain.handle('project:get', (_, id) => projectRepo.get(id));

  // === Project-scoped handlers ===
  function getProjectRepos(projectId: number) {
    const project = projectRepo.get(projectId) as any;
    if (!project) throw new Error('Project not found');
    const db = getProjectDb(project.db_path);
    runProjectMigrations(db);
    return {
      developer: new DeveloperRepository(db),
      epic: new EpicRepository(db),
      story: new StoryRepository(db),
      sprint: new SprintRepository(db),
      sprintStory: new SprintStoryRepository(db),
    };
  }

  // Developer handlers
  ipcMain.handle('developer:list', (_, projectId) => getProjectRepos(projectId).developer.list());
  ipcMain.handle('developer:create', (_, projectId, data) => getProjectRepos(projectId).developer.create(data));
  ipcMain.handle('developer:update', (_, projectId, id, data) => getProjectRepos(projectId).developer.update(id, data));
  ipcMain.handle('developer:delete', (_, projectId, id) => getProjectRepos(projectId).developer.delete(id));

  // Epic handlers
  ipcMain.handle('epic:list', (_, projectId) => getProjectRepos(projectId).epic.list());
  ipcMain.handle('epic:create', (_, projectId, data) => getProjectRepos(projectId).epic.create(data));
  ipcMain.handle('epic:update', (_, projectId, id, data) => getProjectRepos(projectId).epic.update(id, data));
  ipcMain.handle('epic:delete', (_, projectId, id) => getProjectRepos(projectId).epic.delete(id));

  // Story handlers
  ipcMain.handle('story:list', (_, projectId, filters) => getProjectRepos(projectId).story.list(filters));
  ipcMain.handle('story:create', (_, projectId, data) => getProjectRepos(projectId).story.create(data));
  ipcMain.handle('story:update', (_, projectId, id, data) => getProjectRepos(projectId).story.update(id, data));
  ipcMain.handle('story:delete', (_, projectId, id) => getProjectRepos(projectId).story.delete(id));
  ipcMain.handle('story:get', (_, projectId, id) => getProjectRepos(projectId).story.get(id));

  // Sprint handlers
  ipcMain.handle('sprint:list', (_, projectId) => getProjectRepos(projectId).sprint.list());
  ipcMain.handle('sprint:create', (_, projectId, data) => getProjectRepos(projectId).sprint.create(data));
  ipcMain.handle('sprint:update', (_, projectId, id, data) => getProjectRepos(projectId).sprint.update(id, data));
  ipcMain.handle('sprint:delete', (_, projectId, id) => getProjectRepos(projectId).sprint.delete(id));
  ipcMain.handle('sprint:get', (_, projectId, id) => getProjectRepos(projectId).sprint.get(id));

  // Sprint member handlers
  ipcMain.handle('sprintStory:getMembers', (_, projectId, sprintId) => getProjectRepos(projectId).sprintStory.getMembers(sprintId));
  ipcMain.handle('sprintStory:setMembers', (_, projectId, sprintId, members) => getProjectRepos(projectId).sprintStory.setMembers(sprintId, members));
  ipcMain.handle('sprintStory:assignStory', (_, projectId, storyId, sprintId) => getProjectRepos(projectId).sprintStory.assignStory(storyId, sprintId));
  ipcMain.handle('sprintStory:unassignStory', (_, projectId, storyId) => getProjectRepos(projectId).sprintStory.unassignStory(storyId));
  ipcMain.handle('sprintStory:getSprintStats', (_, projectId, sprintId) => getProjectRepos(projectId).sprintStory.getSprintStats(sprintId));

  // === Export handlers ===
  ipcMain.handle('export:printPage', async (_, projectId: number, sprintId: number) => {
    if (!mainWindow) return { success: false };
    const repos = getProjectRepos(projectId);
    const project = projectRepo.get(projectId) as any;
    const sprint = repos.sprint.get(sprintId) as any;
    if (!project || !sprint) return { success: false };

    const stats = repos.sprintStory.getSprintStats(sprintId) as any;
    const members = repos.sprintStory.getMembers(sprintId) as any[];
    const spHours = project.story_point_hours;
    const dailyHours = project.daily_hours;
    const totalCapacity = members.reduce((sum: number, m: any) =>
      sum + (sprint.duration_days * dailyHours * (m.allocation_percent / 100)) / spHours, 0);

    const completedStatuses = ['Resolved', 'Closed', 'Deployed'];

    // Status colors
    const statusColors: Record<string, string> = {
      'Open': '#9CA3AF', 'In Progress': '#3B82F6', 'On Hold': '#F59E0B',
      'Resolved': '#22C55E', 'Closed': '#8B5CF6', 'Deployed': '#14B8A6',
    };

    // Build status bar chart HTML
    const statusEntries = Object.entries(stats.status_points as Record<string, number>);
    const maxStatusPts = Math.max(...statusEntries.map(([,v]) => v), 1);
    const statusBarsHtml = statusEntries.map(([status, pts]) => {
      const pct = Math.round((pts / maxStatusPts) * 100);
      const color = statusColors[status] || '#9CA3AF';
      const count = (stats.status_counts as Record<string, number>)[status] || 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:90px;font-size:11px;text-align:right;color:#6b7280;">${status}</span>
        <div style="flex:1;background:#f3f4f6;border-radius:4px;height:20px;position:relative;">
          <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;"></div>
        </div>
        <span style="width:60px;font-size:11px;color:#374151;">${pts} SP (${count})</span>
      </div>`;
    }).join('');

    // Build epic bar chart HTML
    const epicBarsHtml = (stats.epic_stats as any[]).map((e: any) => {
      const maxEpicPts = Math.max(...(stats.epic_stats as any[]).map((x: any) => x.total_points), 1);
      const totalPct = Math.round((e.total_points / maxEpicPts) * 100);
      const completedPct = e.total_points > 0 ? Math.round((e.completed_points / e.total_points) * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:110px;font-size:11px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:4px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${e.color};display:inline-block;"></span>
          ${e.name}
        </span>
        <div style="flex:1;background:#f3f4f6;border-radius:4px;height:20px;position:relative;">
          <div style="width:${totalPct}%;background:${e.color}40;height:100%;border-radius:4px;position:absolute;"></div>
          <div style="width:${Math.round((e.completed_points / maxEpicPts) * 100)}%;background:${e.color};height:100%;border-radius:4px;position:absolute;"></div>
        </div>
        <span style="width:90px;font-size:11px;color:#374151;">${e.completed_points}/${e.total_points} SP (${completedPct}%)</span>
      </div>`;
    }).join('');

    // Build developer table
    const devRows = (stats.developer_stats as any[]).map((d: any) => {
      const pct = d.total_points > 0 ? Math.round((d.completed_points / d.total_points) * 100) : 0;
      return `<tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.story_count}</td>
        <td>${d.total_points}</td>
        <td>${d.completed_points}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="flex:1;background:#e5e7eb;border-radius:4px;height:12px;">
              <div style="width:${pct}%;background:#22c55e;height:100%;border-radius:4px;"></div>
            </div>
            <span style="font-size:11px;font-weight:600;">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Story list table
    const storyRows = (stats.stories as any[]).map((s: any, i: number) => {
      const sc = statusColors[s.status] || '#9CA3AF';
      return `<tr>
        <td>${i + 1}</td>
        <td>${s.title}</td>
        <td>${s.epic_name || '-'}</td>
        <td>${s.assignee_name || '-'}</td>
        <td style="text-align:center;">${s.story_points ?? '-'}</td>
        <td><span style="background:${sc}20;color:${sc};padding:2px 8px;border-radius:4px;font-size:11px;">${s.status}</span></td>
      </tr>`;
    }).join('');

    const completionPct = stats.completion_percent;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${sprint.name} - Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 40px; color: #1f2937; font-size: 12px; }
  h1 { font-size: 22px; margin-bottom: 2px; }
  h2 { font-size: 14px; margin-top: 24px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; color: #374151; }
  .meta { color: #6b7280; margin-bottom: 20px; font-size: 11px; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .card .val { font-size: 26px; font-weight: 700; line-height: 1.2; }
  .card .val.green { color: #16a34a; }
  .card .val.blue { color: #2563eb; }
  .card .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .progress-wrap { background: #e5e7eb; border-radius: 6px; height: 18px; margin: 6px 0 16px; position: relative; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 6px; background: #22c55e; }
  .progress-text { position: absolute; right: 8px; top: 1px; font-size: 11px; font-weight: 600; color: #374151; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
  .section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .section h3 { font-size: 12px; font-weight: 600; margin-bottom: 10px; color: #374151; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 2px solid #d1d5db; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; }
  @page { size: A4; margin: 10mm; }
</style>
</head><body>

<h1>${sprint.name} - Sprint Report</h1>
<div class="meta">${project.name} | ${sprint.start_date} | ${sprint.duration_days} business days | 1 SP = ${spHours}h | Daily: ${dailyHours}h</div>

<div class="grid4">
  <div class="card"><div class="val">${stats.total_stories}</div><div class="lbl">Stories</div></div>
  <div class="card"><div class="val">${stats.total_points}</div><div class="lbl">Total SP</div></div>
  <div class="card"><div class="val green">${stats.completed_points}</div><div class="lbl">Completed SP</div></div>
  <div class="card"><div class="val blue">${totalCapacity.toFixed(1)}</div><div class="lbl">Capacity SP</div></div>
</div>

<div style="font-size:12px;font-weight:600;margin-bottom:4px;">Completion: ${completionPct}%</div>
<div class="progress-wrap">
  <div class="progress-fill" style="width:${completionPct}%"></div>
  <div class="progress-text">${stats.completed_points} / ${stats.total_points} SP</div>
</div>

<div class="grid2">
  <div class="section">
    <h3>Status Distribution</h3>
    ${statusBarsHtml}
  </div>
  <div class="section">
    <h3>Epic Breakdown</h3>
    ${epicBarsHtml}
  </div>
</div>

<h2>Developer Statistics</h2>
<table>
  <tr><th>Developer</th><th>Stories</th><th>Total SP</th><th>Completed SP</th><th style="width:35%">Progress</th></tr>
  ${devRows}
</table>

<h2>All Stories</h2>
<table>
  <tr><th>#</th><th>Title</th><th>Epic</th><th>Assignee</th><th style="text-align:center;">SP</th><th>Status</th></tr>
  ${storyRows}
</table>

<div class="footer">Generated by SprintApp on ${new Date().toLocaleDateString()} | ${sprint.name} | ${project.name}</div>
</body></html>`;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${sprint.name.replace(/\s+/g, '_')}_report.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!filePath) return { success: false, cancelled: true };

    const printWin = new BrowserWindow({ show: false, width: 794, height: 1123 });
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdfData = await printWin.webContents.printToPDF({
      printBackground: true,
      landscape: false,
      margins: { marginType: 'default' },
    });
    printWin.close();
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  });

  ipcMain.handle('export:saveSprintPlan', async (_, projectId: number, sprintId: number) => {
    if (!mainWindow) return { success: false };
    const repos = getProjectRepos(projectId);
    const project = projectRepo.get(projectId) as any;
    const sprint = repos.sprint.get(sprintId) as any;
    const members = repos.sprintStory.getMembers(sprintId) as any[];
    const stories = repos.story.list({ sprint_id: sprintId }) as any[];

    const spHours = project.story_point_hours;
    const dailyHours = project.daily_hours;

    // Group stories by assignee
    const byDev: Record<string, { name: string; allocation: number; capacity: number; stories: any[] }> = {};
    const unassigned: any[] = [];

    for (const m of members) {
      const cap = (sprint.duration_days * dailyHours * (m.allocation_percent / 100)) / spHours;
      byDev[m.developer_id] = {
        name: m.developer_name,
        allocation: m.allocation_percent,
        capacity: cap,
        stories: [],
      };
    }

    for (const s of stories) {
      if (s.assignee_id && byDev[s.assignee_id]) {
        byDev[s.assignee_id].stories.push(s);
      } else {
        unassigned.push(s);
      }
    }

    const totalCapacity = Object.values(byDev).reduce((sum, d) => sum + d.capacity, 0);
    const totalPoints = stories.reduce((sum: number, s: any) => sum + (s.story_points || 0), 0);

    // Build HTML
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${sprint.name} - Sprint Plan</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; font-size: 13px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 28px; margin-bottom: 8px; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; }
  .meta { color: #6b7280; margin-bottom: 20px; font-size: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .summary-card .value { font-size: 24px; font-weight: 700; }
  .summary-card .label { font-size: 11px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 12px; border-bottom: 2px solid #d1d5db; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  .dev-header { background: #eff6ff; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; }
  .dev-header .name { font-weight: 600; font-size: 14px; }
  .dev-header .info { color: #3b82f6; font-size: 12px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .capacity-bar { height: 8px; background: #e5e7eb; border-radius: 4px; margin-top: 4px; }
  .capacity-fill { height: 8px; background: #3b82f6; border-radius: 4px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>${sprint.name} - Sprint Plan</h1>
<div class="meta">${project.name} | Start: ${sprint.start_date} | Duration: ${sprint.duration_days} business days | 1 SP = ${spHours}h | Daily: ${dailyHours}h</div>

<div class="summary-grid">
  <div class="summary-card"><div class="value">${stories.length}</div><div class="label">Total Stories</div></div>
  <div class="summary-card"><div class="value">${totalPoints}</div><div class="label">Total SP</div></div>
  <div class="summary-card"><div class="value">${totalCapacity.toFixed(1)}</div><div class="label">Team Capacity (SP)</div></div>
  <div class="summary-card"><div class="value">${totalCapacity > 0 ? Math.round((totalPoints / totalCapacity) * 100) : 0}%</div><div class="label">Capacity Used</div></div>
</div>

<h2>Team Allocation</h2>
<table>
  <tr><th>Developer</th><th>Allocation</th><th>Capacity (SP)</th><th>Assigned SP</th><th>Stories</th></tr>
  ${Object.values(byDev).map(d => {
    const assignedPts = d.stories.reduce((sum: number, s: any) => sum + (s.story_points || 0), 0);
    return `<tr>
      <td><strong>${d.name}</strong></td>
      <td>${d.allocation}%</td>
      <td>${d.capacity.toFixed(1)}</td>
      <td>${assignedPts}</td>
      <td>${d.stories.length}</td>
    </tr>`;
  }).join('')}
</table>

${Object.values(byDev).map(d => {
    const assignedPts = d.stories.reduce((sum: number, s: any) => sum + (s.story_points || 0), 0);
    const pct = d.capacity > 0 ? Math.min(100, Math.round((assignedPts / d.capacity) * 100)) : 0;
    return `
<h2>${d.name}</h2>
<div class="dev-header">
  <span class="info">Allocation: ${d.allocation}% | Capacity: ${d.capacity.toFixed(1)} SP | Assigned: ${assignedPts} SP (${pct}%)</span>
</div>
<div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%"></div></div>
<table>
  <tr><th>#</th><th>Story</th><th>SP</th><th>Status</th><th>Epic</th></tr>
  ${d.stories.map((s: any, i: number) => `<tr>
    <td>${i + 1}</td>
    <td>${s.title}</td>
    <td>${s.story_points ?? '-'}</td>
    <td><span class="tag" style="background:#f3f4f6">${s.status}</span></td>
    <td>${s.epic_name || '-'}</td>
  </tr>`).join('')}
</table>`;
  }).join('')}

${unassigned.length > 0 ? `
<h2>Unassigned Stories</h2>
<table>
  <tr><th>#</th><th>Story</th><th>SP</th><th>Status</th><th>Epic</th></tr>
  ${unassigned.map((s: any, i: number) => `<tr>
    <td>${i + 1}</td>
    <td>${s.title}</td>
    <td>${s.story_points ?? '-'}</td>
    <td><span class="tag" style="background:#f3f4f6">${s.status}</span></td>
    <td>${s.epic_name || '-'}</td>
  </tr>`).join('')}
</table>` : ''}

<div class="meta" style="margin-top:32px;text-align:center">Generated by SprintApp on ${new Date().toLocaleDateString()}</div>
</body></html>`;

    // Render HTML in a hidden window to generate PDF
    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: `${sprint.name.replace(/\s+/g, '_')}_plan.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!filePath) return { success: false, cancelled: true };

    const printWin = new BrowserWindow({ show: false, width: 800, height: 600 });
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdfData = await printWin.webContents.printToPDF({
      printBackground: true,
      landscape: false,
      margins: { marginType: 'default' },
    });
    printWin.close();
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  });

  ipcMain.handle('export:csv', async (_, projectId: number, sprintId: number) => {
    if (!mainWindow) return { success: false };
    const repos = getProjectRepos(projectId);
    const sprint = repos.sprint.get(sprintId) as any;
    if (!sprint) return { success: false };
    const stories = repos.story.list({ sprint_id: sprintId }) as any[];

    const escapeCsv = (val: string | null | undefined) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const header = 'Epic,Story,Description,Developer,Story Points,Status';
    const rows = stories.map((s: any) =>
      [
        escapeCsv(s.epic_name),
        escapeCsv(s.title),
        escapeCsv(s.description),
        escapeCsv(s.assignee_name),
        s.story_points ?? '',
        escapeCsv(s.status),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${sprint.name.replace(/\s+/g, '_')}_stories.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (!filePath) return { success: false, cancelled: true };
    fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf-8');
    return { success: true, filePath };
  });

  ipcMain.handle('export:importCsv', async (_, projectId: number, sprintId: number) => {
    if (!mainWindow) return { success: false };
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    if (!filePaths || filePaths.length === 0) return { success: false, cancelled: true };

    const content = fs.readFileSync(filePaths[0], 'utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { success: false, error: 'CSV is empty' };

    const repos = getProjectRepos(projectId);

    // Parse CSV (handle quoted fields)
    function parseCsvLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            result.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
      }
      result.push(current.trim());
      return result;
    }

    // Skip header row
    const dataRows = lines.slice(1);
    let imported = 0;

    for (const line of dataRows) {
      const cols = parseCsvLine(line);
      if (cols.length < 2) continue;

      const [epicName, title, description, developerName, spStr, statusStr] = cols;
      if (!title) continue;

      // Find or create epic
      let epicId: number | null = null;
      if (epicName) {
        const existingEpics = repos.epic.list() as any[];
        let epic = existingEpics.find((e: any) => e.name.toLowerCase() === epicName.toLowerCase());
        if (!epic) {
          epic = repos.epic.create({ name: epicName });
        }
        epicId = epic.id;
      }

      // Find or create developer
      let assigneeId: number | null = null;
      if (developerName) {
        const existingDevs = repos.developer.list() as any[];
        let dev = existingDevs.find((d: any) => d.name.toLowerCase() === developerName.toLowerCase());
        if (!dev) {
          dev = repos.developer.create({ name: developerName });
        }
        assigneeId = dev.id;
      }

      const storyPoints = spStr ? Number(spStr) : null;
      const validStatuses = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Deployed'];
      const status = (statusStr && validStatuses.includes(statusStr)) ? statusStr : 'Open';

      repos.story.create({
        title,
        description: description || undefined,
        story_points: storyPoints ?? undefined,
        epic_id: epicId ?? undefined,
        assignee_id: assigneeId ?? undefined,
        sprint_id: sprintId,
        status,
      });
      imported++;
    }

    return { success: true, imported };
  });
}
