import Database from 'better-sqlite3';

export class ProjectRepository {
  constructor(private db: Database.Database) {}

  list() {
    return this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  }

  get(id: number) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  create(data: { name: string; db_path: string; story_point_hours?: number; daily_hours?: number }) {
    const stmt = this.db.prepare(
      'INSERT INTO projects (name, db_path, story_point_hours, daily_hours) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(data.name, data.db_path, data.story_point_hours ?? 4, data.daily_hours ?? 8);
    return this.get(result.lastInsertRowid as number);
  }

  update(id: number, data: Partial<{ name: string; story_point_hours: number; daily_hours: number }>) {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.story_point_hours !== undefined) { fields.push('story_point_hours = ?'); values.push(data.story_point_hours); }
    if (data.daily_hours !== undefined) { fields.push('daily_hours = ?'); values.push(data.daily_hours); }
    fields.push("updated_at = datetime('now')");
    values.push(id);
    this.db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  }

  delete(id: number) {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}
