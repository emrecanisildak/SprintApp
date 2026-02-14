import Database from 'better-sqlite3';

export class SprintRepository {
  constructor(private db: Database.Database) { }

  list() {
    return this.db.prepare('SELECT * FROM sprints ORDER BY start_date DESC').all();
  }

  get(id: number) {
    return this.db.prepare('SELECT * FROM sprints WHERE id = ?').get(id);
  }

  create(data: { name: string; start_date: string; duration_days: number; status?: string }) {
    const result = this.db.prepare(
      'INSERT INTO sprints (name, start_date, duration_days, status) VALUES (?, ?, ?, ?)'
    ).run(data.name, data.start_date, data.duration_days, data.status ?? 'Planning');
    return this.get(result.lastInsertRowid as number);
  }

  update(id: number, data: Partial<{ name: string; start_date: string; duration_days: number; status: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return this.get(id);
    values.push(id);
    this.db.prepare(`UPDATE sprints SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // When sprint is completed, move unfinished stories back to backlog
    if (data.status === 'Completed') {
      const completedStatuses = this.db.prepare('SELECT name FROM statuses WHERE is_completed = 1').all() as { name: string }[];
      const completedStatusNames = completedStatuses.map(s => s.name);

      if (completedStatusNames.length > 0) {
        const placeholders = completedStatusNames.map(() => '?').join(',');
        this.db.prepare(`
          UPDATE stories SET sprint_id = NULL, updated_at = datetime('now')
          WHERE sprint_id = ? AND status NOT IN (${placeholders})
        `).run(id, ...completedStatusNames);
      } else {
        // If no statuses are marked as completed, move all stories to backlog
        this.db.prepare(`
          UPDATE stories SET sprint_id = NULL, updated_at = datetime('now')
          WHERE sprint_id = ?
        `).run(id);
      }
    }

    return this.get(id);
  }

  delete(id: number) {
    this.db.prepare('DELETE FROM sprints WHERE id = ?').run(id);
  }
}
