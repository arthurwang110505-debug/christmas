# Christmas Wonderland 2026

The digital heart of a cozy Christmas home: a live countdown, four atmospheres, a full-screen
ambient player with synthesised sound, an Advent calendar, a family wall, letters from Santa,
a music box and a wallpaper/card studio. English and Traditional Chinese.

## Run it

```bash
npm install
cp .env.example .env      # optional – see below
npm run dev               # http://localhost:3000
npm run build && npm start
```

Deploys to Vercel as a standard Next.js app.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Dashboard: countdown, daily greeting and quote, atmosphere selector |
| `/ambient` | Ambient Player: five scenes, sound, clock/countdown overlay, full screen, hide controls |
| `/tv` | The same player tuned for a TV: large type, arrow-key (remote) navigation, rotating scenes |
| `/advent` | Advent calendar; doors unlock at local midnight on 1–25 December 2026 |
| `/wall` | Family wall: notes, wishes, photo gallery, optional Home Sync |
| `/santa` | Chat, greetings and bedtime stories from Santa |
| `/music` | Playlist, loop, volume, ambience mixer |
| `/wallpapers` | Personalised wallpapers (iPhone, iPad, desktop/TV) and greeting cards |

## Cost and licensing

- **Audio** is generated in the browser with the Web Audio API. The carols are traditional
  public-domain melodies stored as note data; two pieces are original. No recordings are shipped.
- **Images** in `public/scenes` were generated for this project.
- No paid API is required for anything.

## Where data lives

- Settings, opened Advent doors and wall notes: `localStorage` on each device.
- Photos: IndexedDB on each device (never uploaded).
- **Home Sync (optional):** on the Wall page a family can create a 12-character home code and
  enter it on their other devices. Notes are then stored in PostgreSQL (`DATABASE_URL`) and kept in
  step across devices (polled every 15 s). Tables are created automatically on first use. Anyone
  holding the code can read and write that wall, so it should only be shared within the family.
  If the database is unreachable the wall keeps working locally and retries later.

## Optional AI Santa

Santa works out of the box from built-in letters and stories. To have a language model write the
replies instead, set these **server-side** variables (any OpenAI-compatible endpoint):

```
SANTA_AI_API_KEY=...
SANTA_AI_MODEL=...            # the model name at your provider
SANTA_AI_BASE_URL=...         # optional, defaults to https://api.openai.com/v1
```

The key never reaches the browser. If the provider fails, Santa quietly falls back to the
built-in letters.

## Project layout

```
src/app            routes, API handlers, global styles
src/components     Dashboard, AmbientPlayer, AdventCalendar, FamilyWall, Santa, MusicPlayer, …
src/lib            time & countdown logic, scenes, stores, i18n
src/lib/audio      synth engine and song data
src/lib/content    Advent doors, quotes, Santa's letters
src/db             Drizzle schema (Home Sync)
```
