# Witness Tree

A phenology journal that keeps the year as **growth rings**.

First lilac. First peeper. Ice-out on the pond you actually walk to. The day the maples turned, and whether they turned earlier than last year. Witness Tree is a small local-first book for that kind of noticing.

It is named for the surveyor’s witness tree: a living monument that holds a line on the land. You become one, for a place.

## Why this exists

Most tracking apps want streaks, dashboards, and a feed. Phenology is slower than that. It is a practice scientists and gardeners have used for centuries — and that climate researchers still use — to watch living time slip.

Witness Tree gives that practice a shape you can see at a glance: concentric years, marks for firsts / peaks / lasts, and an almanac that knows the sun, the moon, and roughly what ought to be happening around you.

No account. No server. No telemetry. The ledger lives in this browser (IndexedDB). Export a JSON backup or a CSV whenever you like.

## Features

- **The ring** — years as concentric growth rings. Click empty wood to date a new record.
- **Almanac** — sunrise and sunset for your station, day-length change, moon phase, seasonal “have you seen…?” prompts, and on-this-day from earlier rings.
- **Field log** — searchable, filterable observations with notes.
- **Library** — fifty temperate species and weather events, plus your own names.
- **Year comparison** — pin a specimen and see whether this year’s first was earlier or later.
- **Paper / lamp** — a daylight page and a night desk.
- **Sample station** — three invented years at a New England hollow, so the ring is alive on first look.
- **Hemispheres** — seasons and typical windows flip south of the equator.

Typical windows are rough northern-temperate (~40–45°N) ranges, not a field guide. Trust what you see.

## Run it

```bash
npm install
npm test
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

`dist/` is a static site. Drop it on any static host when you are ready to launch. Nothing in this repository deploys itself.

An optional browser smoke test (needs Chrome, and the preview server on port 4173):

```bash
npm run preview -- --host 127.0.0.1 --port 4173
npm run smoke
```

## Using it

1. Establish a station (a name and a point on Earth), or walk the sample hollow.
2. If you walked the sample, a banner at the top of the book lets you start your own station — that clears the invented records and returns you to setup.
3. Press **Log a first** or the `n` key.
4. Click a mark on the ring to pin it. Click an empty stretch of the ring to pre-date a record.

Keyboard: `1–5` views, `n` new, `/` search the log, `esc` close.

## Privacy

Observations never leave the device unless you export them. Location is used only to compute sun times and seasons, and only the coordinates you typed or allowed. There is no analytics SDK.

Clearing site data for this origin erases the ledger. Keep a JSON backup from **Station**.

## Stack

Vite, React, TypeScript. Sun and moon times are computed in-process from NOAA / Meeus approximations (no weather API). Tests cover the astronomy, the ring math, backups, and the sample ledger.

## Name

A *witness tree* (or bearing tree) stands beside a survey corner and testifies to where the line was. Some also survive as trees that have simply seen a lot. Both senses are intended.

Witness Tree is not affiliated with the USA National Phenology Network, Nature’s Notebook, or Project BudBurst. It is a private book that happens to speak their language.

## License

MIT. See `LICENSE`.
