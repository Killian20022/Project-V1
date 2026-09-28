import { useUser } from '@clerk/clerk-react';

// Compte du créateur du jeu : tout est débloqué (îles, rangs, quêtes, achats, réparations) pour
// tester librement, en local comme en ligne. La vraie progression (quêtes terminées, XP, or) n'est
// jamais modifiée — on lève seulement les verrous d'affichage et de coût.
//
// Pour t'ajouter une autre adresse (deuxième compte Google, alias…), ajoute-la simplement ici.
export const DEV_EMAILS = ['killianlopez20@gmail.com'];

const norm = (s?: string | null) => s?.trim().toLowerCase() ?? '';
const DEV_SET = new Set(DEV_EMAILS.map(norm));

/** Rétrocompatibilité : l'ancienne constante, au cas où un import traîne encore. */
export const DEV_EMAIL = DEV_EMAILS[0];

export function useIsDev(): boolean {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return false;

  // On regarde TOUTES les adresses du compte, pas seulement la principale : une connexion Google
  // range parfois l'adresse en secondaire (ou la principale n'est pas encore hydratée), et le
  // royaume se retrouvait verrouillé alors qu'on est bien connecté au bon compte.
  const mails = [
    user.primaryEmailAddress?.emailAddress,
    ...(user.emailAddresses ?? []).map((e) => e.emailAddress),
    ...(user.externalAccounts ?? []).map((a) => a.emailAddress),
  ];
  const found = mails.some((m) => DEV_SET.has(norm(m)));

  // Pas reconnu : on dit lesquelles on a vues. Sans ça, un compte non reconnu est indiscernable
  // d'un bug, et il n'y a aucun moyen de savoir quelle adresse ajouter à DEV_EMAILS.
  if (!found && !warned) {
    warned = true;
    const seen = [...new Set(mails.map(norm).filter(Boolean))];
    console.info('Scriptoria: compte non reconnu comme créateur. Adresses vues :', seen.length ? seen : '(aucune)');
  }
  return found;
}

let warned = false;
