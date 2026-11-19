# gta6-cover-art-studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/AdeAgent/gta6-cover-art-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/AdeAgent/gta6-cover-art-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Slant Six Studio — a GTA-style cover art maker that runs entirely in the browser, offline. Drop in your own photos, arrange them across eight multi-panel layouts (the signature Slant Six leans every gutter on a diagonal), grade each panel from six sunset/neon colour grades, letter the cover with an extruded 3D title, a neon script subtitle and procedural stickers, then export a print-ready PNG in six post sizes — or all six at once as a zip. Per-panel crop, zoom, rotate and flip; one photo can fill a whole poster through automatic focus-point crops. Photos never leave your device: there is no upload and the app makes no network request. All artwork, lettering and marks are original to this studio; the fonts are the OFL-licensed Anton and Pacifico, bundled with their license.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in desktop Chrome
```

Hand the entry in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, which copies `app/` and `screenshots/` to the output directory and writes its `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5dn9fd7w&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
