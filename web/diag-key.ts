// Diagnostic de la clé API — n'affiche JAMAIS la clé, seulement ce qui permet de trancher.
//
//   bun diag-key.ts
//
// Sert à répondre à UNE question : le 401 vient-il de la clé, ou de l'environnement Claude Code ?
// La mémoire du projet le dit : `ANTHROPIC_BASE_URL` est exporté ici, le SDK le lit tout seul, et
// une clé parfaitement valide se fait alors rejeter. Deux clés ont déjà été révoquées pour rien à
// cause de ça. Donc : vérifier son propre environnement AVANT de soupçonner le compte.
const key = process.env.ANTHROPIC_API_KEY ?? '';

console.log('── Environnement ──');
console.log(`ANTHROPIC_BASE_URL        : ${process.env.ANTHROPIC_BASE_URL ? 'DÉFINI (passerelle)' : 'absent'}`);
console.log(`ANTHROPIC_AUTH_TOKEN      : ${process.env.ANTHROPIC_AUTH_TOKEN ? 'DÉFINI — il masquerait la clé' : 'absent'}`);
console.log(`ANTHROPIC_CUSTOM_HEADERS  : ${process.env.ANTHROPIC_CUSTOM_HEADERS ? 'défini' : 'absent'}`);

console.log('\n── Clé lue par Bun depuis web/.env ──');
if (!key) {
  console.log('✗ aucune clé — web/.env est vide ou mal nommé');
  process.exit(1);
}
// Pas la clé, pas même un fragment : seulement sa famille et sa taille. C'est tout ce dont on a
// besoin pour distinguer une clé de Console d'un jeton utilisateur.
const family = key.startsWith('sk-ant-api03-')
  ? 'sk-ant-api03- (clé de la Console — format attendu par l’API Messages)'
  : key.startsWith('sk-ant-usr-')
    ? 'sk-ant-usr- (jeton utilisateur)'
    : key.startsWith('sk-ant-')
      ? 'sk-ant-… (autre variante)'
      : 'format inconnu';
console.log(`famille  : ${family}`);
console.log(`longueur : ${key.length} caractères`);

// ── Le test décisif : un appel BRUT, sans SDK, droit sur api.anthropic.com ──
// Un `fetch` nu ne lit aucune variable d'environnement : si celui-ci répond 200 alors que le SDK
// répond 401, le problème est dans le SDK ou l'environnement, PAS dans la clé.
console.log('\n── Appel brut à api.anthropic.com (1 jeton, coût négligeable) ──');
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
});
const body = await res.text();
console.log(`statut : ${res.status} ${res.statusText}`);
console.log(`corps  : ${body.slice(0, 400)}`);

console.log('\n── Verdict ──');
if (res.ok) console.log('✓ La clé est VALIDE. Le 401 du générateur vient du SDK ou de l’environnement.');
else if (res.status === 401) console.log('✗ La clé est rejetée à la source : elle est invalide, révoquée, ou d’un format que l’API Messages n’accepte pas.');
else console.log(`? Réponse inattendue (${res.status}) — lire le corps ci-dessus.`);
