import { parseArgs } from 'node:util';

import { loadEnvironment } from './config.js';
import { defaultGuidelines } from './prompts/default-guidelines.js';
import { createPlaceholderReviewResult } from './review/review-pr.js';
import type { ReviewRequest } from './types.js';

function buildDemoRequest(
  repository: string,
  pullRequestNumber: number
): ReviewRequest {
  return {
    files: [
      {
        filename: 'app/config.py',
        patch: '+STRIPE_SECRET_KEY = "sk_live_example"',
        status: 'added',
      },
      {
        filename: 'app/pricing.py',
        patch:
          '+def calculate_discount(order):\n+    if a:\n+        if b:\n+            if c:\n+                if d:\n+                    if e:\n+                        return 1',
        status: 'modified',
      },
    ],
    guidelines: defaultGuidelines,
    pullRequest: {
      body: 'Adds refund ratio logic and reporting updates.',
      number: pullRequestNumber,
      repository,
      title: 'Add refund ratios and reporting pack',
    },
  };
}

export function main(): void {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      owner: {
        type: 'string',
      },
      pr: {
        type: 'string',
      },
      repo: {
        type: 'string',
      },
    },
  });

  const command = positionals[0] ?? 'doctor';

  if (command === 'doctor') {
    const environment = loadEnvironment();

    console.log(
      JSON.stringify(
        {
          modelName: environment.MODEL_NAME,
          modelProvider: environment.MODEL_PROVIDER,
          status: 'ok',
        },
        null,
        2
      )
    );

    return;
  }

  if (command !== 'review-pr') {
    throw new Error(`Unknown command: ${command}`);
  }

  const owner = values.owner;
  const repo = values.repo;
  const prValue = values.pr;

  if (!owner || !repo || !prValue) {
    throw new Error(
      'Usage: npm run dev -- review-pr --owner <owner> --repo <repo> --pr <number>'
    );
  }

  const pullRequestNumber = Number(prValue);

  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new Error(`Invalid pull request number: ${prValue}`);
  }

  loadEnvironment();

  const result = createPlaceholderReviewResult(
    buildDemoRequest(`${owner}/${repo}`, pullRequestNumber)
  );

  console.log(JSON.stringify(result, null, 2));
}

main();
