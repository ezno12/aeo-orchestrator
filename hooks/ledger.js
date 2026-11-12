// AEO gate ledger hook (UserPromptSubmit; PostToolUse on the Agent tool). Node 16+, no dependencies.
// Appends hash-chained records to <project>/.aeo/gates.jsonl. Only this hook writes that file:
// the project settings deny Edit/Write/Bash on it, and the file is kept read-only between appends.
// Records are the evidence for gates: the user's own prompts (approvals) and the results of
// aeo:* agents (validator verdicts, reviewer reports). Each record carries the session and
// tool_use ids so runtime/claude-code/scripts/verify-gates.js can anchor it in Claude Code's transcripts.
// Never blocks the session: exits 0; prints only an additionalContext line with the record number.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
// Short record hash in the note. Claude Code stores the note in its session log, outside the project, so the
// verifier can detect records that were later removed or rewritten (verify-gates.js, "session-log references").
const ref = (r) => `[h:${r.hash.slice(0, 12)}]`;

// All text inside a tool_response, whatever its shape.
function textOf(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(textOf).join('\n');
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text;
    if (v.content !== undefined) return textOf(v.content);
    if (v.result !== undefined) return textOf(v.result);
  }
  return '';
}

function lock(file) {
  const end = Date.now() + 5000;
  for (;;) {
    try { return fs.openSync(file, 'wx'); } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - fs.statSync(file).mtimeMs > 10000) fs.unlinkSync(file); } catch (x) { /* raced */ }
      if (Date.now() > end) throw new Error('ledger lock timeout');
      const t = Date.now() + 25; while (Date.now() < t) { /* spin */ }
    }
  }
}

function append(aeo, rec) {
  const file = path.join(aeo, 'gates.jsonl');
  const lk = path.join(aeo, 'gates.lock');
  const fd = lock(lk);
  try {
    let prev = 'GENESIS', seq = 0;
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      if (lines.length) { const last = JSON.parse(lines[lines.length - 1]); prev = last.hash; seq = last.seq; }
      try { fs.chmodSync(file, 0o644); } catch (e) { /* best effort */ }
    }
    const body = Object.assign({ seq: seq + 1, prev }, rec);
    body.hash = sha(JSON.stringify(body));
    fs.appendFileSync(file, JSON.stringify(body) + '\n');
    try { fs.chmodSync(file, 0o444); } catch (e) { /* best effort */ }
    return body;
  } finally {
    fs.closeSync(fd);
    try { fs.unlinkSync(lk); } catch (e) { /* already gone */ }
  }
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '')); } catch (e) { return; }
  const project = process.env.CLAUDE_PROJECT_DIR || input.cwd;
  if (!project) return;
  const aeo = path.join(project, '.aeo');
  if (!fs.existsSync(aeo)) return;
  let run = null;
  try { run = JSON.parse(fs.readFileSync(path.join(aeo, 'state.json'), 'utf8')).current_run || null; } catch (e) { /* no state */ }

  const ev = input.hook_event_name;
  const base = { ts: new Date().toISOString(), session: input.session_id, run };
  let rec, note;
  if (ev === 'UserPromptSubmit') {
    const text = String(input.prompt || '');
    // Claude Code also delivers system-injected messages (background task notifications, reminders) through
    // this event. They can carry agent output, so they are recorded separately and can never count as approvals.
    // In the VS Code panel an <ide_…> note about the open file can precede the message; classify what follows it.
    // <agent-message> is a subagent hand-back delivered as a message (panel sessions), never the user's words.
    const body = text.replace(/^(\s*<ide_[a-z_]+>[\s\S]*?<\/ide_[a-z_]+>)+/, '');
    const injected = /^\s*(<(task-notification|system-reminder|local-command-|command-stdout|bash-|agent-message)|Another Claude session sent a message)/.test(body);
    rec = Object.assign(base, { kind: injected ? 'injected' : 'user_prompt', text: text.slice(0, 4000), text_sha256: sha(text) });
    note = (r) => injected ? `AEO gate ledger: system-injected message recorded as #${r.seq} ${ref(r)}; it is not a user approval.` : `AEO gate ledger: this user message is record #${r.seq} ${ref(r)}. Cite it as "approval_seq": ${r.seq} if it approves a gate.`;
  } else if (ev === 'PostToolUse' && (input.tool_name === 'Agent' || input.tool_name === 'Task')) {
    const ti = input.tool_input || {};
    const type = String(ti.subagent_type || '');
    if (!type.startsWith('aeo:')) return;
    const prompt = String(ti.prompt || '');
    const tr = input.tool_response || {};
    const out = textOf(tr);
    // An agent can be launched asynchronously without run_in_background (Claude Code may background it itself).
    const background = !!(ti.run_in_background || tr.isAsync || tr.status === 'async_launched');
    const task = (prompt.match(/^TASK\s+(\S+)/m) || [])[1] || null;
    // The agent's own verdict is its last line-anchored VERDICT line (reports may quote other tools' output).
    const verdicts = [...out.matchAll(/^VERDICT:\s*(PASS|FAIL|INCONCLUSIVE)\b/gm)];
    const verdict = verdicts.length ? verdicts[verdicts.length - 1][1] : null;
    const status = (out.match(/^STATUS\s+(\w+)/m) || [])[1] || null;
    rec = Object.assign(base, {
      kind: 'agent_result', agent_type: type, tool_use_id: input.tool_use_id || null, task,
      model_param: ti.model || null, model_resolved: tr.resolvedModel || null, background,
      verdict, status, checks: (out.match(/^CHECK .*$/gm) || []).slice(0, 40).map((l) => l.slice(0, 300)),
      prompt_sha256: sha(prompt), response_sha256: sha(out), response_chars: out.length,
      response_head: out.slice(0, 300),
    });
    note = (r) => background ? `AEO gate ledger: ${type} background launch recorded as #${r.seq} ${ref(r)}. It carries no result and cannot support a gate; gate evidence needs a foreground call.` : `AEO gate ledger: ${type} result recorded as #${r.seq} ${ref(r)}${verdict ? ` (VERDICT ${verdict})` : ''}. Cite it as "ledger_seq": ${r.seq} for the gate it supports.`;
  } else {
    return;
  }
  const r = append(aeo, rec);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: ev, additionalContext: note(r) } }));
}

try { main(); } catch (e) { /* never block the session */ }
process.exit(0);
