#!/usr/bin/env node
// Summarise a Claude Code `-p --output-format stream-json --verbose` run plus its transcripts.
// usage: node analyze.js <stream.jsonl> [--json]
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const file = process.argv[2];
const asJson = process.argv.includes('--json');
const L = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((x) => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
const init = L.find((o) => o.type === 'system' && o.subtype === 'init') || {};
const result = L.find((o) => o.type === 'result') || {};

const toolUses = [];
for (const o of L) {
  if (o.type !== 'assistant' || !o.message || !Array.isArray(o.message.content)) continue;
  for (const c of o.message.content) if (c.type === 'tool_use') toolUses.push({ name: c.name, input: c.input, parent: o.parent_tool_use_id || null, model: o.message.model });
}
const toolResults = {};
for (const o of L) {
  if (o.type !== 'user' || !o.message || !Array.isArray(o.message.content)) continue;
  for (const c of o.message.content) if (c.type === 'tool_result') toolResults[c.tool_use_id] = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
}

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const slug = (init.cwd || '').replace(/[^A-Za-z0-9]/g, '-');
const subDir = path.join(claudeDir, 'projects', slug, init.session_id || 'none', 'subagents');
const subagents = [];
if (fs.existsSync(subDir)) {
  for (const f of fs.readdirSync(subDir).filter((x) => x.endsWith('.meta.json'))) {
    let meta = {};
    try { meta = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8')); } catch (e) { /* skip */ }
    const t = path.join(subDir, f.replace(/\.meta\.json$/, '.jsonl'));
    const models = new Set();
    if (fs.existsSync(t)) for (const line of fs.readFileSync(t, 'utf8').split('\n')) { try { const m = JSON.parse(line).message; if (m && m.model && m.model !== '<synthetic>') models.add(m.model); } catch (e) { /* skip */ } }
    // meta.pickedEffortModel is the model that chose the effort level, not the agent's model.
    subagents.push({ agentType: meta.agentType, requested: meta.model || '(default)', actualModels: [...models], description: meta.description });
  }
}

const mainModels = [...new Set(L.filter((o) => o.type === 'assistant' && o.message && !o.parent_tool_use_id).map((o) => o.message.model))];
const out = {
  session: init.session_id,
  cwd: init.cwd,
  mainModel: init.model,
  mainMessageModels: mainModels,
  plugins: (init.plugins || []).map((p) => p.source || p.name),
  skills: init.skills || [],
  slashCommands: init.slash_commands || [],
  agents: init.agents || [],
  hooksStarted: [...new Set(L.filter((o) => o.subtype === 'hook_started').map((o) => o.hook_name || o.hook_event))],
  hookResponses: L.filter((o) => o.subtype === 'hook_response').map((o) => ({ name: o.hook_name, outputChars: JSON.stringify(o).length })),
  skillCalls: toolUses.filter((t) => t.name === 'Skill').map((t) => t.input && (t.input.skill || t.input.command || t.input.name)),
  agentCalls: toolUses.filter((t) => t.name === 'Agent' || t.name === 'Task').map((t) => ({ type: t.input.subagent_type, model: t.input.model || null })),
  bashCalls: toolUses.filter((t) => t.name === 'Bash').map((t) => t.input.command),
  permissionDenials: (result.permission_denials || []).map((d) => ({ tool: d.tool_name, input: d.tool_input && (d.tool_input.command || d.tool_input.file_path) })),
  subagents,
  result: { subtype: result.subtype, isError: result.is_error, turns: result.num_turns, costUSD: result.total_cost_usd, text: (result.result || '').slice(0, 600) },
  modelUsage: Object.fromEntries(Object.entries(result.modelUsage || {}).map(([k, v]) => [k, { in: v.inputTokens, out: v.outputTokens, costUSD: v.costUSD }])),
  toolResultsWithErrors: Object.values(toolResults).filter((t) => /error|denied|not allowed|limit/i.test(t)).map((t) => t.slice(0, 300)),
};
if (asJson) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
else {
  for (const [k, v] of Object.entries(out)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    process.stdout.write(`${k}: ${s && s.length > 1500 ? s.slice(0, 1500) + '…' : s}\n`);
  }
}
