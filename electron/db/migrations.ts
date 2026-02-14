import Database from 'better-sqlite3';

export function runAppMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      db_path TEXT NOT NULL,
      story_point_hours REAL NOT NULL DEFAULT 4,
      daily_hours REAL NOT NULL DEFAULT 8,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function runProjectMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS epics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6'
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      status TEXT DEFAULT 'Planning',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      story_points REAL,
      epic_id INTEGER REFERENCES epics(id) ON DELETE SET NULL,
      assignee_id INTEGER REFERENCES developers(id) ON DELETE SET NULL,
      sprint_id INTEGER REFERENCES sprints(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'Open',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sprint_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
      developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
      allocation_percent INTEGER DEFAULT 100,
      UNIQUE(sprint_id, developer_id)
    );
  `);
}
