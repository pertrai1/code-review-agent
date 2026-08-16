import { describe, expect, it } from 'vitest';

import { defaultGuidelines } from '../prompts/default-guidelines.js';
import {
  createBaselineReviewRequest,
  createPlaceholderReviewResult,
} from './review-pr.js';

describe('review-pr', () => {
  it('drops files without patches from the baseline review request', () => {
    const request = createBaselineReviewRequest({
      files: [
        {
          filename: 'app/config.py',
          patch: '+STRIPE_SECRET_KEY = "sk_live_example"',
          status: 'added',
        },
        {
          filename: 'uv.lock',
          status: 'modified',
        },
      ],
      guidelines: defaultGuidelines,
      pullRequest: {
        body: 'Description',
        number: 7,
        repository: 'octo/reviewme',
        title: 'Title',
      },
    });

    expect(request.files).toHaveLength(1);
    expect(request.files[0]?.filename).toBe('app/config.py');
  });

  it('returns a placeholder result with skipped files listed', () => {
    const result = createPlaceholderReviewResult({
      files: [
        {
          filename: 'uv.lock',
          status: 'modified',
        },
      ],
      guidelines: defaultGuidelines,
      pullRequest: {
        body: '',
        number: 7,
        repository: 'octo/reviewme',
        title: 'Title',
      },
    });

    expect(result.skippedFiles).toEqual(['uv.lock']);
    expect(result.verdict).toBe('NOT_IMPLEMENTED');
  });
});
