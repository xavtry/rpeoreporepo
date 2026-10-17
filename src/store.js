const P = 'nova:';
export function load(key, fallback) {
  try { const v = localStorage.getItem(P + key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(P + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
export const favorites = () => { const v = load('favs', []); return Array.isArray(v) ? v : []; };
export const recents = () => { const v = load('recent', []); return Array.isArray(v) ? v : []; };
export function toggleFav(id) {
  const f = favorites(); const i = f.indexOf(id);
  i >= 0 ? f.splice(i, 1) : f.push(id); save('favs', f); return i < 0;
}
export function pushRecent(id) {
  save('recent', [id, ...recents().filter(x => x !== id)].slice(0, 30));
}
export const settings = () => ({ reducedMotion: false, saveSearches: false, ...load('settings', {}) });
