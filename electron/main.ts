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
import { StatusRepository } from './db/repositories/statusRepository';

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
      status: new StatusRepository(db),
    };
  }

  // Status handlers
  ipcMain.handle('status:list', (_, projectId) => getProjectRepos(projectId).status.list());
  ipcMain.handle('status:create', (_, projectId, data) => getProjectRepos(projectId).status.create(data));
  ipcMain.handle('status:update', (_, projectId, id, data) => getProjectRepos(projectId).status.update(id, data));
  ipcMain.handle('status:delete', (_, projectId, id) => getProjectRepos(projectId).status.delete(id));

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

    // Get sprint name for default filename
    const repos = getProjectRepos(projectId);
    const sprint = repos.sprint.get(sprintId) as any;
    const defaultName = sprint ? `${sprint.name.replace(/\s+/g, '_')}_report.pdf` : 'sprint_report.pdf';

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (!filePath) return { success: false, cancelled: true };

    try {
      const pdfData = await mainWindow.webContents.printToPDF({
        printBackground: true,
        landscape: false,
        margins: { marginType: 'default' },
      });
      fs.writeFileSync(filePath, pdfData);
      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return { success: false, error: String(error) };
    }
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
      const validStatuses = repos.status.list().map(s => s.name);
      const status = (statusStr && validStatuses.includes(statusStr)) ? statusStr : repos.status.getDefault().name;

      // Check if story with same title already exists in this sprint
      const existingStories = repos.story.list({ sprint_id: sprintId }) as any[];
      const existingStory = existingStories.find((s: any) => s.title.toLowerCase() === title.toLowerCase());

      if (existingStory) {
        repos.story.update(existingStory.id, {
          description: description || existingStory.description,
          story_points: storyPoints ?? existingStory.story_points,
          epic_id: epicId ?? existingStory.epic_id,
          assignee_id: assigneeId ?? existingStory.assignee_id,
          status,
        });
      } else {
        repos.story.create({
          title,
          description: description || undefined,
          story_points: storyPoints ?? undefined,
          epic_id: epicId ?? undefined,
          assignee_id: assigneeId ?? undefined,
          sprint_id: sprintId,
          status,
        });
      }
      imported++;
    }

    return { success: true, imported };
  });

  ipcMain.handle('export:importBacklogCsv', async (_, projectId: number) => {
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

    function parseCsvLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
          else if (ch === '"') { inQuotes = false; }
          else { current += ch; }
        } else {
          if (ch === '"') { inQuotes = true; }
          else if (ch === ',') { result.push(current.trim()); current = ''; }
          else { current += ch; }
        }
      }
      result.push(current.trim());
      return result;
    }

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

      // Find or create status
      const storyPoints = spStr ? Number(spStr) : null;
      let status: string;
      if (statusStr) {
        const existingStatuses = repos.status.list();
        const statusExists = existingStatuses.find(s => s.name.toLowerCase() === statusStr.toLowerCase());
        if (!statusExists) {
          const maxPos = existingStatuses.length > 0 ? Math.max(...existingStatuses.map(s => s.position)) : 0;
          repos.status.create({
            name: statusStr,
            color: '#6B7280',
            is_default: 0,
            is_completed: 0,
            position: maxPos + 1,
          });
        }
        status = statusExists ? statusExists.name : statusStr;
      } else {
        status = repos.status.getDefault().name;
      }

      // Check if story with same title exists in backlog
      const backlogStories = repos.story.list({ backlog: true }) as any[];
      const existingStory = backlogStories.find((s: any) => s.title.toLowerCase() === title.toLowerCase());

      if (existingStory) {
        repos.story.update(existingStory.id, {
          description: description || existingStory.description,
          story_points: storyPoints ?? existingStory.story_points,
          epic_id: epicId ?? existingStory.epic_id,
          assignee_id: assigneeId ?? existingStory.assignee_id,
          status,
        });
      } else {
        repos.story.create({
          title,
          description: description || undefined,
          story_points: storyPoints ?? undefined,
          epic_id: epicId ?? undefined,
          assignee_id: assigneeId ?? undefined,
          status,
        });
      }
      imported++;
    }

    return { success: true, imported };
  });

  ipcMain.handle('export:importStatusCsv', async (_, projectId: number, sprintId: number) => {
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
    const stories = repos.story.list({ sprint_id: sprintId }) as any[];

    function parseCsvLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
          else if (ch === '"') { inQuotes = false; }
          else { current += ch; }
        } else {
          if (ch === '"') { inQuotes = true; }
          else if (ch === ',') { result.push(current.trim()); current = ''; }
          else { current += ch; }
        }
      }
      result.push(current.trim());
      return result;
    }

    // Detect column indices from header
    const headerCols = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    let storyIdx = headerCols.indexOf('story');
    let statusIdx = headerCols.indexOf('status');
    // Fallback: if no header match, assume 2-column format (col 0 = story, col 1 = status)
    if (storyIdx === -1) storyIdx = 0;
    if (statusIdx === -1) statusIdx = 1;

    const dataRows = lines.slice(1);
    let updated = 0;

    for (const line of dataRows) {
      const cols = parseCsvLine(line);
      const storyTitle = cols[storyIdx]?.trim();
      const statusName = cols[statusIdx]?.trim();
      if (!storyTitle || !statusName) continue;

      // Find story by title in this sprint
      const story = stories.find((s: any) => s.title.toLowerCase() === storyTitle.toLowerCase());
      if (!story) continue;

      // Ensure status exists in project
      const existingStatuses = repos.status.list();
      const statusExists = existingStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
      if (!statusExists) {
        const maxPos = existingStatuses.length > 0 ? Math.max(...existingStatuses.map(s => s.position)) : 0;
        repos.status.create({
          name: statusName,
          color: '#6B7280',
          is_default: 0,
          is_completed: 0,
          position: maxPos + 1,
        });
      }

      const finalStatusName = statusExists ? statusExists.name : statusName;
      repos.story.update(story.id, { status: finalStatusName });
      updated++;
    }

    return { success: true, updated };
  });
}
