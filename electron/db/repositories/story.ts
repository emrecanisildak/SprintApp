import Database from 'better-sqlite3';

export class StoryRepository {
  constructor(private db: Database.Database) {}

  list(filters?: { sprint_id?: number | null; epic_id?: number; backlog?: boolean }) {
    let sql = `
      SELECT s.*, e.name as epic_name, e.color as epic_color, d.name as assignee_name
      FROM stories s
      LEFT JOIN epics e ON s.epic_id = e.id
      LEFT JOIN developers d ON s.assignee_id = d.id
    `;
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.backlog) {
      conditions.push('s.sprint_id IS NULL');
    }
    if (filters?.sprint_id !== undefined && filters.sprint_id !== null) {
      conditions.push('s.sprint_id = ?');
      values.push(filters.sprint_id);
    }
    if (filters?.epic_id) {
      conditions.push('s.epic_id = ?');
      values.push(filters.epic_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY s.created_at DESC';

    return this.db.prepare(sql).all(...values);
  }

  get(id: number) {
    return this.db.prepare(`
      SELECT s.*, e.name as epic_name, e.color as epic_color, d.name as assignee_name
      FROM stories s
      LEFT JOIN epics e ON s.epic_id = e.id
      LEFT JOIN developers d ON s.assignee_id = d.id
      WHERE s.id = ?
    `).get(id);
  }

  create(data: { title: string; description?: string; story_points?: number; epic_id?: number; assignee_id?: number; sprint_id?: number; status?: string }) {
    const result = this.db.prepare(
      'INSERT INTO stories (title, description, story_points, epic_id, assignee_id, sprint_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      data.title, data.description ?? null, data.story_points ?? null,
      data.epic_id ?? null, data.assignee_id ?? null, data.sprint_id ?? null, data.status ?? 'Open'
    );
    return this.get(result.lastInsertRowid as number);
  }

  update(id: number, data: Partial<{ title: string; description: string; story_points: number; epic_id: number | null; assignee_id: number | null; sprint_id: number | null; status: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value ?? null);
    }
    fields.push("updated_at = datetime('now')");
    if (fields.length === 1) return this.get(id);
    values.push(id);
    this.db.prepare(`UPDATE stories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  }

  delete(id: number) {
    this.db.prepare('DELETE FROM stories WHERE id = ?').run(id);
  }
}
