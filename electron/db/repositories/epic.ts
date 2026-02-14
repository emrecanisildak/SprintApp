import Database from 'better-sqlite3';

export class EpicRepository {
  constructor(private db: Database.Database) {}

  list() {
    return this.db.prepare('SELECT * FROM epics ORDER BY name').all();
  }

  get(id: number) {
    return this.db.prepare('SELECT * FROM epics WHERE id = ?').get(id);
  }

  create(data: { name: string; description?: string; color?: string }) {
    const result = this.db.prepare('INSERT INTO epics (name, description, color) VALUES (?, ?, ?)').run(
      data.name, data.description ?? null, data.color ?? '#3B82F6'
    );
    return this.get(result.lastInsertRowid as number);
  }

  update(id: number, data: Partial<{ name: string; description: string; color: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
    if (fields.length === 0) return this.get(id);
    values.push(id);
    this.db.prepare(`UPDATE epics SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  }

  delete(id: number) {
    this.db.prepare('DELETE FROM epics WHERE id = ?').run(id);
  }
}
