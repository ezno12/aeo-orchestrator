// Self-containment and provenance check for AEO's methods.
// Usage: node evals/lib/selfcontained.js [upstreamCacheRoot]
// Exit 1 on any failure. With the plugin cache root (…/plugins/cache/aeo-sources), also re-hashes
// every upstream file and checks the licence copies are byte-identical.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const cache = process.argv[2];
const fails = [];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.name === '.git' || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = (f) => path.relative(root, f).split(path.sep).join('/');
const files = walk(root).filter((f) => /\.(md|json|js|sh|ya?ml|toml|txt)$/.test(f));
// Historical or provenance records may name pre-rename paths.
const HISTORY = /^(evals\/RESULTS\.md|methods\/MIGRATION-MAP\.json|methods\/MANIFEST\.json|evals\/lib\/selfcontained\.js)$/;
const CATS = 'discovery|specification|planning|architecture|testing|debugging|code-review|development|frontend|security|delivery|checklists|licenses';

// 1. AEO's own files must not route to upstream skill plugins.
const bad = /(mattpocock-skills|agent-skills):[a-z]|\/(mattpocock-skills|agent-skills):|"(mattpocock-skills|agent-skills)@/;
for (const f of files.filter((f) => !/^(methods\/|evals\/RESULTS\.md|evals\/lib\/selfcontained\.js)/.test(rel(f)))) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (bad.test(l)) fails.push(`upstream reference ${rel(f)}:${i + 1}: ${l.trim().slice(0, 120)}`); });
}

// 2. No pre-rename method paths outside historical records.
for (const f of files.filter((f) => !HISTORY.test(rel(f)))) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (/methods\/(matt|addy)\b|METHOD\.md/.test(l)) fails.push(`old method path ${rel(f)}:${i + 1}: ${l.trim().slice(0, 120)}`);
  });
}

// 3. Every methods/<category>/… path named anywhere exists.
const named = new RegExp(`methods/(?:${CATS})/[A-Za-z0-9_./-]*[A-Za-z0-9_-]`, 'g');
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(named)) {
  if (!fs.existsSync(path.join(root, m[0]))) fails.push(`missing path ${m[0]} (named in ${rel(f)})`);
}

// 4. Relative references inside methods/ resolve: markdown links and backticked ./ or ../ paths (anchors ignored).
// Known exception: upstream text names a file AEO deliberately does not ship.
const UNSHIPPED = new Set(['../../references/orchestration-patterns.md']);
let refs = 0;
for (const f of files.filter((f) => rel(f).startsWith('methods/') && f.endsWith('.md'))) {
  const body = fs.readFileSync(f, 'utf8').replace(/^(```|~~~)[\s\S]*?^\1/gm, ''); // links in code examples are illustrative
  const targets = [...body.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)].map((m) => m[1])
    .concat([...body.matchAll(/`(\.\.?\/[^`\s]+)`/g)].map((m) => m[1]));
  for (const t of targets) {
    const p = t.split('#')[0];
    if (!p || UNSHIPPED.has(p)) continue;
    refs++;
    if (!fs.existsSync(path.resolve(path.dirname(f), p))) fails.push(`broken reference ${rel(f)} -> ${t}`);
  }
}

// 5. Nothing under methods/ is discoverable as a skill.
for (const f of walk(path.join(root, 'methods'))) if (/^(SKILL|METHOD)\.md$/.test(path.basename(f))) fails.push(`skill-like file name: ${rel(f)}`);

// 6. Manifest: complete, provenance fields present, both hashes correct, licences byte-identical.
const man = JSON.parse(fs.readFileSync(path.join(root, 'methods/MANIFEST.json'), 'utf8'));
const listed = new Set(man.files.map((e) => e.aeo_path));
for (const f of walk(path.join(root, 'methods'))) {
  const r = rel(f);
  if (!/^methods\/(README\.md|MANIFEST\.json|MIGRATION-MAP\.json)$/.test(r) && !listed.has(r)) fails.push(`not in manifest: ${r}`);
}
const dirs = { matt: 'mattpocock-skills/1.3.2', addy: 'agent-skills/0.6.15' };
let hashed = 0;
for (const e of man.files) {
  for (const k of ['repository', 'commit', 'upstream_path', 'license', 'license_file', 'upstream_sha256', 'aeo_sha256', 'modifications']) if (!e[k]) fails.push(`manifest ${e.aeo_path}: missing ${k}`);
  if (!fs.existsSync(path.join(root, e.aeo_path))) { fails.push(`manifest file missing: ${e.aeo_path}`); continue; }
  if (e.license_file && !fs.existsSync(path.join(root, e.license_file))) fails.push(`licence file missing: ${e.license_file}`);
  const cur = sha(fs.readFileSync(path.join(root, e.aeo_path)));
  if (cur !== e.aeo_sha256) fails.push(`aeo_sha256 stale: ${e.aeo_path}`);
  if (e.role === 'license' && e.aeo_sha256 !== e.upstream_sha256) fails.push(`licence not byte-identical: ${e.aeo_path}`);
  if (cache) {
    const up = path.join(cache, dirs[e.source], e.upstream_path);
    if (!fs.existsSync(up)) fails.push(`upstream missing in cache: ${up}`);
    else if (sha(fs.readFileSync(up)) !== e.upstream_sha256) fails.push(`upstream hash differs: ${e.upstream_path}`);
    else hashed++;
  }
}

// 7. Migration map: every new path exists, every old path is gone.
const mig = JSON.parse(fs.readFileSync(path.join(root, 'methods/MIGRATION-MAP.json'), 'utf8'));
for (const m of mig.files) {
  if (!fs.existsSync(path.join(root, 'methods', m.new))) fails.push(`migration target missing: ${m.new}`);
  if (fs.existsSync(path.join(root, 'methods', m.old))) fails.push(`migration source still present: ${m.old}`);
}

// 8. Plugin manifest lists every agent file and nothing else.
const pj = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/plugin.json'), 'utf8'));
const agents = new Set(pj.agents.map((a) => a.replace(/^\.\//, '')));
for (const a of fs.readdirSync(path.join(root, 'agents'))) if (!agents.has('agents/' + a)) fails.push(`agent not listed in plugin.json: ${a}`);
for (const a of agents) if (!fs.existsSync(path.join(root, a))) fails.push(`plugin.json lists missing agent: ${a}`);

console.log(`files scanned ${files.length} · relative references ${refs} · manifest entries ${man.files.length} · upstream re-hashed ${hashed} · migration entries ${mig.files.length} · agents ${agents.size}`);
if (fails.length) { console.log('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS');
