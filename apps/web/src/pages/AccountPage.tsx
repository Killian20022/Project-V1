import { useState } from 'react';
import { api } from '../lib/api';

export function AccountPage({ token, email, onSignedIn, onSignedOut }: { token: string | null; email: string | null; onSignedIn: (token: string, email: string) => void; onSignedOut: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <section className="account-page"><div className="card account-card"><div className="account-avatar">EQ</div><h2 className="title">Ton compte</h2><p className="sub">Connecté avec {email ?? 'ton compte EnglishQuest'}. Ta progression est synchronisée.</p><button className="btn btn-ghost full" onClick={onSignedOut}>Se déconnecter</button></div></section>;

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('');
    try {
      const response = mode === 'login' ? await api.login(form.email, form.password) : await api.register(form.email, form.password);
      onSignedIn(response.accessToken, response.user.email);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Connexion impossible'); }
    finally { setLoading(false); }
  }

  return <section className="account-page"><form className="card account-card" onSubmit={submit}><div className="account-avatar">EQ</div><h2 className="title">{mode === 'login' ? 'Bon retour !' : 'Créer mon compte'}</h2><p className="sub">Synchronise ta progression sur tous tes appareils.</p><label className="field-label">E-mail<input className="text-input" type="email" required value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label><label className="field-label">Mot de passe<input className="text-input" type="password" minLength={8} required value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} /></label>{message && <div className="feedback no show">{message}</div>}<button className="btn btn-primary full" disabled={loading}>{loading ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}</button><button type="button" className="quiet-button account-switch" onClick={() => setMode(value => value === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Je n’ai pas encore de compte' : 'J’ai déjà un compte'}</button></form></section>;
}
