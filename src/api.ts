import type { Card, CardInput } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  listCards: () => request<Card[]>('/cards'),
  createCard: (input: CardInput) =>
    request<Card>('/cards', { method: 'POST', body: JSON.stringify(input) }),
  updateCard: (id: string, input: CardInput) =>
    request<Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteCard: (id: string) => request<void>(`/cards/${id}`, { method: 'DELETE' }),
};
