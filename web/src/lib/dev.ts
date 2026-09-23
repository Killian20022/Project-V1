import { useUser } from '@clerk/clerk-react';

// Compte du créateur du jeu : tout est débloqué (îles, rangs, quêtes) pour tester librement.
// La vraie progression (quêtes terminées, XP, or) n'est pas modifiée.
export const DEV_EMAIL = 'killianlopez20@gmail.com';

export function useIsDev() {
  const { user } = useUser();
  return user?.primaryEmailAddress?.emailAddress === DEV_EMAIL;
}
