/**
 * Athena plugin for OpenCode.ai
 *
 * Two responsibilities:
 *   1. Register the Athena skills directory so OpenCode auto-discovers all
 *      athena-* skills (no symlinks required).
 *   2. Inject the `athena-init` SKILL.md as a session-start bootstrap context
 *      via system-prompt transform — putting the framework in the model's eyes
 *      from message 1.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walk up from .opencode/plugins/athena.js → repo root
const athenaRoot = path.resolve(__dirname, '../..');
const athenaSkillsDir = path.join(athenaRoot, 'skills');

// Strip YAML frontmatter so the body doesn't dump frontmatter into the prompt.
const stripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? match[2] : content;
};

const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

// Cache: athena-init SKILL.md doesn't change during a session.
// undefined = not loaded yet, null = file missing.
let _bootstrapCache = undefined;

const getBootstrapContent = () => {
  if (_bootstrapCache !== undefined) return _bootstrapCache;

  const skillPath = path.join(athenaSkillsDir, 'athena-init', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    _bootstrapCache = null;
    return null;
  }

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const body = stripFrontmatter(fullContent);

  const toolMapping = `
**Tool Mapping for OpenCode:**
Athena skills use Claude Code tool names. Substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool (dispatch subagent) → OpenCode's \`@mention\` subagent system
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\`, \`Grep\`, \`Glob\` → your native tools

Use OpenCode's native \`skill\` tool to list and load Athena skills.
`.trim();

  _bootstrapCache = `<EXTREMELY_IMPORTANT>
You have Athena.

**The athena-init skill is loaded below — it is ALREADY ACTIVE; you are following it now. Do NOT re-load "athena-init" via the skill tool.**

${body}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

  return _bootstrapCache;
};

export const AthenaPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

  return {
    // Inject athena-init into every prompt so the framework is unmissable.
    'chat.params': async ({ model, provider }, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap) return;

      const existing = output.params.system || '';
      output.params.system = bootstrap + (existing ? '\n\n' + existing : '');
    },

    // Register the Athena skills directory in OpenCode config.
    'config.load': async (_input, output) => {
      const skillsPaths = Array.isArray(output?.config?.skills?.paths)
        ? output.config.skills.paths
        : [];
      if (!skillsPaths.includes(athenaSkillsDir)) {
        skillsPaths.push(athenaSkillsDir);
      }
      output.config = output.config || {};
      output.config.skills = output.config.skills || {};
      output.config.skills.paths = skillsPaths;
    },
  };
};

export default AthenaPlugin;
