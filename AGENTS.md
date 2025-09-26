# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with workspaces in `packages/*`.
- `packages/plugin/`: Electron main (`src/main.ts`), preload (`src/preload.ts`), shared types (`src/shared.ts`), state (`src/store.ts`), builds to `dist/`.
- `packages/client/`: Web client wrapper (`src/index.ts`) with generated types in `src/generated/`, builds to `dist/`.
- Tests live under `packages/*/__tests__/` and `*.test.ts`.

## Build, Test, and Development Commands
- `npm run dev` — Rollup watch builds for plugin and client.
- `npm run build` — Full build: sync README, roll outputs, generate/copy types.
- `npm test` — Run Jest (ts-jest) across workspaces, writes coverage to `coverage/`.
- `npm run typecheck --workspaces` — TypeScript strict checks without emit.
- `npm run clean --workspaces` — Remove `dist/` outputs in each package.

## Coding Style & Naming Conventions
- Language: TypeScript (strict), target ES2020. Two-space indentation.
- Filenames: lowercase, concise (e.g., `main.ts`, `preload.ts`, `shared.ts`).
- Types/Interfaces: PascalCase; variables/functions: camelCase; constants: UPPER_SNAKE only when appropriate.
- IPC channels: namespace under `recall-desktop:*` (see `packages/plugin/src/shared.ts`).
- Prefer explicit types, narrow unions, and small, focused modules.

## Testing Guidelines
- Framework: Jest with ts-jest. Place tests in `__tests__/` and name `*.test.ts`.
- Mock `window.recallDesktop` for client tests and Electron/IPC for main process logic.
- Run `npm test`; coverage is collected from `packages/*/src/**/*.ts` (excluding d.ts and some indexes).

## Commit & Pull Request Guidelines
- Commits: short imperative subject (≤72 chars), optional body for rationale. Conventional Commits not required.
- PRs: include summary, linked issues, test plan, and logs/screenshots for ToDesktop Builder/plugin behavior when relevant.
- Required before merge: `npm run build` and `npm test` pass; types generate without errors.

## Security & Configuration Tips
- Keep Node/Electron access in main; expose only minimal, validated APIs via preload.
- Add new IPC by updating `shared.ts` → `main.ts` (ipcMain) → `preload.ts` → `client/src/index.ts`.
- Plugin preferences live in `packages/plugin/package.json` under `todesktop.preferences`; mirror changes in `store.ts`.
