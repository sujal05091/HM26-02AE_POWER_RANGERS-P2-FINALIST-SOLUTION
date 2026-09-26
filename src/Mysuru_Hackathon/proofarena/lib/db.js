import fs from 'node:fs';
import path from 'node:path';
import { DATA_FILE, WORKSPACES } from './paths';
import { createSeed } from './seed';

// A single JSON file is enough for the demo. All updates are synchronous,
// so a read-modify-write inside updateDb can't interleave with another request.
export function readDb() {
  if (!fs.existsSync(DATA_FILE)) {
    writeDb(createSeed());
  }
  const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  db.customChallenges ||= [];
  db.connections ||= [];
  db.quests ||= [];
  db.questRuns ||= [];
  db.notifications ||= [];
  return db;
}

export function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function updateDb(fn) {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function resetDb() {
  fs.rmSync(WORKSPACES, { recursive: true, force: true });
  writeDb(createSeed());
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function logActivity(db, text, who = 'system') {
  db.activity.unshift({ id: uid('act'), text, who, at: new Date().toISOString() });
  db.activity = db.activity.slice(0, 40);
}
