# Deployment
It is a static site. Deploy the repository root to GitHub Pages (Settings > Pages > deploy from branch, root), Netlify, Cloudflare Pages,
or any static host. All paths are relative, so it also works from a subpath. Game and Ruffle files are only fetched when a game is launched.
Mind repository size limits if you add many games. Keep `data/config.json` free of secrets: it is public.
