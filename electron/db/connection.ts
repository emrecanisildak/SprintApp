import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const dbCache = new Map<string, Database.Database>();

function getDataPath(): string {
  const dataPath = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  return dataPath;
}

export function getAppDb(): Database.Database {
  const dbPath = path.join(getDataPath(), 'app.db');
  return getOrCreate(dbPath);
}

export function getProjectDb(dbPath: string): Database.Database {
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(getDataPath(), dbPath);
  return getOrCreate(fullPath);
}

function getOrCreate(dbPath: string): Database.Database {
  const cached = dbCache.get(dbPath);
  if (cached && cached.open) {
    return cached;
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  dbCache.set(dbPath, db);
  return db;
}

export function closeAll(): void {
  for (const db of dbCache.values()) {
    db.close();
  }
  dbCache.clear();
}

export function getDataDir(): string {
  return getDataPath();
}
