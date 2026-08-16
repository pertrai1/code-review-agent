## Relevant Files

- `docs/REQUIREMENTS.md` - Product requirements and step-by-step acceptance criteria for the code review agent challenge.
- `AGENTS.md` - Repository-specific engineering rules, workflow expectations, and architecture guidance for agents working in this codebase.
- `package.json` - Project scripts, runtime constraints, and dependency definitions for the TypeScript toolchain.
- `tsconfig.json` - Strict TypeScript configuration for development and typechecking.
- `tsconfig.build.json` - Production TypeScript build configuration for emitting `dist/` output.
- `eslint.config.js` - ESLint flat config, including `eslint-plugin-llm-core` and typed TypeScript rules.
- `vitest.config.ts` - Vitest test runner and coverage configuration.
- `.github/workflows/pr-review.yml` - Primary GitHub Actions workflow that will replace the fragile script and orchestrate review runs.
- `src/cli.ts` - Local entrypoint for `doctor` and `review-pr` commands and future workflow-invoked execution.
- `src/config.ts` - Environment parsing and validation for GitHub and model credentials.
- `src/config.test.ts` - Tests for required environment validation and defaults.
- `src/types.ts` - Shared domain types for pull request data, guidelines, and review results.
- `src/github/` - GitHub API access and pull request payload normalization as this functionality is implemented.
- `src/llm/` - Provider clients, retries, timeouts, and response normalization as model integration grows.
- `src/prompts/default-guidelines.ts` - Default guideline definitions for baseline review behavior.
- `src/review/build-review-prompt.ts` - Prompt construction logic for structured review requests.
- `src/review/build-review-prompt.test.ts` - Tests for prompt structure and required content.
- `src/review/review-pr.ts` - Baseline review orchestration and future aggregation logic.
- `src/review/review-pr.test.ts` - Tests for baseline review request shaping and placeholder review behavior.
- `src/workflow/` - Workflow-facing adapters or orchestration helpers if GitHub Actions logic is extracted from YAML.
- `prompts/` - Optional home for prompt templates if prompt content outgrows inline TypeScript constants.
- `Dockerfile.ruff` - Container image definition for running Ruff in a controlled environment, if a custom image is needed.
- `.github/actions/` - Optional location for composite actions if shared workflow logic grows beyond a single workflow file.
- `.github/workflows/pr-review-reusable.yml` - Optional reusable workflow extracted from the main workflow in later iterations.
- `README.md` - Project setup and usage documentation that should be updated as the workflow evolves.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use the repository’s actual test command: `npm run test` for the full Vitest suite with coverage, or `npx vitest run <path>` for targeted tests.
- Prefer small scripts over large inline workflow steps once the logic involves structured parsing, retries, or provider-specific behavior.
- Create a separate feature branch for each top-level task (`1.0`, `2.0`, and so on). Make atomic commits for the sub-tasks on that branch, merge it into `main` when the top-level task is complete, then create a new feature branch for the next top-level task.
- Task `0.0` is a repeatable workflow step that should be performed for each top-level task. Do not treat it as a one-time project milestone.
- When a top-level task is completed, append a short summary directly under that top-level task recording the token usage observed for that task. Include the provider or model, the prompt and completion token counts when available, and note when token usage could not be measured.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` -> `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

When you complete a top-level task, add a plain text summary line immediately below it in this format:

`Summary: token usage <provider/model> prompt=<n> completion=<n> total=<n>`

If the task did not invoke a model or token usage was unavailable, use:

`Summary: token usage unavailable` or `Summary: no model tokens used`

## Per-Task Workflow

Repeat this workflow for each top-level task before starting its sub-tasks:

1. Choose the next top-level task to implement and scope the branch to that task only.
2. Create and checkout a new branch for that task (for example `git checkout -b feature/task-2-baseline-review-script`).
3. Make atomic commits for the sub-tasks on that branch.
4. Merge the branch into `main` after the top-level task is complete.
5. Repeat this workflow for the next top-level task.

## Tasks

### Top-Level Tasks

- [ ] 1.0 Complete Step Zero environment setup and fixture validation
  - [ ] 1.1 Create or identify a target repository fork with the two pull requests described in `docs/REQUIREMENTS.md`
  - [ ] 1.2 Obtain a GitHub token with permission to read pull requests and write comments on the target repository
  - [ ] 1.3 Obtain at least one LLM provider API key for the initial implementation
  - [ ] 1.4 Confirm GitHub Actions is enabled on the target repository
  - [ ] 1.5 Execute a direct GitHub API request to `/pulls/{number}/files` and verify that changed files and patches are returned
  - [ ] 1.6 Record the fixture pull request numbers and the expected review findings to use throughout the project
- [ ] 2.0 Implement the fragile baseline pull request review script from Step 1
  - [x] 2.1 Choose the implementation language for the baseline script and set up the minimal runtime dependencies
  - [ ] 2.2 Extend `src/cli.ts` with a real `review-pr` path that accepts repository owner, repository name, and pull request number as inputs
  - [x] 2.3 Load and validate the GitHub token and model API key through `src/config.ts`
  - [ ] 2.4 Implement `src/github/` modules to fetch changed files from the GitHub API and normalize the diff payload needed for review
  - [x] 2.5 Define baseline review guidelines in `src/prompts/` and build the Step 1 prompt in `src/review/build-review-prompt.ts`
  - [ ] 2.6 Implement a minimal provider call in `src/llm/` and print the resulting review from `src/cli.ts`
  - [ ] 2.7 Run the script against the main fixture pull request and tune the prompt until the Stripe key is reliably identified
  - [ ] 2.8 Run the script with an invalid model API key and capture the observed failure mode as a baseline limitation
  - [ ] 2.9 Write down the known limitations of the fragile approach so later workflow steps can address them explicitly
- [ ] 3.0 Build the initial GitHub Actions workflow for pull request data collection from Step 2
  - [ ] 3.1 Create `.github/workflows/pr-review.yml` with a manual `workflow_dispatch` trigger
  - [ ] 3.2 Add workflow inputs for repository owner, repository name, and pull request number
  - [ ] 3.3 Add a workflow step that invokes the TypeScript GitHub-fetch path from `src/github/` and logs the relevant response data
  - [ ] 3.4 Add a second workflow step or shared command path that fetches pull request title and description through `src/github/`
  - [ ] 3.5 Make the fetched data available across later steps using outputs, environment files, artifacts, or a workflow adapter under `src/workflow/`
  - [ ] 3.6 Run the workflow manually from the Actions UI and verify the logs contain both diff data and pull request metadata
  - [ ] 3.7 Run the workflow a second time and confirm the run history records both executions and their inputs
- [ ] 4.0 Add LLM-based review generation and configurable guidelines from Step 3
  - [ ] 4.1 Keep review prompt construction in `src/review/build-review-prompt.ts` or `src/prompts/` instead of embedding large prompts directly in YAML
  - [ ] 4.2 Add workflow and CLI support for passing review guidelines as an input instead of hardcoding them in code
  - [ ] 4.3 Implement a `src/llm/` invocation path that sends the diff and pull request metadata to the chosen provider
  - [ ] 4.4 Require a structured response format containing Summary, Issues Found, Suggestions, and Verdict sections
  - [ ] 4.5 Parse or preserve the review output in `src/review/` or `src/workflow/` so it can be reused by later workflow steps
  - [ ] 4.6 Run the workflow against the main fixture pull request and verify the Stripe key is tagged CRITICAL and the nested conditionals are reported
  - [ ] 4.7 Change the guidelines input and rerun the workflow to confirm review behavior changes without editing the workflow code
- [ ] 5.0 Post review results back to GitHub with quiet-path behavior from Step 4
  - [ ] 5.1 Implement a `src/github/` comment-posting path and invoke it from the workflow to post the generated review to the GitHub issue comments endpoint
  - [ ] 5.2 Move credential usage to GitHub Actions secrets and use `GITHUB_TOKEN` where repository-local permissions are sufficient
  - [ ] 5.3 Add `src/review/` logic that detects when the review contains no actionable issues and skips comment posting
  - [ ] 5.4 Emit a clear log message from the workflow or `src/workflow/` adapter when the run chooses not to post a comment
  - [ ] 5.5 Run the workflow against the main fixture pull request and verify the comment appears on GitHub with readable formatting
  - [ ] 5.6 Run the workflow against the trivial spelling-fix pull request and verify no comment is posted
- [ ] 6.0 Make model provider selection interchangeable and benchmark providers from Step 5
  - [ ] 6.1 Refactor provider-specific model calls behind a small interface or configuration boundary in `src/llm/`
  - [ ] 6.2 Add `src/config.ts` and workflow configuration for switching models and providers without changing the surrounding workflow logic
  - [ ] 6.3 Integrate at least one second hosted provider and verify the workflow still produces a useful review
  - [ ] 6.4 Integrate a third provider or model endpoint, ideally via Ollama on a reachable endpoint or self-hosted runner
  - [ ] 6.5 Capture token usage, latency, and other provider response metadata in `src/llm/` and surface it in workflow logs or outputs
  - [ ] 6.6 Record a comparison of review quality, cost, and runtime across providers on the same pull request
- [ ] 7.0 Automate workflow execution on pull request events with concurrency control from Step 6
  - [ ] 7.1 Extend the workflow trigger configuration to run on `pull_request` `opened`, `reopened`, and `synchronize`
  - [ ] 7.2 Ensure non-review events such as label changes do not execute the review job or any `src/workflow/` entrypoint
  - [ ] 7.3 Add a workflow `concurrency` group keyed by repository and pull request number
  - [ ] 7.4 Enable cancellation of in-progress runs when newer commits arrive for the same pull request
  - [ ] 7.5 Push a new commit to the fixture pull request and verify the workflow runs automatically and posts a review
  - [ ] 7.6 Push several commits in quick succession and verify only the newest relevant run completes
  - [ ] 7.7 Add a label to the pull request and confirm no review workflow is triggered
- [ ] 8.0 Add retries, timeouts, and failure notifications for production resilience from Step 7
  - [ ] 8.1 Add retry behavior in `src/github/` for API calls that can fail due to transient errors or rate limiting
  - [ ] 8.2 Add retry behavior in `src/llm/` for model provider calls with increasing delays between attempts
  - [ ] 8.3 Add a timeout to `src/llm/` model execution so a hanging provider request cannot stall a workflow run indefinitely
  - [ ] 8.4 Add failure handling that sends a Slack or Discord notification with the workflow run ID and URL
  - [ ] 8.5 Test failure handling by running with an invalid model API key and verify retries, clean failure, and notification delivery
  - [ ] 8.6 Restore valid credentials and verify the workflow returns to normal operation
  - [ ] 8.7 If feasible, simulate a 429 response path and verify the retry timing appears correctly in the logs
- [ ] 9.0 Rework review execution to handle large pull requests with per-file parallelism from Step 8
  - [ ] 9.1 Refactor `src/review/review-pr.ts` so changed files are handled as individual review units instead of one combined prompt
  - [ ] 9.2 Implement file filtering rules in `src/review/` that skip generated, vendored, and lock files such as `uv.lock`
  - [ ] 9.3 Make skipped files visible in the final output along with the reason each file was skipped
  - [ ] 9.4 Run per-file review jobs or steps in parallel where the GitHub Actions model allows it
  - [ ] 9.5 Merge per-file review results in `src/review/` into a single combined comment ordered by severity
  - [ ] 9.6 Verify that `config.py`, `orders.py`, `pricing.py`, and the relevant tests are reviewed while `uv.lock` is skipped
  - [ ] 9.7 Compare runtime against the earlier single-prompt implementation and note the effect of parallelization
- [ ] 10.0 Integrate containerized static analysis and grounded review output from Step 9
  - [ ] 10.1 Add repository checkout at the pull request head commit so code and lint context match the reviewed diff
  - [ ] 10.2 Configure a containerized Ruff execution path using either a container job, Docker-based action, or custom image
  - [ ] 10.3 Capture linter output in `src/workflow/` or `src/review/` using a structured format that includes file paths, line numbers, rule IDs, and messages
  - [ ] 10.4 Feed the static analysis findings into the review prompt alongside pull request metadata and diffs
  - [ ] 10.5 Update `src/review/build-review-prompt.ts` or `src/prompts/` so deterministic linter findings are treated as facts and the model focuses on judgment-based commentary
  - [ ] 10.6 Run the workflow against the fixture pull request and verify the final comment clearly distinguishes linter findings from model commentary
  - [ ] 10.7 Introduce a known lint violation, rerun the workflow, and confirm the exact file and line number appear in the review
  - [ ] 10.8 Confirm the model does not contradict or take credit for linter findings in the final comment
- [ ] 11.0 Document outcomes, tradeoffs, and future enhancements from Going Further
  - [ ] 11.1 Update `README.md` with setup, required secrets, workflow triggers, and local or self-hosted runner considerations
  - [ ] 11.2 Document the final architecture, key tradeoffs, and provider comparison results for future contributors
  - [ ] 11.3 Capture the known limitations that still remain after Step 9 and map them to possible future enhancements
  - [ ] 11.4 Add a backlog section covering inline comments, self-reply behavior, dashboards, reusable workflows, and multi-forge support
