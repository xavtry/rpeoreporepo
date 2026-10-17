#!/usr/bin/env node
// Usage: node scripts/import-game.mjs --src <dir|file> --id my-game --title "My Game" --license MIT
//   [--entry index.html] [--type html5|swf|external] [--genre Arcade] [--tags a,b] [--description "..."]
//   [--attribution "..."] [--source-url URL] [--cover path/in/game/cover.png] [--dry-run]
import fs from 'node:fs'; import path from 'node:path';
const a = {}; const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); a[k] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i]; }
const die = m => { console.error('Error: ' + m); process.exit(1); };
const root = path.resolve(import.meta.dirname, '..'), manifestPath = path.join(root, 'data/games.json');
for (const r of ['src', 'id', 'title', 'license']) if (!a[r] || a[r] === true) die(`--${r} is required`);
if (!/^[a-z0-9-]+$/.test(a.id)) die('--id may only contain lowercase letters, digits and dashes');
if (/^(unknown|none|n\/a|\?)$/i.test(a.license)) die('Redistribution rights must be known. Use --type external to link instead of bundling.');
const type = a.type || (String(a.src).toLowerCase().endsWith('.swf') ? 'swf' : 'html5');
const src = path.resolve(a.src); if (!fs.existsSync(src)) die('source not found: ' + src);
const isFile = fs.statSync(src).isFile(), dest = path.join(root, 'games', a.id);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.some(g => g.id === a.id)) die(`id "${a.id}" already exists in the manifest (nothing overwritten)`);
if (fs.existsSync(dest)) die(`${dest} already exists (nothing overwritten)`);
const entry = isFile ? path.basename(src) : (a.entry || 'index.html');
if (!isFile && !fs.existsSync(path.join(src, entry))) die(`entry file "${entry}" not found in source. Pass --entry <file>.`);
const files = []; (function walk(p) { for (const f of fs.readdirSync(p, { withFileTypes: true })) { const fp = path.join(p, f.name); f.isDirectory() ? walk(fp) : files.push(fp); } })(isFile ? path.dirname(src) : src);
const toCopy = isFile ? [src] : files;
const rec = { id: a.id, title: a.title, description: a.description, genre: a.genre, tags: a.tags ? String(a.tags).split(',') : undefined,
  cover: a.cover ? `games/${a.id}/${a.cover}` : undefined, launchType: type, launchPath: `games/${a.id}/${entry}`,
  sourceUrl: a['source-url'], license: a.license, attribution: a.attribution };
Object.keys(rec).forEach(k => rec[k] === undefined && delete rec[k]);
console.log(`${a['dry-run'] ? '[dry run] would copy' : 'Copying'} ${toCopy.length} file(s) to games/${a.id}/`);
console.log('Manifest entry:\n' + JSON.stringify(rec, null, 2));
if (a['dry-run']) process.exit(0);
for (const f of toCopy) { const rel = isFile ? path.basename(f) : path.relative(src, f); const t = path.join(dest, rel); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(f, t, fs.constants.COPYFILE_EXCL); }
manifest.push(rec); fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Done. Add a line to docs/SOURCES_AND_LICENSES.md, then open the game in the player to test it.');
