import { describe, expect, it } from 'vitest';

import { defaultGuidelines } from '../prompts/default-guidelines.js';
import { buildReviewPrompt } from './build-review-prompt.js';

describe('buildReviewPrompt', () => {
  it('includes structured instructions, guidelines, and changed files', () => {
    const prompt = buildReviewPrompt({
      files: [
        {
          filename: 'app/config.py',
          patch: '+STRIPE_SECRET_KEY = "sk_live_example"',
          status: 'added',
        },
      ],
      guidelines: defaultGuidelines,
      pullRequest: {
        body: 'Adds a sensitive configuration change.',
        number: 42,
        repository: 'octo/reviewme',
        title: 'Add refund ratios',
      },
    });

    expect(prompt).toContain('Summary');
    expect(prompt).toContain('Issues Found');
    expect(prompt).toContain('security-secrets');
    expect(prompt).toContain('app/config.py');
    expect(prompt).toContain('octo/reviewme');
  });
});
