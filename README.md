# Home Portal

A small self-hosted start page made of link cards. Click a card to open its link in a new tab. Cards are created, edited and deleted in the app itself and stored in a single JSON file.

- **Frontend:** React + Vite + TypeScript, using [Mantine](https://mantine.dev) in headless mode (`HeadlessMantineProvider`). All styling is in `src/styles.css`, applied through each component's `classNames`.
- **Backend:** a small Express server (`server/`) with a REST API that reads and writes `data/cards.json`. In production the same server also serves the built frontend, so it all runs as one container.

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Vite forwards `/api` requests to the Express server on port 3000. The server reloads itself when you change files in `server/`.

To run the production build locally:

```bash
npm run preview   # builds, then serves at http://localhost:3000
```

## Docker / Unraid

```bash
cp .env.example .env   # optional: set the port, data path and PUID/PGID
docker compose up -d --build
```

The portal is then at `http://<host>:8080`.

| Variable    | Default    | Purpose                                                          |
| ----------- | ---------- | ---------------------------------------------------------------- |
| `APP_PATH`  | `.`        | Folder with the source code and Dockerfile to build from         |
| `HOST_PORT` | `8080`     | Host port mapped to the container's port 3000                    |
| `DATA_PATH` | `./data`   | Host folder for `cards.json` (on Unraid: `/mnt/user/appdata/home-portal`) |
| `PUID`/`PGID` | `99`/`100` | User the container runs as (Unraid's `nobody:users`)           |
| `TZ`        | `Etc/UTC`  | Container timezone                                               |

To back up your cards, copy `cards.json` from the data folder.

## API

| Method | Path             | Body                             |
| ------ | ---------------- | -------------------------------- |
| GET    | `/api/cards`     | –                                |
| POST   | `/api/cards`     | `{ title, url, description? }`   |
| PUT    | `/api/cards/:id` | `{ title, url, description? }`   |
| DELETE | `/api/cards/:id` | –                                |
| GET    | `/api/health`    | –                                |

`title` and `url` are required. `url` must use http or https.

## Data format

```json
{
  "version": 1,
  "cards": [
    {
      "id": "uuid",
      "title": "Plex",
      "description": "Movies & TV",
      "url": "http://192.168.1.10:32400/web",
      "createdAt": "2026-10-01T00:00:00.000Z",
      "updatedAt": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

Every write replaces the file atomically (temp file + rename), so a crash mid-write can't corrupt it. All storage code is in `server/store.js`, so moving to SQLite or similar later only means changing that one file.
