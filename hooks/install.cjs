#!/usr/bin/env node

/**
 * Athena Hooks Installer
 *
 * Adds Athena's auto-trigger hooks to Claude Code settings.json:
 * - SessionStart: athena-session-start-hook.cjs (injects athena-init at session boot)
 * - PostToolUse: athena-hook.cjs (test pass, review, conflicts, new files, plan detection, edit bursts)
 * - PreToolUse: athena-init-hook.cjs (enforces skill routing before action tools)
 *
 * Run: node hooks/install.cjs
 */

const fs = require('fs');
const path = require('path');

const homeDir = process.env.HOME || process.env.USERPROFILE;
const settingsPath = path.join(homeDir, '.claude', 'settings.json');
const postHookPath = path.resolve(__dirname, 'athena-hook.cjs').replace(/\\/g, '/');
const preHookPath = path.resolve(__dirname, 'athena-init-hook.cjs').replace(/\\/g, '/');
const sessionStartHookPath = path.resolve(__dirname, 'athena-session-start-hook.cjs').replace(/\\/g, '/');

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch {
  console.log('No existing settings.json found, creating new one.');
}

if (!settings.hooks) settings.hooks = {};

// --- Detect existing non-Athena hooks ---
const existingPostHooks = (settings.hooks.PostToolUse || []).filter(entry =>
  !(entry.hooks && entry.hooks.some(h => h.command && h.command.includes('athena-hook')))
);
const existingPreHooks = (settings.hooks.PreToolUse || []).filter(entry =>
  !(entry.hooks && entry.hooks.some(h => h.command && h.command.includes('athena-init-hook')))
);
const existingSessionStartHooks = (settings.hooks.SessionStart || []).filter(entry =>
  !(entry.hooks && entry.hooks.some(h => h.command && h.command.includes('athena-session-start-hook')))
);

const preservedCount = existingPostHooks.length + existingPreHooks.length + existingSessionStartHooks.length;
if (preservedCount > 0) {
  console.log(`Found ${preservedCount} existing non-Athena hook(s) — preserving them.`);
}

// --- Back up settings before modifying ---
try {
  const backupPath = settingsPath + '.pre-athena-backup';
  fs.writeFileSync(backupPath, JSON.stringify(settings, null, 2));
  console.log(`Backed up existing settings to ${path.basename(backupPath)}`);
} catch { /* backup failed — non-critical */ }

// --- PostToolUse hook ---
const postHook = {
  type: 'command',
  command: `node "${postHookPath}"`,
  timeout: 10
};

// Keep existing non-Athena hooks, remove old Athena hooks, add fresh
settings.hooks.PostToolUse = [...existingPostHooks, {
  matcher: 'Bash|Read|Write|Edit',
  hooks: [postHook]
}];
console.log('Added Athena PostToolUse hook (tests, reviews, conflicts, new files, plans, edit bursts).');

// --- PreToolUse hook ---
const preHook = {
  type: 'command',
  command: `node "${preHookPath}"`,
  timeout: 10
};

// Keep existing non-Athena hooks, remove old Athena hooks, add fresh
settings.hooks.PreToolUse = [...existingPreHooks, {
  matcher: 'Edit|Write|Bash',
  hooks: [preHook]
}];
console.log('Added Athena PreToolUse hook (init enforcement on action tools).');

// --- SessionStart hook (the strongest enforcement vector) ---
const sessionStartHook = {
  type: 'command',
  command: `node "${sessionStartHookPath}"`,
  timeout: 10
};

settings.hooks.SessionStart = [...existingSessionStartHooks, {
  hooks: [sessionStartHook]
}];
console.log('Added Athena SessionStart hook (injects athena-init at session boot).');

// --- Write settings (ensure parent dir exists) ---
fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log(`Settings saved to ${settingsPath}`);
console.log('Athena hooks installed successfully. Existing hooks preserved.');
