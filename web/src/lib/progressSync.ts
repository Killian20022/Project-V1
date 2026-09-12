import { createClient } from '@supabase/supabase-js';
import type { GameState } from '../types';

// Config Supabase (URL + clé publique — publiques par nature, protégées côté base).
const SUPABASE_URL = 'https://ibcktknjfbipxydzvajf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NnCHeVeTUVDzMwxGmJ8ZlA_WpP58a-r';

// On transmet le jeton de session Clerk à Supabase (intégration native).
// Quand l'utilisateur est connecté, Supabase le reconnaît → les règles RLS s'appliquent.
type ClerkWindow = { Clerk?: { session?: { getToken?: () => Promise<string | null> } } };

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  accessToken: async () => {
    try {
      const clerk = (window as unknown as ClerkWindow).Clerk;
      return (await clerk?.session?.getToken?.()) ?? null;
    } catch {
      return null;
    }
  },
});

export async function loadRemoteProgress(userId: string): Promise<GameState | null> {
  try {
    const { data, error } = await supabase.from('progress').select('state').eq('user_id', userId).maybeSingle();
    if (error || !data) return null;
    return (data.state as GameState) ?? null;
  } catch {
    return null;
  }
}

export async function saveRemoteProgress(userId: string, state: GameState) {
  try {
    await supabase
      .from('progress')
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch {
    /* silencieux : la sauvegarde locale reste le filet de sécurité */
  }
}
