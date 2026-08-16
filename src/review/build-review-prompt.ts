import type {
  PullRequestFile,
  ReviewGuideline,
  ReviewRequest,
} from '../types.js';

function formatFile(file: PullRequestFile): string {
  const patch = file.patch?.trim();

  return [
    `File: ${file.filename}`,
    `Status: ${file.status}`,
    patch ? `Patch:\n${patch}` : 'Patch: <missing>',
  ].join('\n');
}

function formatGuidelines(guidelines: ReviewGuideline[]): string {
  return guidelines
    .map((guideline) => `- [${guideline.id}] ${guideline.text}`)
    .join('\n');
}

export function buildReviewPrompt(request: ReviewRequest): string {
  const { files, guidelines, pullRequest } = request;

  const sections = [
    'You are an engineer reviewing a pull request.',
    'Return exactly these sections in order: Summary, Issues Found, Suggestions, Verdict.',
    'Tag every issue with CRITICAL, MAJOR, or MINOR.',
    'Prefer evidence from the diff. Avoid speculation when context is missing.',
    `Repository: ${pullRequest.repository}`,
    `Pull Request #${String(pullRequest.number)}: ${pullRequest.title}`,
    `Description:\n${pullRequest.body.trim() || '<empty>'}`,
    `Guidelines:\n${formatGuidelines(guidelines)}`,
    `Changed Files:\n${files.map(formatFile).join('\n\n')}`,
  ];

  return sections.join('\n\n');
}
