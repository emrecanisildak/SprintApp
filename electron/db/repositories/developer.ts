import Database from 'better-sqlite3';

export class DeveloperRepository {
  constructor(private db: Database.Database) {}

  list() {
    return this.db.prepare('SELECT * FROM developers ORDER BY name').all();
  }

  get(id: number) {
    return this.db.prepare('SELECT * FROM developers WHERE id = ?').get(id);
  }

  create(data: { name: string; email?: string }) {
    const result = this.db.prepare('INSERT INTO developers (name, email) VALUES (?, ?)').run(data.name, data.email ?? null);
    return this.get(result.lastInsertRowid as number);
  }

  update(id: number, data: Partial<{ name: string; email: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (fields.length === 0) return this.get(id);
    values.push(id);
    this.db.prepare(`UPDATE developers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  }

  delete(id: number) {
    this.db.prepare('DELETE FROM developers WHERE id = ?').run(id);
  }
}
