import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_FILE = path.join(ROOT, 'data', 'db.json');
export const WORKSPACES = path.join(ROOT, '.workspaces');
export const CHALLENGES = path.join(ROOT, 'challenges');

export function challengeDir(challengeId) {
  return path.join(CHALLENGES, challengeId);
}

export function submissionDir(submissionId) {
  return path.join(WORKSPACES, submissionId);
}

export function sessionDir(submissionId, sessionId) {
  return path.join(WORKSPACES, submissionId, 'sessions', sessionId);
}
