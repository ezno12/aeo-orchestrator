#!/usr/bin/env node
// AEO cost report: per-task (agent) and per-workflow model usage and cost, read from
// Claude Code transcripts. Node 16+, no dependencies.
//
// usage:
//   node cost-report.js --project <project dir> [--session <id>]... [--since <ISO time>]
//                       [--out <file.md>] [--json <file.json>]
//
// Every figure is "computed (list price)" from runtime/claude-code/prices.json; the report
// says so. Per-message usage is deduplicated by message id (Claude Code writes one
// transcript line per content block, each repeating the same usage).
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

function args(argv) {
  const a = { session: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--project') { a.project = v; i++; }
    else if (k === '--session') { a.session.push(v); i++; }
    else if (k === '--since') { a.since = v; i++; }
    else if (k === '--out') { a.out = v; i++; }
    else if (k === '--json') { a.json = v; i++; }
    else if (k === '--prices') { a.prices = v; i++; }
  }
  if (!a.project) throw new Error('--project is required');
  return a;
}

const claudeDir = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
// Claude Code names a project's transcript folder after its path with every
// non-alphanumeric character replaced by '-'.
const projectSlug = (dir) => path.resolve(dir).replace(/[^A-Za-z0-9]/g, '-');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);
}

function priceFor(prices, model, promptTokens) {
  const m = prices.models[model];
  if (!m) return null;
  return m.tiers.find((t) => t.max_prompt_tokens === null || promptTokens <= t.max_prompt_tokens);
}

function usageOf(lines, since) {
  const seen = new Set();
  const out = [];
  for (const o of lines) {
    const msg = o.message;
    if (!msg || !msg.usage || !msg.model || msg.model === '<synthetic>') continue;
    if (since && o.timestamp && o.timestamp < since) continue;
    const key = msg.id || o.requestId || o.uuid;
    if (seen.has(key)) continue;
    seen.add(key);
    const u = msg.usage;
    const cc = u.cache_creation || {};
    const w1h = cc.ephemeral_1h_input_tokens || 0;
    const w5m = cc.ephemeral_5m_input_tokens != null ? cc.ephemeral_5m_input_tokens
      : Math.max(0, (u.cache_creation_input_tokens || 0) - w1h);
    out.push({
      model: msg.model,
      input: u.input_tokens || 0,
      output: u.output_tokens || 0,
      cacheRead: u.cache_read_input_tokens || 0,
      write5m: w5m,
      write1h: w1h,
    });
  }
  return out;
}

function cost(prices, rec) {
  const prompt = rec.input + rec.cacheRead + rec.write5m + rec.write1h;
  const p = priceFor(prices, rec.model, prompt);
  if (!p) return null;
  const m = prices.cache_multipliers;
  return (rec.input * p.input + rec.output * p.output + rec.cacheRead * p.input * m.read +
    rec.write5m * p.input * m.write_5m + rec.write1h * p.input * m.write_1h) / 1e6;
}

function sum(prices, recs) {
  const t = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, unpriced: 0, models: {} };
  for (const r of recs) {
    t.input += r.input; t.output += r.output; t.cacheRead += r.cacheRead; t.cacheWrite += r.write5m + r.write1h;
    const c = cost(prices, r);
    if (c === null) t.unpriced++; else t.cost += c;
    t.models[r.model] = (t.models[r.model] || 0) + 1;
  }
  return t;
}

function main() {
  const a = args(process.argv.slice(2));
  const prices = JSON.parse(fs.readFileSync(a.prices || path.join(__dirname, '..', 'prices.json'), 'utf8'));
  const tdir = path.join(claudeDir(), 'projects', projectSlug(a.project));
  if (!fs.existsSync(tdir)) throw new Error('no transcripts for project: ' + tdir);
  let sessions = a.session.length ? a.session
    : fs.readdirSync(tdir).filter((f) => f.endsWith('.jsonl')).map((f) => f.slice(0, -6));

  const tasks = [];
  for (const sid of sessions) {
    const main = path.join(tdir, sid + '.jsonl');
    if (fs.existsSync(main)) {
      const recs = usageOf(readJsonl(main), a.since);
      if (recs.length) tasks.push({ session: sid, agent: 'main-session', agentType: 'orchestrator', requested: '-', ...sum(prices, recs) });
    }
    const sub = path.join(tdir, sid, 'subagents');
    if (!fs.existsSync(sub)) continue;
    for (const f of fs.readdirSync(sub).filter((x) => x.endsWith('.jsonl'))) {
      const id = f.slice(0, -6);
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(sub, id + '.meta.json'), 'utf8')); } catch (e) { /* no meta */ }
      const recs = usageOf(readJsonl(path.join(sub, f)), a.since);
      if (!recs.length) continue;
      tasks.push({ session: sid, agent: id, agentType: meta.agentType || '?', description: meta.description || '',
        requested: meta.model || '(default)', ...sum(prices, recs) });
    }
  }

  const total = tasks.reduce((t, x) => ({ cost: t.cost + x.cost, input: t.input + x.input, output: t.output + x.output,
    cacheRead: t.cacheRead + x.cacheRead, cacheWrite: t.cacheWrite + x.cacheWrite }), { cost: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  const byModel = {};
  for (const x of tasks) for (const m of Object.keys(x.models)) byModel[m] = (byModel[m] || 0) + x.models[m];

  // The requested alias (meta.model) is compared with the models on the agent's own messages.
  // meta.pickedEffortModel is NOT the agent's model (it is the model that picked the effort level).
  const aliasToId = { haiku: prices.tiers_to_models.economy, sonnet: prices.tiers_to_models.balanced, opus: prices.tiers_to_models.premium, fable: 'claude-fable-5-2' };
  const mismatches = tasks.filter((x) => aliasToId[x.requested] && Object.keys(x.models).some((m) => m !== aliasToId[x.requested]));
  const md = [];
  md.push('# AEO cost report', '');
  md.push(`Basis: computed (list price, ${prices.as_of}) from Claude Code transcripts. Token budgets are advisory; nothing here is enforced.`, '');
  if (mismatches.length) {
    md.push('**Requested vs actual model mismatches:**');
    for (const x of mismatches) md.push(`- ${x.agentType} ${x.agent}: requested ${x.requested}, ran on ${Object.keys(x.models).join(', ')}`);
    md.push('');
  }
  md.push('| Session | Agent | Type | Requested | Actual model(s) | Input | Output | Cache read | Cache write | Cost (USD) |');
  md.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const x of tasks) {
    md.push(`| ${x.session.slice(0, 8)} | ${x.agent} | ${x.agentType} | ${x.requested} | ${Object.keys(x.models).join(', ')} | ${x.input} | ${x.output} | ${x.cacheRead} | ${x.cacheWrite} | ${x.cost.toFixed(6)}${x.unpriced ? ` (+${x.unpriced} unpriced msgs)` : ''} |`);
  }
  md.push('', `**Workflow total:** ${total.cost.toFixed(6)} USD · input ${total.input} · output ${total.output} · cache read ${total.cacheRead} · cache write ${total.cacheWrite}`);
  md.push('', '**Messages by model:** ' + Object.entries(byModel).map(([m, n]) => `${m} ${n}`).join(' · '));
  const text = md.join('\n') + '\n';
  if (a.out) fs.writeFileSync(a.out, text); else process.stdout.write(text);
  if (a.json) fs.writeFileSync(a.json, JSON.stringify({ tasks, total, byModel, mismatches: mismatches.map((x) => x.agent) }, null, 2));
}

try { main(); } catch (e) { process.stderr.write('cost-report: ' + e.message + '\n'); process.exit(1); }
