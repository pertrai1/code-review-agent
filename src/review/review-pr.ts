import { buildReviewPrompt } from './build-review-prompt.js';
import type { ReviewRequest, ReviewResult } from '../types.js';

export function createBaselineReviewRequest(
  request: ReviewRequest
): ReviewRequest {
  return {
    ...request,
    files: request.files.filter(
      (file) => typeof file.patch === 'string' && file.patch.length > 0
    ),
  };
}

export function createPlaceholderReviewResult(
  request: ReviewRequest
): ReviewResult {
  const normalizedRequest = createBaselineReviewRequest(request);
  const prompt = buildReviewPrompt(normalizedRequest);

  return {
    issues: [],
    skippedFiles: request.files
      .filter((file) => !file.patch)
      .map((file) => file.filename),
    suggestions: [
      'Connect a model provider client to replace this placeholder review result.',
      `Prompt prepared with ${String(prompt.length)} characters of review context.`,
    ],
    summary: `Prepared a baseline review request for ${String(normalizedRequest.files.length)} changed files.`,
    verdict: 'NOT_IMPLEMENTED',
  };
}
