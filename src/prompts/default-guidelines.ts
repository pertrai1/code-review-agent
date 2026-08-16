import type { ReviewGuideline } from '../types.js';

export const defaultGuidelines: ReviewGuideline[] = [
  {
    id: 'security-secrets',
    text: 'Flag hard-coded credentials, tokens, API keys, or secrets as CRITICAL.',
  },
  {
    id: 'complexity-nesting',
    text: 'Flag deeply nested conditionals and prefer simpler control flow such as early returns.',
  },
  {
    id: 'evidence-first',
    text: 'Do not report speculative runtime bugs unless the diff or surrounding context provides evidence.',
  },
];
