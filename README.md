# NOVA Hub

A PlayStation-inspired personal game hub that runs in the browser. Original branding, no build step, no dependencies.
Tabs: Home, Games, Favorites, Recently Played, Search (plus Settings).

## Run locally
The app loads JSON, so it must be served over HTTP (opening index.html directly will not work):

    npm start                  # or: python3 -m http.server 5173
    # open http://localhost:5173

## Add your own games
You can only bundle games you have the right to redistribute (your own, or ones with an open license such as MIT or CC).
If rights are unclear, link to the game instead (step 4).

1. **HTML5 game folder.** Put the game in a folder that has its entry HTML file, then run:

       node scripts/import-game.mjs --src ~/my-game --id my-game --title "My Game" \
         --license MIT --genre Puzzle --tags singleplayer,keyboard \
         --description "One line about it." --attribution "By Me" --entry index.html --dry-run

   Remove `--dry-run` to do it for real. The script copies the folder to `games/my-game/`, adds an entry to `data/games.json`,
   and refuses to overwrite an existing id or folder. `--entry` is the game's real start file; it is not always index.html.
2. **Flash (.swf).** Same command with `--src game.swf` (type is detected). Download Ruffle's self-hosted build from ruffle.rs
   and unzip it into `vendor/ruffle/` so that `vendor/ruffle/ruffle.js` exists. Not every Flash game works in Ruffle.
3. **Cover art.** Add `--cover cover.png` (path relative to the game folder), or edit `data/games.json` and add `"cover"` and
   `"background"` paths (for example `assets/covers/my-game.png`). Missing art falls back to a colored tile.
4. **Link-only game.** Add an entry by hand with `"launchType": "external"` and `"launchPath": "https://..."`.
5. **Manual route.** Copy files into `games/<id>/` and add an object to `data/games.json` yourself. Fields:
   `id, title, description, genre, tags[], cover, background, launchType (html5|swf|external), launchPath, sourceUrl,
   sourceRepository, license, attribution, sandbox`.
6. Open the game in the app and test it, then add a row to `docs/SOURCES_AND_LICENSES.md`.

Games run in a sandboxed iframe (`allow-scripts allow-pointer-lock`). If a game needs localStorage or cookies, add
`"sandbox": "allow-scripts allow-pointer-lock allow-same-origin"` to its manifest entry. Only do that for games you trust.

## Search tab
The page distinguishes URLs from queries. URLs open in a new tab (most sites block embedding). For in-page results, point
`search.jsonEndpoint` in `data/config.json` at a SearXNG instance you control that has JSON output enabled and allows your origin.
Without it, the tab offers a link to a web search in a new tab. There is no proxy; see `docs/ARCHITECTURE.md`.

## Docs
`docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/SOURCES_AND_LICENSES.md`
