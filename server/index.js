import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CardStore } from './store.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(rootDir, 'data'));
const DIST_DIR = path.join(rootDir, 'dist');

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 300;
const MAX_URL = 2048;

/** Validates and normalizes a card payload. Returns `{ value }` or `{ error }`. */
function parseCard(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';

  if (!title) return { error: 'Title is required.' };
  if (title.length > MAX_TITLE) return { error: `Title must be ${MAX_TITLE} characters or fewer.` };
  if (description.length > MAX_DESCRIPTION) {
    return { error: `Description must be ${MAX_DESCRIPTION} characters or fewer.` };
  }
  if (!rawUrl) return { error: 'URL is required.' };
  if (rawUrl.length > MAX_URL) return { error: 'URL is too long.' };

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: 'URL is not valid.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: 'URL must start with http:// or https://.' };
  }

  return { value: { title, description, url: url.href } };
}

const store = new CardStore(DATA_DIR);
await store.init();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/cards', (_req, res) => {
  res.json(store.list());
});

app.post('/api/cards', async (req, res) => {
  const { value, error } = parseCard(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(await store.create(value));
});

app.put('/api/cards/:id', async (req, res) => {
  const { value, error } = parseCard(req.body);
  if (error) return res.status(400).json({ error });
  const card = await store.update(req.params.id, value);
  if (!card) return res.status(404).json({ error: 'Card not found.' });
  res.json(card);
});

app.delete('/api/cards/:id', async (req, res) => {
  const removed = await store.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Card not found.' });
  res.status(204).end();
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// In production the server also hosts the built frontend.
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false, maxAge: '1h' }));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error.' : err.message });
});

const server = app.listen(PORT, () => {
  console.log(`Home Portal listening on http://localhost:${PORT} (data: ${DATA_DIR})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
