import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Tiny JSON-file backed store for cards.
 *
 * The whole file is read into memory once, and every mutation rewrites it
 * atomically (write to a temp file, then rename). Writes are serialized so
 * concurrent requests can't interleave and clobber each other.
 */
export class CardStore {
  #file;
  #cards = [];
  #writeQueue = Promise.resolve();

  constructor(dataDir) {
    this.#file = path.join(dataDir, 'cards.json');
  }

  async init() {
    await mkdir(path.dirname(this.#file), { recursive: true });

    let raw;
    try {
      raw = await readFile(this.#file, 'utf8');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    // Missing or blank file (e.g. created with `touch`): start fresh.
    if (!raw?.trim()) {
      this.#cards = [];
      await this.#persist();
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // Refuse to start rather than overwrite a file that may hold real data.
      throw new Error(`${this.#file} is not valid JSON (${err.message}). Fix or remove it.`);
    }
    // Accept either `{ cards: [...] }` or a bare array of cards.
    const cards = Array.isArray(parsed) ? parsed : parsed?.cards;
    this.#cards = Array.isArray(cards) ? cards : [];
  }

  list() {
    return this.#cards;
  }

  async create({ title, description, url }) {
    const now = new Date().toISOString();
    const card = { id: randomUUID(), title, description, url, createdAt: now, updatedAt: now };
    this.#cards.push(card);
    await this.#persist();
    return card;
  }

  async update(id, { title, description, url }) {
    const card = this.#cards.find((c) => c.id === id);
    if (!card) return null;
    Object.assign(card, { title, description, url, updatedAt: new Date().toISOString() });
    await this.#persist();
    return card;
  }

  async remove(id) {
    const index = this.#cards.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.#cards.splice(index, 1);
    await this.#persist();
    return true;
  }

  #persist() {
    const json = JSON.stringify({ version: 1, cards: this.#cards }, null, 2);
    const tmp = `${this.#file}.tmp`;
    this.#writeQueue = this.#writeQueue
      .catch(() => {})
      .then(async () => {
        await writeFile(tmp, json, 'utf8');
        await rename(tmp, this.#file);
      });
    return this.#writeQueue;
  }
}
