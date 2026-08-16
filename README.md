# Code Review Agent

Automated pull request review agent built with strict TypeScript, Node.js 20+, and GitHub Actions.

## Stack

- TypeScript in strict mode with ESM output
- Node.js 20+
- `tsc` for production builds
- `tsx` for local development
- Vitest with V8 coverage
- ESLint with `eslint-plugin-llm-core`
- Prettier
- GitHub Actions CI
- Zod for environment validation

## Scripts

- `npm run dev -- doctor` - Validate required environment configuration.
- `npm run dev -- review-pr --owner <owner> --repo <repo> --pr <number>` - Run the starter CLI.
- `npm run build` - Compile production output to `dist/`.
- `npm run typecheck` - Run TypeScript without emitting files.
- `npm run test` - Run Vitest with coverage.
- `npm run lint` - Run ESLint.
- `npm run format` - Check formatting with Prettier.
- `npm run verify` - Run format, lint, typecheck, tests, and build.

## Getting Started

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and fill in the required values.
3. Run `npm install`.
4. Run `npm run verify`.

## Project Structure

- `src/cli.ts` - Starter CLI entrypoint.
- `src/config.ts` - Environment parsing and validation.
- `src/prompts/` - Prompt and guideline defaults.
- `src/review/` - Review prompt construction and baseline review behavior.
- `.github/workflows/ci.yml` - CI workflow for format, lint, test, and build checks.
