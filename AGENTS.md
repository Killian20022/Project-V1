# EnglishQuest contributor guide

The active application is the pnpm monorepo. Use React with TypeScript in `apps/web`, NestJS with TypeScript in `apps/api`, Prisma, and PostgreSQL. Do not add new behavior to the legacy root `index.html`; keep it only as a compatibility reference and source for the extraction tool.

Preserve localStorage keys `eq_v4` and `eq_words` so existing browser progress migrates. Keep curriculum and sentence changes in the legacy source, then run `node tools/extract-legacy-data.mjs` and commit the generated TypeScript files. Validate with `pnpm typecheck` and `pnpm build`.

Work on feature branches and fetch `origin/main` before editing because multiple coding agents may update the repository.
