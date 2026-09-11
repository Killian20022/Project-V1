import type { GameState, SavedWord } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'Une erreur est survenue');
  }
  return response.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string) => request<{ accessToken: string; user: { email: string } }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) => request<{ accessToken: string; user: { email: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  progress: (token: string) => request<{ state: GameState } | null>('/progress', {}, token),
  saveProgress: (token: string, state: GameState) => request<{ state: GameState }>('/progress', { method: 'PUT', body: JSON.stringify({ state }) }, token),
  words: (token: string) => request<SavedWord[]>('/saved-words', {}, token),
  saveWord: (token: string, word: SavedWord) => request<SavedWord>('/saved-words', { method: 'POST', body: JSON.stringify(word) }, token),
  deleteWord: (token: string, id: string) => request<{ success: boolean }>(`/saved-words/${id}`, { method: 'DELETE' }, token),
};
