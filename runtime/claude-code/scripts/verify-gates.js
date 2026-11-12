// Verifies the AEO gate ledger (.aeo/gates.jsonl) and every gate that .aeo/state.json claims.
// Usage: node verify-gates.js --project <dir> [--transcripts <~/.claude/projects>] [--report <seq>]
// Prints one line per check: LEDGER <name>: PASS | FAIL | INCONCLUSIVE · <evidence>. Exit 1 on any FAIL.
// --report <seq> prints that agent's full recorded report after checking it against the ledger (validator check 5).
// Read-only. Used by aeo:workflow-validator (core/validation.md check 15).
//
// It reads Claude Code's own session logs (~/.claude/projects/<project>/<session>.jsonl and
// <session>/subagents/agent-<id>.jsonl). Their format is not a documented interface; see
// runtime/claude-code/ledger.md for the fields used and the versions tested. Where a log cannot be read
// as expected, the affected check is INCONCLUSIVE or FAIL, never PASS.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const project = path.resolve(arg('--project', '.'));
const tdir = arg('--transcripts', path.join(os.homedir(), '.claude', 'projects'));
const TESTED_VERSIONS = ['2.1.322'];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const squash = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const out = []; let failed = false;
const say = (name, verdict, ev) => { out.push(`LEDGER ${name}: ${verdict} · ${ev}`); if (verdict === 'FAIL') failed = true; };
const textOf = (v) => v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.map(textOf).join('\n') : typeof v === 'object' ? (typeof v.text === 'string' ? v.text : v.content !== undefined ? textOf(v.content) : v.result !== undefined ? textOf(v.result) : '') : '';
const readJsonl = (p) => { const bad = []; const L = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch (e) { bad.push(i + 1); return null; } }).filter(Boolean); return { L, bad }; };

// 1. Chain integrity.
const file = path.join(project, '.aeo', 'gates.jsonl');
let recs = [];
if (!fs.existsSync(file)) say('ledger present', 'FAIL', `${file} missing`);
else {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  let prev = 'GENESIS', ok = true;
  lines.forEach((l, i) => {
    let r; try { r = JSON.parse(l); } catch (e) { ok = false; say('chain', 'FAIL', `line ${i + 1} is not JSON`); return; }
    const { hash, ...body } = r;
    if (r.seq !== i + 1) { ok = false; say('chain', 'FAIL', `line ${i + 1} has seq ${r.seq} (records removed or reordered)`); }
    if (r.prev !== prev) { ok = false; say('chain', 'FAIL', `#${r.seq} prev does not match #${r.seq - 1}`); }
    if (sha(JSON.stringify(body)) !== hash) { ok = false; say('chain', 'FAIL', `#${r.seq} content was altered (hash mismatch)`); }
    prev = hash; recs.push(r);
  });
  if (ok) say('chain', 'PASS', `${recs.length} records, hashes and links intact`);
}
const bySeq = new Map(recs.map((r) => [r.seq, r]));

// Session logs.
const sessCache = new Map();
function session(id) {
  if (sessCache.has(id)) return sessCache.get(id);
  let found = null;
  try {
    for (const d of fs.readdirSync(tdir)) {
      const p = path.join(tdir, d, id + '.jsonl');
      if (fs.existsSync(p)) { found = { dir: path.join(tdir, d), L: readJsonl(p).L }; break; }
    }
  } catch (e) { /* no transcripts dir */ }
  sessCache.set(id, found); return found;
}
const transcript = (id) => { const s = session(id); return s && s.L; };
// The log entry that holds an agent's tool result. Claude Code also writes api-request copies without
// toolUseResult, so take the entry that carries it.
function resultEntry(r) {
  const T = transcript(r.session); if (!T) return null;
  return T.find((o) => o.toolUseResult && o.message && Array.isArray(o.message.content) && o.message.content.some((c) => c.type === 'tool_result' && c.tool_use_id === r.tool_use_id)) || null;
}

// 2. Anchors in Claude Code's transcripts.
// The VS Code panel adds <ide_…> notes (the open file, a selection) to the hook's copy of a message, but not
// always to the copy in the session log; they are context, not the message.
const noIde = (s) => String(s || '').replace(/<ide_[a-z_]+>[\s\S]*?<\/ide_[a-z_]+>/g, '');
const INJECTED = /^\s*(<(task-notification|system-reminder|local-command-|command-stdout|bash-|agent-message)|Another Claude session sent a message)/;
const normPrompt = (s) => squash(noIde(s).replace(/<command-message>[\s\S]*?<\/command-message>/g, '')
  .replace(/<command-name>\s*([\s\S]*?)\s*<\/command-name>\s*(?:<command-args>([\s\S]*?)<\/command-args>)?/g, (m, n, a) => `${n} ${a || ''}`));
function anchor(r) {
  const T = transcript(r.session);
  if (!T) return ['INCONCLUSIVE', `transcript for session ${r.session} not found`];
  if (r.kind === 'user_prompt' || r.kind === 'injected') {
    const want = squash(noIde(r.text)).slice(0, 500);
    // A message that arrives while the session is busy (a task notification, or a user message typed meanwhile)
    // is stored as a queued_command attachment instead of a user entry.
    const hit = T.some((o) => (o.type === 'user' && o.message && o.message.role === 'user' && !textOf(o.message.content).includes('tool_use_id') && normPrompt(textOf(o.message.content)).includes(want))
      || (o.type === 'attachment' && o.attachment && o.attachment.type === 'queued_command' && normPrompt(textOf(o.attachment.prompt)).includes(want)));
    return hit ? ['PASS', 'user message found in transcript'] : ['FAIL', 'no matching user message in the session transcript'];
  }
  if (r.kind === 'agent_result') {
    if (!r.tool_use_id) return ['INCONCLUSIVE', 'no tool_use_id'];
    let use = null, res = null;
    for (const o of T) for (const c of (o.message && Array.isArray(o.message.content) ? o.message.content : [])) {
      if (c.type === 'tool_use' && c.id === r.tool_use_id) use = c;
      if (c.type === 'tool_result' && c.tool_use_id === r.tool_use_id) res = c;
    }
    if (!use) return ['FAIL', `tool_use ${r.tool_use_id} not in transcript`];
    if (use.input && use.input.subagent_type !== r.agent_type) return ['FAIL', `transcript says ${use.input.subagent_type}, ledger says ${r.agent_type}`];
    if (!res) return ['INCONCLUSIVE', 'result not flushed to transcript yet'];
    // The transcript wraps a hand-back preamble around the report (after any <tools-used-before-summary> block),
    // so compare the report body, not its very first characters.
    const head = squash(String(r.response_head).replace(/^\s*<tools-used-before-summary>[\s\S]*?<\/tools-used-before-summary>/, '')).slice(0, 150);
    return squash(textOf(res.content)).includes(head) ? ['PASS', 'agent call and result found in transcript'] : ['FAIL', 'transcript result differs from ledger record'];
  }
  return ['FAIL', `unknown record kind ${r.kind}`];
}
const anchored = new Map();
for (const r of recs) { const a = anchor(r); anchored.set(r.seq, a[0]); if (a[0] !== 'PASS') say(`anchor #${r.seq}`, a[0], a[1]); }
if (recs.length) say('anchors', [...anchored.values()].includes('FAIL') ? 'FAIL' : [...anchored.values()].includes('INCONCLUSIVE') ? 'INCONCLUSIVE' : 'PASS', `${[...anchored.values()].filter((v) => v === 'PASS').length}/${recs.length} records anchored`);

// 3. Session-log references. The hook's note for each record ("record #N [h:<12 hex>]") is stored by
// Claude Code in the session log. A reference to a record the ledger no longer has, or to a record whose
// hash differs, means records were removed (also from the end) or rewritten. Detection only: anyone who can
// also edit the session logs can hide it.
const witnesses = []; const incomplete = [];
(function scanLogs() {
  const dirs = new Set();
  const slug = project.replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
  try { for (const d of fs.readdirSync(tdir)) if (d.toLowerCase() === slug) dirs.add(path.join(tdir, d)); } catch (e) { /* none */ }
  for (const r of recs) { const s = session(r.session); if (s) dirs.add(s.dir); }
  for (const d of dirs) for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.jsonl'))) {
    for (const o of readJsonl(path.join(d, f)).L) {
      const a = o.type === 'attachment' && o.attachment;
      if (!a || a.type !== 'hook_additional_context') continue;
      for (const s of [].concat(a.content || [])) {
        if (typeof s !== 'string' || !s.startsWith('AEO gate ledger:')) continue;
        const m = s.match(/#(\d+)/), h = s.match(/\[h:([^\]]*)\]/);
        if (!m) { incomplete.push(`${f}: "${s.slice(0, 80)}"`); continue; }
        witnesses.push({ seq: +m[1], h: h ? h[1] : null, session: o.sessionId, toolUse: a.toolUseID, file: f });
      }
    }
  }
})();
(function checkRefs() {
  const bad = [], unclear = [...incomplete];
  const seen = new Set();
  for (const w of witnesses) {
    seen.add(w.seq);
    const r = bySeq.get(w.seq);
    if (!r) { bad.push(`#${w.seq} is referenced in session log ${w.file} but missing from the ledger (${recs.length} records): records were removed`); continue; }
    if (w.h !== null) {
      if (!/^[0-9a-f]{12}$/.test(w.h)) { unclear.push(`#${w.seq}: incomplete hash reference "${w.h}" in ${w.file}`); continue; }
      if (r.hash.slice(0, 12) !== w.h) { bad.push(`#${w.seq} differs from the record referenced in ${w.file} (hash ${w.h}): records were removed or rewritten`); continue; }
    }
    // Older notes carry no hash; still bind them to their session and tool call.
    if (w.session && r.session && w.session !== r.session) bad.push(`#${w.seq} belongs to session ${r.session}, but session ${w.session} referenced it: records were removed and replaced`);
    else if (r.kind === 'agent_result' && w.toolUse && !String(w.toolUse).startsWith('hook-') && r.tool_use_id && w.toolUse !== r.tool_use_id) bad.push(`#${w.seq} is a different agent call than the one ${w.file} referenced: records were removed and replaced`);
  }
  for (const r of recs) if (!seen.has(r.seq) && transcript(r.session)) unclear.push(`#${r.seq} has no reference in its session log`);
  for (const b of bad) say('session-log reference', 'FAIL', b);
  for (const u of unclear) say('session-log reference', 'INCONCLUSIVE', u);
  const hashed = witnesses.filter((w) => w.h !== null).length;
  if (recs.length || witnesses.length) say('session-log references', bad.length ? 'FAIL' : unclear.length ? 'INCONCLUSIVE' : 'PASS', `${seen.size} referenced record(s), ${hashed} reference(s) with a hash, ${bad.length} contradicted, ${unclear.length} missing or incomplete`);
})();

// 4. Agent logs: work an agent did after its recorded result (SendMessage continuations, background work).
const WORKERS = /^aeo:(implementer|debugger)$/;
const MODIFY = /^(Edit|Write|MultiEdit|NotebookEdit|Bash|PowerShell)$/;
const VALIDATION = /\b(test|tests|spec|jest|vitest|pytest|mocha|verify|validate|lint|tsc)\b/i;
const versions = new Set(); const logCache = new Map();
function agentLog(r) {
  if (logCache.has(r.seq)) return logCache.get(r.seq);
  const res = (() => {
    const s = session(r.session); if (!s) return { ok: false, why: 'session log not found' };
    const e = resultEntry(r); if (!e) return { ok: false, why: 'agent result not in the session log' };
    const id = e.toolUseResult.agentId; if (!id) return { ok: false, why: 'agent result has no agentId (log format not recognised)' };
    const p = path.join(s.dir, r.session, 'subagents', `agent-${id}.jsonl`);
    if (!fs.existsSync(p)) return { ok: false, why: `agent log agent-${id}.jsonl not found` };
    const { L, bad } = readJsonl(p);
    if (bad.length) return { ok: false, why: `agent log has unreadable lines ${bad.slice(0, 3).join(',')}` };
    const acts = [];
    for (const o of L) {
      if (o.version) versions.add(o.version);
      if (o.type !== 'assistant') continue;
      const ts = Date.parse(o.timestamp);
      if (!o.message || !Array.isArray(o.message.content) || Number.isNaN(ts)) return { ok: false, why: 'agent log entry without a timestamp or content (log format not recognised)' };
      for (const c of o.message.content) if (c.type === 'tool_use') acts.push({ ts, name: c.name, cmd: String((c.input && (c.input.command || c.input.file_path)) || '') });
    }
    return { ok: true, id, acts };
  })();
  logCache.set(r.seq, res); return res;
}
const summarise = (acts) => { const e = acts.filter((a) => /Edit|Write|NotebookEdit/.test(a.name)).length, c = acts.length - e, v = acts.filter((a) => !/Edit|Write|NotebookEdit/.test(a.name) && VALIDATION.test(a.cmd)).length; return `${e} file edit(s), ${c} command(s) (${v} test/verification)`; };
for (const r of recs) {
  if (r.kind !== 'agent_result') continue;
  const L = agentLog(r); if (!L.ok) continue;
  const late = L.acts.filter((a) => a.ts > Date.parse(r.ts) && MODIFY.test(a.name));
  if (late.length) say(`continuation #${r.seq}`, 'PASS', `${r.agent_type} (task ${r.task || '-'}) ${r.background ? 'ran in the background after its launch record' : 'kept working after its recorded result'}: ${summarise(late)}. Not in the ledger; any gate whose validation predates this work is checked below`);
}
// Fresh-validation rule: work done by an implementer or debugger after a gate's validation makes that gate stale.
function freshness(evidence, workers) {
  const since = Math.max(...evidence.map((r) => Date.parse(r.ts)));
  const stale = [], unknown = [];
  for (const w of workers) {
    const L = agentLog(w);
    if (!L.ok) { unknown.push(`#${w.seq} ${w.agent_type}: ${L.why}`); continue; }
    const late = L.acts.filter((a) => a.ts > since && MODIFY.test(a.name));
    if (late.length) stale.push(`#${w.seq} ${w.agent_type} (task ${w.task || '-'}) did ${summarise(late)} after #${evidence.map((r) => r.seq).join(',')}`);
  }
  if (stale.length) return ['FAIL', `stale: ${stale.join('; ')}. Fresh validation required`];
  if (unknown.length) return ['INCONCLUSIVE', `cannot tell whether agents kept working after #${evidence.map((r) => r.seq).join(',')}: ${unknown.join('; ')}`];
  return null;
}

// 5. Report completeness (validator check 5): the full report is in the session log; it must match the
// ledger's sha256 and length (so it is neither truncated nor changed since it was recorded) and contain
// every label of the response contract (core/contracts.md).
const REQUIRED = ['TASK', 'STATUS', 'WORK DONE', 'FILES INSPECTED', 'FILES MODIFIED', 'METHODS USED', 'TESTS RUN', 'EVIDENCE', 'SHORTCUTS', 'NOT VERIFIED', 'PROBLEMS', 'REMAINING'];
const hasLabel = (t, f) => new RegExp('^[\\s>*#_|-]*' + f.replace(/ /g, '[ _]') + '\\b', 'm').test(t);
function report(r) {
  if (!transcript(r.session)) return ['INCONCLUSIVE', `session log for #${r.seq} not found`, null];
  if (!r.response_sha256 || r.response_chars == null) return ['INCONCLUSIVE', `#${r.seq} predates report hashing`, null];
  const e = resultEntry(r);
  if (!e) return ['FAIL', `#${r.seq}: no report in the session log (missing report)`, null];
  const t = textOf(e.toolUseResult);
  if (!t.trim() || r.response_chars === 0) return ['FAIL', `#${r.seq}: empty report (missing report)`, t];
  if (t.length !== r.response_chars || sha(t) !== r.response_sha256) return ['FAIL', `#${r.seq}: the report in the session log (${t.length} chars) is not the recorded one (${r.response_chars} chars, sha256 differs): truncated or changed after it was recorded`, t];
  const miss = REQUIRED.filter((f) => !hasLabel(t, f));
  const st = (t.match(/^[\s>*#_|-]*STATUS\b[*_:\s]*([A-Za-z]+)/m) || [])[1];
  if (st && st.toLowerCase() !== 'done' && !hasLabel(t, 'FAILURE CLASS')) miss.push('FAILURE CLASS (required when STATUS is not done)');
  if (miss.length) return ['FAIL', `#${r.seq}: incomplete response block, missing ${miss.join(', ')}`, t];
  return ['PASS', `#${r.seq}: complete response block, ${t.length} chars, matches the ledger's sha256`, t];
}

if (process.argv.includes('--report')) {
  const n = +arg('--report'); const r = bySeq.get(n);
  if (!r || r.kind !== 'agent_result') { console.log(`LEDGER report #${n}: FAIL · no agent result #${n} in the ledger`); process.exit(1); }
  const [v, ev, t] = report(r);
  console.log(`LEDGER report #${n}: ${v} · ${ev}`);
  if (t) console.log(`----- report #${n} (${r.agent_type}, task ${r.task || '-'}) -----\n${t}\n----- end of report #${n} -----`);
  process.exit(v === 'FAIL' ? 1 : 0);
}

// 6. Every gate that state.json claims must cite supporting records.
let state = {};
try { state = JSON.parse(fs.readFileSync(path.join(project, '.aeo', 'state.json'), 'utf8')); } catch (e) { say('state', 'FAIL', 'state.json unreadable'); }
const passed = (g) => g && (g === 'passed' || g.status === 'passed');
const seqs = (g) => [].concat(g && (g.approval_seq ?? g.ledger_seq) || []);
const HEDGED = /^(looks good|lgtm|fine|sure|ok(ay)?|sounds good|great|nice|yes|yep|go|go ahead|continue|proceed)[.! ]*$/i;
function need(label, g, test) {
  if (!passed(g)) return;
  const s = seqs(g);
  if (!s.length) return say(label, 'FAIL', 'claimed passed with no ledger record cited');
  const rs = s.map((n) => bySeq.get(n));
  if (rs.some((r) => !r)) return say(label, 'FAIL', `cites #${s.join(',')}, not all exist in the ledger`);
  if (rs.some((r) => anchored.get(r.seq) === 'FAIL')) return say(label, 'FAIL', `cited record not anchored in transcripts`);
  const [v, ev] = test(rs);
  say(label, v, `#${s.join(',')} ${ev}`);
}
// Run checks in order; the first that is not PASS decides.
const all = (...tests) => (rs) => { const ev = []; for (const t of tests) { const x = t(rs); if (!x) continue; if (x[0] !== 'PASS') return x; ev.push(x[1]); } return ['PASS', ev.join('; ')]; };
const approval = (rs) => {
  const r = rs[0];
  if (r.kind !== 'user_prompt') return ['FAIL', `cited record is ${r.kind}, not a message typed by the user`];
  // Classified again here, independently of the hook, so records written before a format was known are caught too.
  const t = squash(noIde(r.text));
  if (INJECTED.test(t)) return ['FAIL', 'cited record is a system-injected message (task notification, reminder or subagent hand-back), not a user approval'];
  if (!/\bapprov/i.test(t) || HEDGED.test(t)) return ['FAIL', `not an explicit approval: "${t.slice(0, 120)}"`];
  return ['PASS', `user approval: "${t.slice(0, 160)}" (validator: check class and scope wording, core/approvals.md)`];
};
const validatorPass = (id) => (rs) => {
  const r = rs.find((x) => x.kind === 'agent_result' && x.agent_type === 'aeo:workflow-validator');
  if (!r) return ['FAIL', 'no aeo:workflow-validator result cited'];
  if (r.background) return ['FAIL', 'validator ran in the background; its recorded result is not the verdict'];
  if (r.verdict !== 'PASS') return ['FAIL', `validator verdict ${r.verdict || 'missing'}`];
  if (id && !r.task) return ['FAIL', `validator result names no TASK (its contract had no TASK line), so it cannot be tied to ticket ${id}`];
  if (id && String(r.task) !== String(id) && !String(r.task).startsWith(String(id) + '-')) return ['FAIL', `validator ran for task ${r.task}, not ${id}`];
  return ['PASS', `validator PASS for task ${r.task}`];
};
// Ticket ids repeat across runs (every run has a ticket 01), so only this run's agents count.
const ofTicket = (id) => (r) => r.kind === 'agent_result' && WORKERS.test(r.agent_type) && (!state.current_run || r.run === state.current_run) && r.task && (String(r.task) === String(id) || String(r.task).startsWith(String(id) + '-'));
// Check 5: the report the cited validation judged (the ticket's latest implementer or debugger result before it)
// must be complete and unchanged. Workers that ran after the validation are covered by the freshness rule.
const ticketReport = (id) => (rs) => {
  const v = Math.max(...rs.map((r) => r.seq));
  const w = recs.filter((r) => ofTicket(id)(r) && !r.background && r.seq < v).pop();
  if (!w) return ['FAIL', `no implementer or debugger report recorded for ticket ${id} before validation #${v}`];
  const [verdict, ev] = report(w); return [verdict, `report ${ev}`];
};
const ticketFresh = (id) => (rs) => freshness(rs.filter((r) => r.kind === 'agent_result'), recs.filter(ofTicket(id)));
const releaseFresh = (rs) => freshness(rs.filter((r) => r.kind === 'agent_result'), recs.filter((r) => r.kind === 'agent_result' && WORKERS.test(r.agent_type) && (!state.current_run || r.run === state.current_run)));
// Gate 5: both per-slice review axes (Standards and Spec), foreground aeo:code-reviewer results,
// recorded after the latest implementer result that precedes them (so they reviewed the final code).
const sliceReview = (rs) => {
  const rev = rs.filter((r) => r.kind === 'agent_result' && r.agent_type === 'aeo:code-reviewer' && !r.background);
  if (rev.length < 2) return ['FAIL', `needs the Standards and Spec review results (${rev.length} foreground aeo:code-reviewer record(s) cited)`];
  const first = Math.min(...rev.map((r) => r.seq));
  const lastImpl = recs.filter((r) => r.kind === 'agent_result' && r.agent_type === 'aeo:implementer' && !r.background && r.seq < Math.max(...rev.map((x) => x.seq))).map((r) => r.seq);
  const latest = lastImpl.length ? Math.max(...lastImpl) : 0;
  if (first < latest) return ['FAIL', `review #${first} predates implementer result #${latest}: it did not review the final code`];
  return ['PASS', `reviews #${rev.map((r) => r.seq).join(',')} after implementer #${latest || '-'}`];
};
const reviewers = (required) => (rs) => {
  const got = rs.filter((r) => r.kind === 'agent_result' && !r.background).map((r) => r.agent_type);
  const miss = required.filter((t) => !got.includes(t));
  return miss.length ? ['FAIL', `missing foreground reports from ${miss.join(', ')}`] : ['PASS', `reports from ${got.join(', ')}`];
};
// Gate claims are checked wherever they sit in state.json (work_items[], a single work_item, tickets, …),
// so a schema variation can never hide a claim from verification.
const KNOWN = new Set(['1', '2', '2a', '3', '4', '5', '6', '7', '8', '9', '10']);
let claims = 0;
(function walk(o, where) {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (o.gates && typeof o.gates === 'object' && !Array.isArray(o.gates)) {
    const g = o.gates, label = o.id || o.ticket || o.title || where || "state";
    for (const k of Object.keys(g)) {
      if (!KNOWN.has(k)) { say(`${label} gate ${k}`, 'FAIL', 'unknown gate id'); continue; }
      if (passed(g[k])) claims++;
    }
    for (const k of ['1', '2', '2a', '10']) need(`${label} gate ${k}`, g[k], approval);
    const fan = !(g['7'] && g['7'].path === 'skip');
    if (fan) need(`${label} gate 7`, g['7'], all(reviewers(['aeo:code-reviewer', 'aeo:security-auditor', 'aeo:test-engineer']), releaseFresh));
    need(`${label} gate 8`, g['8'], all(fan ? reviewers(['aeo:security-auditor']) : validatorPass(null), releaseFresh));
    need(`${label} gate 9`, g['9'], all(validatorPass(null), releaseFresh));
    const tid = o.id || o.ticket || null;
    for (const k of ['3', '4', '6']) {
      if (passed(g[k]) && !tid) { say(`${label} gate ${k}`, 'FAIL', 'ticket gate claimed outside a ticket with an id (core/state-memory-audit.md schema)'); continue; }
      need(`${label} gate ${k}`, g[k], all(validatorPass(tid), ticketReport(tid), ticketFresh(tid)));
    }
    if (passed(g['5']) && !tid) say(`${label} gate 5`, 'FAIL', 'ticket gate claimed outside a ticket with an id (core/state-memory-audit.md schema)');
    else need(`${label} gate 5`, g['5'], all(sliceReview, ticketFresh(tid)));
  }
  for (const [k, v] of Object.entries(o)) if (k !== 'gates') walk(v, where ? `${where}.${k}` : k);
})(state, '');
say('claims found', 'PASS', `${claims} gate(s) claimed passed in state.json, each checked above`);
const untested = [...versions].filter((v) => !TESTED_VERSIONS.includes(v));
// Strict mode (--strict-version, or AEO_LEDGER_STRICT_VERSION=1 in the project settings' env): logs from a Claude Code
// version not yet tested make the result INCONCLUSIVE, so AEO stops until runtime/claude-code/ledger.md's re-test is done.
const strict = process.argv.includes('--strict-version') || process.env.AEO_LEDGER_STRICT_VERSION === '1';
if (versions.size) say('log format', untested.length && strict ? 'INCONCLUSIVE' : 'PASS', `agent logs read from Claude Code ${[...versions].join(', ')}${untested.length ? `; ${untested.join(', ')} not yet tested (tested: ${TESTED_VERSIONS.join(', ')})${strict ? '; strict mode: re-test before relying on this ledger' : '; structure checks passed'}, re-run evals/lib/ledger-tests.js on this version` : ''}`);
// The newest record. /aeo:deliver pins it in the pull request, outside this machine, so later rewriting is visible there.
if (recs.length) say('head', 'PASS', `#${recs[recs.length - 1].seq} ${recs[recs.length - 1].hash}`);
console.log(out.join('\n'));
console.log(`LEDGER VERDICT: ${failed ? 'FAIL' : out.some((l) => l.includes(': INCONCLUSIVE')) ? 'INCONCLUSIVE' : 'PASS'}`);
process.exit(failed ? 1 : 0);
