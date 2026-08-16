export type ReviewSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export type PullRequestFile = {
  filename: string;
  patch?: string;
  status: 'added' | 'changed' | 'modified' | 'removed' | 'renamed';
};

export type PullRequestMetadata = {
  body: string;
  number: number;
  repository: string;
  title: string;
};

export type ReviewGuideline = {
  id: string;
  text: string;
};

export type ReviewIssue = {
  file: string;
  message: string;
  severity: ReviewSeverity;
};

export type ReviewResult = {
  issues: ReviewIssue[];
  skippedFiles: string[];
  suggestions: string[];
  summary: string;
  verdict: string;
};

export type ReviewRequest = {
  files: PullRequestFile[];
  guidelines: ReviewGuideline[];
  pullRequest: PullRequestMetadata;
};
