// AEO audit hook (PreToolUse, PostToolUse, PostToolUseFailure, PermissionDenied on Bash; SubagentStart, SubagentStop). Node 16+, no dependencies.
// Appends one JSON line to <project>/.aeo/runs/<run-id>/audit.jsonl. Does nothing outside
// AEO projects (no .aeo directory). Never blocks: always exits 0 and prints nothing.
'use strict';
const fs = require('fs');
const path = require('path');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (e) { return ''; }
}

function category(cmd) {
  const c = String(cmd || '');
  if (/(^|[;&|]\s*)git\s+(-C\s+\S+\s+)?push\b/.test(c)) return 'git-push';
  if (/(^|[;&|]\s*)git\s+(-C\s+\S+\s+)?(merge|rebase)\b/.test(c)) return 'git-merge';
  if (/(^|[;&|]\s*)git\s+(-C\s+\S+\s+)?commit\b/.test(c)) return 'git-commit';
  if (/(^|[;&|]\s*)git\s+(-C\s+\S+\s+)?(reset\s+--hard|clean\s+-f|branch\s+-D|checkout\s+\.|restore\s+\.)/.test(c)) return 'git-destructive';
  if (/(^|[;&|]\s*)git\b/.test(c)) return 'git';
  if (/(^|[;&|]\s*)(npm\s+(i|install|ci|add)|pnpm\s+(i|install|add)|yarn\s+(add|install)|pip\s+install|uv\s+(add|pip\s+install)|cargo\s+(add|install)|npx)\b/.test(c)) return 'dependency';
  if (/(^|[;&|]\s*)(vercel|netlify|fly|kubectl|terraform)\b/.test(c)) return 'deploy-tool';
  if (/(^|[;&|]\s*)claude\s+(plugin|config)\b/.test(c)) return 'claude-config';
  return 'other';
}

// Summarise a subagent transcript: models used and token totals (deduplicated by message id).
function summarise(file) {
  const out = { models: {}, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 };
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return null; }
  const seen = new Set();
  for (const line of text.split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch (e) { continue; }
    const m = o.message;
    if (!m || !m.usage || !m.model || m.model === '<synthetic>') continue;
    const key = m.id || o.uuid;
    if (seen.has(key)) continue;
    seen.add(key);
    out.messages++;
    out.models[m.model] = (out.models[m.model] || 0) + 1;
    out.input += m.usage.input_tokens || 0;
    out.output += m.usage.output_tokens || 0;
    out.cacheRead += m.usage.cache_read_input_tokens || 0;
    out.cacheWrite += m.usage.cache_creation_input_tokens || 0;
  }
  return out;
}

function agentFiles(input) {
  let t = input.agent_transcript_path;
  if (!t && input.transcript_path && input.agent_id) {
    t = path.join(input.transcript_path.replace(/\.jsonl$/, ''), 'subagents', 'agent-' + input.agent_id + '.jsonl');
  }
  if (!t) return {};
  return { transcript: t, meta: t.replace(/\.jsonl$/, '.meta.json') };
}

function main() {
  let input = {};
  try { input = JSON.parse(readStdin().replace(/^﻿/, '')); } catch (e) { return; }
  const project = process.env.CLAUDE_PROJECT_DIR || input.cwd;
  if (!project) return;
  const aeo = path.join(project, '.aeo');
  if (!fs.existsSync(aeo)) return;

  let run = 'adhoc';
  try { run = JSON.parse(fs.readFileSync(path.join(aeo, 'state.json'), 'utf8')).current_run || 'adhoc'; } catch (e) { /* no state */ }

  const rec = { ts: new Date().toISOString(), source: 'hook', event: input.hook_event_name, session: input.session_id };
  if (input.agent_id) rec.agent_id = input.agent_id;
  if (input.agent_type) rec.agent_type = input.agent_type;

  if (input.hook_event_name === 'PreToolUse' || input.hook_event_name === 'PostToolUse' || input.hook_event_name === 'PostToolUseFailure' || input.hook_event_name === 'PermissionDenied') {
    const cmd = input.tool_input && input.tool_input.command;
    rec.tool = input.tool_name;
    rec.command = String(cmd || '').slice(0, 2000);
    rec.category = category(cmd);
    const r = input.tool_response || {};
    if (typeof r.exitCode === 'number') rec.exit_code = r.exitCode;
    if (typeof r.interrupted === 'boolean') rec.interrupted = r.interrupted;
    if (input.hook_event_name === 'PreToolUse') rec.attempt = true;
    if (input.hook_event_name === 'PostToolUseFailure') rec.failed = true;
    if (input.hook_event_name === 'PermissionDenied') rec.denied = true;
  } else if (input.hook_event_name === 'SubagentStop') {
    const f = agentFiles(input);
    if (f.meta) {
      try {
        const meta = JSON.parse(fs.readFileSync(f.meta, 'utf8'));
        rec.agent_type = rec.agent_type || meta.agentType;
        rec.model_requested = meta.model || '(default)';
      } catch (e) { /* meta not written yet */ }
    }
    if (f.transcript) {
      const s = summarise(f.transcript);
      // The agent transcript is often not flushed yet when SubagentStop fires; per-agent
      // tokens and cost are then taken from runtime/claude-code/scripts/cost-report.js.
      if (s && s.messages > 0) rec.usage = s; else rec.usage_pending = true;
    }
  }

  const dir = path.join(aeo, 'runs', run);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'audit.jsonl'), JSON.stringify(rec) + '\n');
}

try { main(); } catch (e) { /* never block the session */ }
process.exit(0);
