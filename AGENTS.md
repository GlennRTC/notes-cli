# Notes CLI

A tiny command-line notes app in TypeScript. Usage is the `USAGE` string in `src/cli.ts`
(`node src/cli.ts <command>`). Notes live in a JSON file (`NOTES_FILE`, default `notes.json`).
Node runs the TypeScript directly (type stripping), so there is no build step.

## Code layout
- `src/notes.ts`: the `Note` type (`id`, `text`, `created` as `YYYY-MM-DD`), `NotesError`, and pure
  functions that take and return note lists (`addNote`, `deleteNote`, format helpers, ...).
  Only `loadNotes` and `saveNotes` touch disk. New logic goes here.
- `src/cli.ts`: `run(argv, file, today) -> { code, out }` parses arguments, calls `notes.ts` and
  builds the output text. Only the `import.meta.main` block prints, reads the env and sets the exit
  code. Exit codes: 0 ok, 1 `NotesError`/bad JSON, 2 unknown command (usage).
- `test/notes.test.ts`: vitest. Unit tests call `notes.ts` directly; CLI tests call `run()` with a
  temp file (`mkdtempSync`) and a fixed date. Tests never read or write a real `notes.json`.

## Commands (run from the repo root; the factory uses the ones in factory.conf)
- Install: `npm ci`
- Test: `npm test` (`vitest run`). Must pass before any PR.
- Lint: `npm run lint` (`tsc --noEmit`, the type check). Must pass before any PR.
- Gate: `bash gates/no-new-deps.sh`. `src/` may import only `node:` built-ins and relative files.

## Conventions
- TypeScript, strict. Relative imports end in `.ts`. Only erasable syntax (no enums, no namespaces).
- Every behaviour change gets a vitest test in `test/`, written BEFORE the implementation.
- Keep functions under 30 lines. Nothing new can be installed: package.json is protected.
- Use synthetic data only. No real names, credentials or tokens in code, tests or fixtures.

## What must not change
- Existing tests. Add new ones; never edit or delete a test to make it pass. If a test looks wrong,
  report it and stop.
- Existing behaviour the tests pin: output strings, the `{ code, out }` shape of `run()` and the
  exit codes above. Extend them; do not alter them unless the issue says so.
- Protected files: `factory.sh`, `factory.conf`, `lib/`, `gates/`, `.claude/`, `package.json`,
  `package-lock.json`, `tsconfig.json`, `node_modules/` and this file.

## Factory rules
- Phase state lives in `.factory/` as markdown files. Never put plan or review text in code comments.
- Only the paths in SCOPE (factory.conf: `src/` and `test/`) may change. Everything else, including
  `dashboard/`, `doctor.sh` and `README.md`, is out of scope.
