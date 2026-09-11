# CLAUDE.md — EnglishQuest

EnglishQuest is now a pnpm monorepo. The active frontend is React + TypeScript + Vite in `apps/web`. The backend is NestJS + TypeScript + Prisma in `apps/api`, backed by PostgreSQL.

Read `AGENTS.md` and `README.md` before editing. The root `index.html` is the legacy application and source for generated curriculum, sentence, and CSS files. Do not add new product behavior there unless it must also be extracted into the React app.

Preserve the localStorage keys `eq_v4` and `eq_words` for existing users. Before delivery, run `pnpm typecheck` and `pnpm build`. Fetch `origin/main` before starting because several coding agents may work on the repository.
