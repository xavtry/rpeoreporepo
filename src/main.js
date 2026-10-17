import { favorites, recents, toggleFav, pushRecent, settings, load, save } from './store.js';

const $app = document.getElementById('app');
const TABS = [['home', 'Home'], ['games', 'Games'], ['favorites', 'Favorites'], ['recent', 'Recently Played'], ['search', 'Search']];
let games = [], config = {}, loadError = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => games.find(g => g.id === id);
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const cover = g => g.cover
  ? `<img src="${esc(g.cover)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${esc(g.title[0] || '?')}'}));">`
  : esc(g.title[0] || '?');
const coverStyle = g => `background:linear-gradient(135deg,hsl(${hue(g.id)} 60% 35%),hsl(${(hue(g.id) + 50) % 360} 55% 18%))`;

async function boot() {
  document.body.classList.toggle('reduce', settings().reducedMotion);
  try {
    [games, config] = await Promise.all([
      fetch('data/games.json').then(r => { if (!r.ok) throw new Error('games.json: HTTP ' + r.status); return r.json(); }),
      fetch('data/config.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]);
  } catch (e) { loadError = e.message; }
  addEventListener('hashchange', render);
  render();
}

function nav(active) {
  return `<nav aria-label="Main"><div class="logo">NOVA<b>HUB</b></div>
  <div class="tabs">${TABS.map(([k, l]) => `<button class="tab" data-go="${k}" ${k === active ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</div>
  <button class="iconbtn" data-go="search" aria-label="Search">⌕</button>
  <button class="iconbtn" data-go="settings" aria-label="Settings">⚙</button></nav>`;
}

function card(g, sel) {
  const fav = favorites().includes(g.id);
  return `<div class="cardwrap" style="position:relative;flex:0 0 auto"><button class="card ${sel ? 'sel' : ''}" data-open="${esc(g.id)}" aria-label="${esc(g.title)}">
    <div class="cover" style="${coverStyle(g)}">${cover(g)}</div><div class="t">${esc(g.title)}</div>${g.genre ? `<div class="g">${esc(g.genre)}</div>` : ''}</button>
    <button class="fav" data-fav="${esc(g.id)}" aria-pressed="${fav}" aria-label="Favorite ${esc(g.title)}">${fav ? '★' : '☆'}</button></div>`;
}
const row = (title, list) => list.length ? `<h2>${esc(title)}</h2><div class="row" role="list">${list.map(g => card(g)).join('')}</div>` : '';
const empty = msg => `<div class="empty">${msg}</div>`;

function hero(g) {
  if (!g) return `<section class="hero"><h1>Your library is empty</h1><p>Add a game with the import script. See the README.</p></section>`;
  const bg = g.background || g.cover;
  return `<section class="hero" id="hero" ${bg ? `style="background-image:url('${esc(bg)}')"` : `style="${coverStyle(g)}"`}>
    <h1>${esc(g.title)}</h1><p>${esc(g.description || '')}</p>
    <div class="btns"><button class="btn primary" data-play="${esc(g.id)}">Play</button>
    <button class="btn" data-fav="${esc(g.id)}" aria-pressed="${favorites().includes(g.id)}">Add to favorites</button>
    <button class="btn" data-open="${esc(g.id)}">Details</button></div></section>`;
}

const views = {
  home() {
    const rec = recents().map(byId).filter(Boolean), fav = favorites().map(byId).filter(Boolean);
    const genres = [...new Set(games.map(g => g.genre).filter(Boolean))].sort();
    return hero(rec[0] || games[0]) +
      row('Recently played', rec) + row('Your favorites', fav) +
      genres.map(gn => row(gn, games.filter(g => g.genre === gn))).join('') +
      row('All games', games.slice(0, 40));
  },
  games() {
    const genres = [...new Set(games.map(g => g.genre).filter(Boolean))].sort();
    const tags = [...new Set(games.flatMap(g => g.tags || []))].sort();
    return `<h2>Games <small style="color:var(--dim)">(${games.length})</small></h2>
    <div class="bar"><input type="search" id="q" placeholder="Search titles" aria-label="Search titles">
    <select id="genre" aria-label="Genre"><option value="">All genres</option>${genres.map(x => `<option>${esc(x)}</option>`).join('')}</select>
    <select id="tag" aria-label="Tag"><option value="">All tags</option>${tags.map(x => `<option>${esc(x)}</option>`).join('')}</select>
    <select id="sort" aria-label="Sort"><option value="az">Title A–Z</option><option value="za">Title Z–A</option></select></div>
    <div id="results"></div>`;
  },
  favorites() {
    const l = favorites().map(byId).filter(Boolean);
    return `<h2>Favorites</h2>` + (l.length ? `<div class="grid">${l.map(g => card(g)).join('')}</div>` : empty('No favorites yet. Select the star on any game.'));
  },
  recent() {
    const l = recents().map(byId).filter(Boolean);
    return `<h2>Recently played</h2>` + (l.length ? `<div class="grid">${l.map(g => card(g)).join('')}</div>` : empty('Nothing played yet. Launch a game and it shows up here.'));
  },
  search() {
    const hist = settings().saveSearches ? load('searches', []) : [];
    const ql = config.search?.quickLinks || [];
    return `<div class="search-home"><h2>Search</h2>
    <form id="sform"><input type="search" id="sq" placeholder="Search the web or enter a URL" aria-label="Search or URL" autofocus><button class="btn primary">Search</button></form>
    <div id="sout" aria-live="polite"></div>
    ${ql.length ? `<h2>Quick links</h2><div class="btns">${ql.map(l => `<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(l.url)}">${esc(l.title)}</a>`).join('')}</div>` : ''}
    ${hist.length ? `<h2>Recent searches</h2><div class="btns">${hist.map(h => `<button class="btn" data-sq="${esc(h)}">${esc(h)}</button>`).join('')}</div>` : ''}</div>`;
  },
  settings() {
    const s = settings();
    return `<div class="search-home"><h2>Settings</h2>
    <label class="row2"><input type="checkbox" id="rm" ${s.reducedMotion ? 'checked' : ''}> Reduce motion</label>
    <label class="row2"><input type="checkbox" id="ss" ${s.saveSearches ? 'checked' : ''}> Remember recent searches</label>
    <div class="btns"><button class="btn" id="cf">Clear favorites</button><button class="btn" id="cr">Clear recently played</button><button class="btn" id="cs">Clear search history</button></div>
    <h2>About</h2><p style="color:var(--dim)">NOVA Hub is an original, PlayStation-inspired interface and is not affiliated with Sony. Game credits and licenses are in docs/SOURCES_AND_LICENSES.md and shown in each game's details.</p></div>`;
  }
};

function render() {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  if (hash.startsWith('play/')) return renderPlayer(decodeURIComponent(hash.slice(5)));
  const key = views[hash] ? hash : 'home';
  save('lastTab', key);
  $app.innerHTML = nav(TABS.some(t => t[0] === key) ? key : '') +
    `<main id="main">${loadError ? `<div class="err">Could not load the game catalog: ${esc(loadError)}. Serve this folder over HTTP (see README).</div>` : views[key]()}</main>`;
  if (key === 'games') wireGames();
  if (key === 'search') wireSearch();
  if (key === 'settings') wireSettings();
}

function wireGames() {
  let shown = 60;
  const draw = () => {
    const q = document.getElementById('q').value.trim().toLowerCase(), ge = document.getElementById('genre').value, tg = document.getElementById('tag').value;
    let l = games.filter(g => g.title.toLowerCase().includes(q) && (!ge || g.genre === ge) && (!tg || (g.tags || []).includes(tg)));
    l.sort((a, b) => a.title.localeCompare(b.title) * (document.getElementById('sort').value === 'za' ? -1 : 1));
    const out = document.getElementById('results');
    out.innerHTML = l.length ? `<div class="grid">${l.slice(0, shown).map(g => card(g)).join('')}</div>` +
      (l.length > shown ? `<p style="text-align:center"><button class="btn" id="more">Show more (${l.length - shown} left)</button></p>` : '')
      : empty('No games match. Try a different title, genre, or tag.');
    const more = document.getElementById('more'); if (more) more.onclick = () => { shown += 60; draw(); };
  };
  ['q', 'genre', 'tag', 'sort'].forEach(id => document.getElementById(id).addEventListener('input', () => { shown = 60; draw(); }));
  draw();
}

function classify(input) {
  const t = input.trim();
  if (/^https?:\/\//i.test(t)) { try { return { url: new URL(t).href }; } catch { return { error: 'That URL is not valid.' }; } }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !/\s/.test(t)) return { url: 'https://' + t };
  return { query: t };
}

function wireSearch() {
  const out = document.getElementById('sout');
  const run = async text => {
    const r = classify(text);
    if (!text.trim()) { out.innerHTML = empty('Enter something to search for.'); return; }
    if (r.error) { out.innerHTML = `<div class="err">${esc(r.error)}</div>`; return; }
    if (r.url) { out.innerHTML = `<p>Sites usually block embedding, so this opens in a new tab.</p><a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">Open ${esc(new URL(r.url).hostname)}</a>`; return; }
    if (settings().saveSearches) save('searches', [r.query, ...load('searches', []).filter(x => x !== r.query)].slice(0, 8));
    const s = config.search || {};
    const fb = (s.fallbackUrl || '').replace('{q}', encodeURIComponent(r.query));
    if (!s.jsonEndpoint) {
      out.innerHTML = `<div class="empty">No in-page search provider is configured (set <code>search.jsonEndpoint</code> in data/config.json to a SearXNG instance you control).<br><br>${fb ? `<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(fb)}">Search the web in a new tab</a>` : ''}</div>`; return;
    }
    out.innerHTML = '<p>Searching…</p>';
    try {
      const u = new URL(s.jsonEndpoint); u.searchParams.set('q', r.query); u.searchParams.set('format', 'json');
      const res = await fetch(u); if (!res.ok) throw new Error('HTTP ' + res.status);
      const items = ((await res.json()).results || []).filter(i => /^https?:\/\//.test(i.url));
      out.innerHTML = items.length ? `<div class="results">${items.slice(0, 15).map(i => `<a target="_blank" rel="noopener noreferrer" href="${esc(i.url)}"><strong>${esc(i.title)}</strong><small>${esc(i.url)}</small>${esc((i.content || '').slice(0, 180))}</a>`).join('')}</div>` : empty('No results found.');
    } catch (e) {
      out.innerHTML = `<div class="err">The search provider failed (${esc(e.message)}). It may be offline or blocking cross-origin requests.${fb ? ` <a href="${esc(fb)}" target="_blank" rel="noopener noreferrer">Search in a new tab instead</a>.` : ''}</div>`;
    }
  };
  document.getElementById('sform').onsubmit = e => { e.preventDefault(); run(document.getElementById('sq').value); };
  document.querySelectorAll('[data-sq]').forEach(b => b.onclick = () => { document.getElementById('sq').value = b.dataset.sq; run(b.dataset.sq); });
}

function wireSettings() {
  const set = (k, v) => save('settings', { ...settings(), [k]: v });
  document.getElementById('rm').onchange = e => { set('reducedMotion', e.target.checked); document.body.classList.toggle('reduce', e.target.checked); };
  document.getElementById('ss').onchange = e => { set('saveSearches', e.target.checked); if (!e.target.checked) save('searches', []); };
  document.getElementById('cf').onclick = () => { save('favs', []); alert('Favorites cleared.'); };
  document.getElementById('cr').onclick = () => { save('recent', []); alert('Recently played cleared.'); };
  document.getElementById('cs').onclick = () => { save('searches', []); alert('Search history cleared.'); };
}

function details(g) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-label="${esc(g.title)}"><div class="cover" style="${coverStyle(g)}">${cover(g)}</div><div>
  <h2 style="margin-top:0">${esc(g.title)}</h2><p>${esc(g.description || 'No description available.')}</p>
  <div>${g.genre ? `<span class="tag">${esc(g.genre)}</span>` : ''}${(g.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
  <div class="meta">${g.license ? 'License: ' + esc(g.license) + '<br>' : ''}${g.attribution ? esc(g.attribution) + '<br>' : ''}${g.sourceUrl ? `<a href="${esc(g.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">Source</a>` : (g.sourceRepository ? 'Source: ' + esc(g.sourceRepository) : '')}</div>
  <div class="btns"><button class="btn primary" data-play="${esc(g.id)}">Play</button><button class="btn" data-fav="${esc(g.id)}" aria-pressed="${favorites().includes(g.id)}">${favorites().includes(g.id) ? 'Remove favorite' : 'Add to favorites'}</button><button class="btn" data-close>Close</button></div></div></div>`;
  const close = () => { m.remove(); removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); if (e.target.closest('[data-play]')) close(); });
  addEventListener('keydown', esc_); document.body.appendChild(m); m.querySelector('.btn.primary').focus();
}

async function renderPlayer(id) {
  const g = byId(id);
  $app.innerHTML = `<div class="player"><header><button class="btn" id="back">← Back to library</button><h1>${esc(g?.title || 'Unknown game')}</h1>
  <button class="btn" id="info">Info</button><button class="btn" id="reload">Reload</button><button class="btn" id="fs">Fullscreen</button></header>
  <div class="stage" id="stage"><div class="msg" id="msg">Loading…</div></div></div>`;
  const stage = document.getElementById('stage'), msg = document.getElementById('msg');
  const fail = t => { msg.className = 'msg err'; msg.innerHTML = `<div><p>${esc(t)}</p><button class="btn" onclick="history.back()">Back to library</button></div>`; };
  document.getElementById('back').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/games');
  document.getElementById('fs').onclick = () => stage.requestFullscreen?.().catch(() => {});
  document.getElementById('info').onclick = () => g && details(g);
  document.getElementById('reload').onclick = () => renderPlayer(id);
  if (!g) return fail('This game is not in the catalog.');
  if (!g.launchPath) return fail('This game has no launch path in the manifest.');
  pushRecent(g.id);
  try {
    const head = await fetch(g.launchPath, { method: 'HEAD' });
    if (!head.ok) return fail(`Game file not found (${g.launchPath}, HTTP ${head.status}).`);
  } catch { return fail('Could not reach the game file. Check your connection or server.'); }
  if (g.launchType === 'swf') {
    try {
      if (!window.RufflePlayer) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = config.ruffleUrl || 'vendor/ruffle/ruffle.js'; s.onload = ok; s.onerror = () => no(); document.head.appendChild(s); });
      const p = window.RufflePlayer.newest().createPlayer(); stage.appendChild(p); p.load(g.launchPath); msg.remove();
    } catch { fail('Ruffle is not installed. Download its self-hosted build into vendor/ruffle/ (see README).'); }
  } else if (g.launchType === 'external') {
    window.open(g.launchPath, '_blank', 'noopener,noreferrer'); fail('This game opened in a new tab.');
  } else {
    const f = document.createElement('iframe');
    f.src = g.launchPath; f.title = g.title; f.allow = 'fullscreen; gamepad';
    f.setAttribute('sandbox', g.sandbox || 'allow-scripts allow-pointer-lock');
    f.onload = () => msg.remove(); stage.appendChild(f);
  }
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-open],[data-play],[data-fav]'); if (!t) return;
  if (t.dataset.go) location.hash = '#/' + t.dataset.go;
  else if (t.dataset.play) location.hash = '#/play/' + encodeURIComponent(t.dataset.play);
  else if (t.dataset.fav) {
    const on = toggleFav(t.dataset.fav);
    document.querySelectorAll(`[data-fav="${CSS.escape(t.dataset.fav)}"]`).forEach(b => { b.setAttribute('aria-pressed', on); if (b.classList.contains('fav')) b.textContent = on ? '★' : '☆'; });
    if (location.hash.includes('favorites')) render();
  } else if (t.dataset.open) { const g = byId(t.dataset.open); if (g) details(g); }
});
// Arrow-key focus movement inside carousels and grids
document.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key) || !e.target.classList?.contains('card')) return;
  const w = e.target.closest('.cardwrap'), n = e.key === 'ArrowRight' ? w.nextElementSibling : w.previousElementSibling;
  n?.querySelector('.card')?.focus();
});
// Hovering/focusing a card on Home updates the hero
document.addEventListener('focusin', e => {
  const c = e.target.closest?.('.row .card'); const h = document.getElementById('hero'); if (!c || !h) return;
  const g = byId(c.dataset.open); if (!g) return;
  h.querySelector('h1').textContent = g.title; h.querySelector('p').textContent = g.description || '';
  const bg = g.background || g.cover; h.style.backgroundImage = bg ? `url('${bg}')` : ''; if (!bg) h.style.cssText = coverStyle(g);
  h.querySelectorAll('[data-play],[data-open],[data-fav]').forEach(b => { for (const k of ['play', 'open', 'fav']) if (b.dataset[k]) b.dataset[k] = g.id; });
});
boot();
