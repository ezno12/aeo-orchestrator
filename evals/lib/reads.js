#!/usr/bin/env node
// Method-adherence check: did an agent actually open the files it must read?
// usage: reads.js <stream.jsonl> <who> <required path suffix>... [--before <ToolName>]
//   who: "main" (the orchestrator thread) or an agent type such as "aeo:debugger".
//   --before Edit: also require every file to be read before that agent's first call to that tool.
// Prints one line per required file and exits 1 if any is missing.
'use strict';
const fs = require('fs');
const args = process.argv.slice(2);
const bi = args.indexOf('--before');
const before = bi >= 0 ? args.splice(bi, 2)[1] : null;
const [stream, who, ...required] = args;
if (!stream || !who || !required.length) { console.error('usage: reads.js <stream.jsonl> <who> <path>... [--before Tool]'); process.exit(2); }

const L = fs.readFileSync(stream, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return {}; } });
// Agent tool_use ids of the requested type (stream-json tags subagent messages with parent_tool_use_id).
const parents = new Set();
for (const o of L) for (const x of (o.type === 'assistant' && o.message.content) || [])
  if (x.type === 'tool_use' && x.name === 'Agent' && x.input.subagent_type === who) parents.add(x.id);
if (who !== 'main' && !parents.size) { console.log(`READS ${who}: FAIL · agent never spawned`); process.exit(1); }

const calls = [];
const seen = new Set();
for (const o of L) {
  if (o.type !== 'assistant') continue;
  const mine = who === 'main' ? !o.parent_tool_use_id : parents.has(o.parent_tool_use_id);
  if (!mine) continue;
  for (const x of o.message.content || []) if (x.type === 'tool_use' && !seen.has(x.id)) { seen.add(x.id); calls.push(x); }
}
// A Read counts only if its tool_result is not an error (a denied or failed Read opened nothing).
const failed = new Set();
for (const o of L) for (const x of (o.type === 'user' && Array.isArray(o.message && o.message.content) && o.message.content) || [])
  if (x.type === 'tool_result' && x.is_error) failed.add(x.tool_use_id);
const norm = (p) => String(p || '').replace(/\\/g, '/').toLowerCase();
const firstBefore = before ? calls.findIndex((c) => c.name === before) : -1;
let ok = true;
for (const req of required) {
  const tries = calls.filter((c) => c.name === 'Read' && norm(c.input.file_path).endsWith(norm(req)));
  const i = calls.findIndex((c) => tries.includes(c) && !failed.has(c.id));
  let v = i >= 0 ? 'PASS' : 'FAIL';
  if (v === 'PASS' && firstBefore >= 0 && i > firstBefore) v = 'FAIL';
  if (v === 'FAIL') ok = false;
  const why = i < 0 ? (tries.length ? ` · ${tries.length} Read attempt(s), all failed or denied` : ' · never read') : v === 'FAIL' ? ` · read after the first ${before}` : ` · call ${i + 1} of ${calls.length}`;
  console.log(`READS ${who} ${req}: ${v}${why}`);
}
process.exit(ok ? 0 : 1);
