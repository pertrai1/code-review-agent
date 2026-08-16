# AGENTS.md - code-review-agent

> What agents cannot infer from config files alone.

## Mission

Build and maintain an automated pull request review agent that:

- fetches GitHub pull request metadata and diffs
- reviews changes against configurable engineering guidelines
- uses LLMs for judgment-based feedback
- uses deterministic tooling for deterministic findings
- posts one clear, actionable review comment back to GitHub
- runs reliably inside GitHub Actions with retries, concurrency control, and observable failures

This repository is the implementation of the workflow described in `docs/REQUIREMENTS.md`.

## Development Workflow

Use requirement-driven, test-first delivery for any non-trivial change.

1. Read the source of truth first.
   Files to read before coding:
   `docs/REQUIREMENTS.md`, `tasks/tasks-code-review-agent.md`, `README.md`
2. Define the behavior slice you are changing.
   If the change is not already covered by the requirements or task list, update the relevant doc first.
3. Write or update tests before implementation when behavior changes.
   Prefer the smallest failing test that proves the requirement.
4. Implement the minimum code required to satisfy the test and requirement.
5. Run `npm run verify` before considering the task complete.
6. Update docs or task checkboxes when progress materially changes.
7. Update `AGENTS.md` when you discover durable project knowledge that future agents are likely to need and cannot reliably infer from config or code alone.
8. When a top-level task is completed, append a token-usage summary under that task in `tasks/tasks-code-review-agent.md`. Include provider or model plus prompt, completion, and total tokens when available; otherwise note that token usage was unavailable or that no model tokens were used.

### Completion Criteria

A task is not complete unless all of the following are true:

- the behavior is reflected in tests when an appropriate test layer exists
- `npm run verify` passes cleanly
- relevant docs and task tracking are updated
- important durable agent knowledge is captured in `AGENTS.md` when appropriate
- top-level tasks include a token-usage summary when token data exists or an explicit note when it does not
- no unrelated files were refactored or rewritten without a clear reason

## Project Context

This is a TypeScript/Node.js 20+ codebase for a GitHub-based code review agent.

Current architecture direction:

- TypeScript with strict type-checking and ESM modules
- GitHub Actions as the orchestrator
- small Node scripts for real logic instead of large inline workflow scripts
- Zod validation at environment and external-input boundaries
- Vitest for tests
- ESLint plus `eslint-plugin-llm-core` for static quality checks
- Prettier for formatting

The repository is still early-stage. Favor small, composable modules and keep public interfaces narrow.

## Commands

```bash
npm run dev -- doctor                                   # validate environment configuration
npm run dev -- review-pr --owner <owner> --repo <repo> --pr <number>

npm run build                                           # production compile to dist/
npm run clean                                           # remove dist/ and coverage/
npm run typecheck                                       # TypeScript only
npm run lint                                            # ESLint
npm run lint:fix                                        # ESLint autofix
npm run format                                          # Prettier check
npm run format:write                                    # Prettier write
npm run test                                            # Vitest with coverage
npm run test:watch                                      # Vitest watch mode
npm run verify                                          # format + lint + typecheck + test + build

npx vitest run src/config.test.ts                       # single test file
npx vitest run -t "loadEnvironment"                    # single test by name
```

## Code Style Rules

These conventions must be followed even when the compiler or formatter would allow alternatives.

### Imports

- Use `.js` extensions in relative imports.
- Group imports in this order with blank lines between groups:
  1. Node built-ins
  2. third-party packages
  3. local relative imports
  4. local type-only imports may stay with their source group

Example:

```ts
import { parseArgs } from 'node:util';

import { z } from 'zod';

import { loadEnvironment } from './config.js';
import type { ReviewRequest } from './types.js';
```

### Types and Validation

- Keep `strict` TypeScript clean. Do not weaken compiler settings.
- Validate external inputs with Zod at boundaries.
- Prefer `type` aliases for DTO-style shapes and unions in this codebase unless an interface is clearly better.
- Prefer narrowing over assertions.
- Do not use `any`, `@ts-ignore`, or `@ts-expect-error` unless the user explicitly asks and the reason is documented.

### Errors

- Fail loudly and with context.
- Prefer typed domain errors for operational failures that callers may need to handle.
- Do not swallow errors with empty `catch` blocks.
- Error messages should include the failing operation and enough context to debug CI failures quickly.

### Naming

- Files: `kebab-case.ts`
- Functions and variables: `camelCase`
- Types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Testing

- Keep tests close to the code they validate when practical, using `*.test.ts`.
- Test observable behavior, not implementation trivia.
- For prompt-building and aggregation logic, assert on structure and critical content rather than brittle full-string snapshots unless the full format is the requirement.

## Architecture Guidance

### Preferred Module Boundaries

Organize code by responsibility, not by external tool:

- `src/config.ts` - environment and runtime configuration
- `src/github/` - GitHub API access and payload normalization
- `src/llm/` - provider clients, retries, normalization
- `src/prompts/` - system prompts and guideline defaults
- `src/review/` - review orchestration, parsing, aggregation, severity ordering
- `src/workflow/` - workflow-facing entrypoints or adapters if needed
- `src/cli.ts` - local/manual entrypoint

### Review Agent Behavior

When implementing review logic:

- deterministic tool output wins over model guesswork
- do not report speculative bugs as facts
- skipped files must be explicit in output
- one combined PR comment is preferred over many fragmented comments unless the requirement changes
- severity ordering matters: CRITICAL before MAJOR before MINOR

### GitHub Actions Role

GitHub Actions is the orchestrator, not the business-logic container.

- Keep workflow YAML focused on triggers, permissions, concurrency, secrets, artifacts, and job wiring.
- Put parsing, provider logic, retry helpers, and aggregation in TypeScript.
- If YAML starts accumulating complex branching or JSON manipulation, move that logic into `src/`.

## Boundaries

### Always do

- read `docs/REQUIREMENTS.md` before implementing behavior tied to the PRD
- update `tasks/tasks-code-review-agent.md` checkboxes when work is completed
- append token-usage summaries to completed top-level tasks in `tasks/tasks-code-review-agent.md`
- run `npm run verify` after meaningful code changes
- preserve the strict TypeScript posture of the repo
- prefer minimal changes and narrow scopes

### Ask first

- adding a new third-party dependency
- changing the public CLI contract
- changing workflow trigger semantics or required secrets
- changing the task list structure in a way that alters planning expectations

### Never do

- inline large application logic into GitHub Actions YAML
- replace typed validation with unchecked object access at external boundaries
- commit secrets, tokens, sample live keys, or real webhook URLs
- mark task checkboxes complete without actually completing and verifying the work
- silently ignore failed API calls, parse errors, or provider errors

## Testing and Verification Expectations

For behavior changes, choose the narrowest relevant verification in addition to `npm run verify` when useful:

- prompt builder changes: targeted Vitest file
- config parsing changes: targeted Vitest file
- workflow-related script changes: targeted CLI run plus tests
- formatting and lint fixes: `npm run lint` and `npm run format`

If a command cannot be run, state that explicitly in the final handoff.

## Key Files

- `docs/REQUIREMENTS.md` - product requirements and step-by-step project goals
- `tasks/tasks-code-review-agent.md` - implementation task tracker
- `README.md` - developer setup and command reference
- `.github/workflows/ci.yml` - baseline CI verification workflow
- `.github/workflows/pr-review.yml` - main review workflow as it is introduced
- `src/` - TypeScript implementation

## Practical Defaults for Agents

- Prefer editing existing modules over creating new abstractions too early.
- Keep functions small, but do not split logic into helpers unless it improves clarity or reuse.
- When choosing between shell, workflow YAML, and TypeScript, prefer TypeScript for lasting logic.
- When uncertain whether something belongs in docs, include it if it changes developer workflow, runtime configuration, or review behavior.
