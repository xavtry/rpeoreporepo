# Architecture
Plain ES modules, no bundler. `src/main.js` holds hash routing (`#/home`, `#/games`, `#/play/<id>`...), views, the player and search.
`src/store.js` wraps localStorage with try/catch and shape checks (favorites, recent, settings, search history; nothing sensitive).
`data/games.json` is the catalog; `data/config.json` holds Ruffle and search-provider settings. `scripts/import-game.mjs` adds games.
Untrusted games run in sandboxed iframes; Flash runs through Ruffle only when a game is launched.

## Not included: web proxy (Ultraviolet)
A browsing proxy is deliberately not built in. A proxy that fetches arbitrary sites for visitors is an open relay (SSRF and abuse risk),
and the usual purpose of such tools is bypassing network filters, which this project does not support. Ultraviolet is also a
separate Node service, not a front-end module. If you need proxying for hosts you are authorized to reach, run it as its own
service with an allowlist, private-IP blocking, rate limits and no public exposure, and link to it from `config.json`.
