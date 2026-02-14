import Database from 'better-sqlite3';

export class SprintStoryRepository {
  constructor(private db: Database.Database) {}

  getMembers(sprintId: number) {
    return this.db.prepare(`
      SELECT sm.*, d.name as developer_name, d.email as developer_email
      FROM sprint_members sm
      JOIN developers d ON sm.developer_id = d.id
      WHERE sm.sprint_id = ?
    `).all(sprintId);
  }

  setMembers(sprintId: number, members: { developer_id: number; allocation_percent: number }[]) {
    const deleteStmt = this.db.prepare('DELETE FROM sprint_members WHERE sprint_id = ?');
    const insertStmt = this.db.prepare(
      'INSERT INTO sprint_members (sprint_id, developer_id, allocation_percent) VALUES (?, ?, ?)'
    );

    const transaction = this.db.transaction(() => {
      deleteStmt.run(sprintId);
      for (const m of members) {
        insertStmt.run(sprintId, m.developer_id, m.allocation_percent);
      }
    });
    transaction();
    return this.getMembers(sprintId);
  }

  assignStory(storyId: number, sprintId: number) {
    this.db.prepare("UPDATE stories SET sprint_id = ?, updated_at = datetime('now') WHERE id = ?").run(sprintId, storyId);
  }

  unassignStory(storyId: number) {
    this.db.prepare("UPDATE stories SET sprint_id = NULL, updated_at = datetime('now') WHERE id = ?").run(storyId);
  }

  getSprintStats(sprintId: number) {
    const stories = this.db.prepare(`
      SELECT s.*, d.name as assignee_name, e.name as epic_name, e.color as epic_color
      FROM stories s
      LEFT JOIN developers d ON s.assignee_id = d.id
      LEFT JOIN epics e ON s.epic_id = e.id
      WHERE s.sprint_id = ?
    `).all(sprintId) as any[];

    const totalPoints = stories.reduce((sum: number, s: any) => sum + (s.story_points || 0), 0);
    const completedStatuses = ['Resolved', 'Closed', 'Deployed'];
    const completedPoints = stories.filter((s: any) => completedStatuses.includes(s.status))
      .reduce((sum: number, s: any) => sum + (s.story_points || 0), 0);

    const statusCounts: Record<string, number> = {};
    const statusPoints: Record<string, number> = {};
    for (const s of stories) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      statusPoints[s.status] = (statusPoints[s.status] || 0) + (s.story_points || 0);
    }

    const developerStats: Record<number, { name: string; total_points: number; completed_points: number; story_count: number }> = {};
    for (const s of stories) {
      if (!s.assignee_id) continue;
      if (!developerStats[s.assignee_id]) {
        developerStats[s.assignee_id] = { name: s.assignee_name, total_points: 0, completed_points: 0, story_count: 0 };
      }
      developerStats[s.assignee_id].total_points += s.story_points || 0;
      developerStats[s.assignee_id].story_count += 1;
      if (completedStatuses.includes(s.status)) {
        developerStats[s.assignee_id].completed_points += s.story_points || 0;
      }
    }

    const epicStats: Record<string, { name: string; color: string; total_points: number; completed_points: number; story_count: number }> = {};
    for (const s of stories) {
      const key = s.epic_id ? String(s.epic_id) : '_none';
      if (!epicStats[key]) {
        epicStats[key] = { name: s.epic_name || 'No Epic', color: s.epic_color || '#9CA3AF', total_points: 0, completed_points: 0, story_count: 0 };
      }
      epicStats[key].total_points += s.story_points || 0;
      epicStats[key].story_count += 1;
      if (completedStatuses.includes(s.status)) {
        epicStats[key].completed_points += s.story_points || 0;
      }
    }

    return {
      total_stories: stories.length,
      total_points: totalPoints,
      completed_points: completedPoints,
      completion_percent: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      status_counts: statusCounts,
      status_points: statusPoints,
      developer_stats: Object.values(developerStats),
      epic_stats: Object.values(epicStats),
      stories,
    };
  }
}
