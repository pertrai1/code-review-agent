import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { loadEnvironment } from './config.js';

describe('loadEnvironment', () => {
  it('returns parsed environment values', () => {
    const environment = loadEnvironment({
      GITHUB_TOKEN: 'gh-token',
      MODEL_API_KEY: 'model-key',
      MODEL_NAME: 'gpt-test',
      MODEL_PROVIDER: 'openai',
    });

    expect(environment.MODEL_NAME).toBe('gpt-test');
    expect(environment.MODEL_PROVIDER).toBe('openai');
  });

  it('throws when required environment variables are missing', () => {
    expect(() => loadEnvironment({})).toThrow(ZodError);
  });
});
