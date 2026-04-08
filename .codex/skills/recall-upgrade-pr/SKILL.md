---
name: recall-upgrade-pr
description: Upgrade the Recall Desktop SDK in the ToDesktop Recall monorepo and publish the change as a draft GitHub PR. Use when the user asks to update `@recallai/desktop-sdk`, check the latest Recall changelog, align wrapper types or docs with upstream SDK changes, run validation, and create or update the PR for the upgrade.
---

# Recall Upgrade PR

Upgrade Recall in this repo as a small release-management workflow, not just a dependency bump. The repo mirrors parts of the upstream SDK surface, so version updates can require code, generated-type, test, and README changes.

## Workflow

1. Inspect the current state.
   Check `packages/plugin/package.json`, `packages/client/package.json`, `packages/plugin/src/shared.ts`, `packages/plugin/src/main.ts`, `packages/plugin/src/preload.ts`, `packages/client/src/index.ts`, and `README.md`.
   Run `git status --short` before editing.

2. Verify the latest upstream Recall release.
   Use `npm view @recallai/desktop-sdk version dist-tags --json`.
   Read the upstream changelog from the published package, for example by packing the target version and reading `CHANGELOG.md`.
   Do not guess about SDK behavior changes from memory.

3. Compare the current repo surface with the target SDK.
   Refresh `packages/client/src/generated/recallai-desktop-sdk.d.ts` via `npm run sync-sdk-types --workspace=@todesktop/client-recall`.
   Compare generated declarations against the mirrored wrapper types and event unions.
   Pay attention to event additions, permission changes, deprecations, and config shape changes.

4. Update the repo.
   Bump `@recallai/desktop-sdk` in both package manifests.
   Update package versions and the changelog section in the root `README.md` when the published packages change.
   Keep the root README authoritative, then run `npm run sync` so the package READMEs stay in sync.
   If upstream changes affect the wrapper contract, update:
   `packages/plugin/src/shared.ts`
   `packages/plugin/src/main.ts`
   `packages/plugin/src/preload.ts`
   `packages/client/src/index.ts`
   `packages/client/__tests__/client.test.ts`

## Repo Quirks

- `README.md` is copied into `packages/client/README.md` and `packages/plugin/README.md` by `npm run sync`.
- `packages/client/src/generated/recallai-desktop-sdk.d.ts` is copied from the upstream package by `packages/client/scripts/sync-sdk-types.cjs`.
- That sync script intentionally strips internal Recall `test*` hooks from the published client type surface. Preserve that behavior.
- `packages/client/src/generated/preload.d.ts` is regenerated from the plugin preload types with `npm run generate-types --workspace=@todesktop/plugin-recall`.
- `uploadRecording()` may remain for compatibility even if upstream treats it as a no-op; reflect upstream behavior honestly in wrapper messaging and docs.

## Validation

Run:

```bash
npm run build
npm test
npm run typecheck --workspace=@todesktop/plugin-recall
npm run typecheck --workspace=@todesktop/client-recall
npm run typecheck --workspace=@todesktop/recall-example
```

Do not rely on `npm run typecheck --workspaces` for this repo. `packages/backend` does not define a `typecheck` script, so the aggregate command fails for repo reasons unrelated to the Recall upgrade.

## PR Flow

If the user wants a PR:

1. Verify `gh auth status`.
2. If on `main`, create a branch like `codex/upgrade-recall-x-y-z`.
3. Stage only the Recall-upgrade files.
4. Commit with a short subject such as `Upgrade Recall SDK to 2.0.10`.
5. Push with tracking.
6. Open a draft PR.

In the PR body, include:

- the old and new Recall SDK versions
- any upstream changelog items that materially affect this wrapper
- whether wrapper types or docs changed
- the validation commands you ran
- the note that repo-wide workspace typecheck is currently broken because `packages/backend` lacks `typecheck`

## Output

When reporting back to the user, summarize:

- the SDK version change
- any API or doc behavior changes that were required
- validation status
- branch name and PR URL if created
