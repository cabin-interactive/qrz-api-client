// config.test.ts
import { describe, it, expect } from 'vitest';
import { validateConfig } from '../config';
import { QrzError } from '../errors';

describe('validateConfig', () => {
  const validConfig = {
    apiKey: 'test-key',
    userAgent: 'TestApp/1.0.0'
  };

  it('should accept valid config', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should throw error if API key is missing', () => {
    expect(() => validateConfig({
      ...validConfig,
      apiKey: ''
    })).toThrow('API key is required');
  });

  it('should throw error if user agent is missing', () => {
    expect(() => validateConfig({
      ...validConfig,
      userAgent: ''
    })).toThrow('User agent is required');
  });

  it('should throw error if user agent is too long', () => {
    expect(() => validateConfig({
      ...validConfig,
      userAgent: 'A'.repeat(129)
    })).toThrow('User agent must be 128 characters or less');
  });

  it('should accept user agent of maximum length', () => {
    expect(() => validateConfig({
      ...validConfig,
      userAgent: 'A'.repeat(128)
    })).not.toThrow();
  });

  it('should validate HTTPS for proxy URL when provided', () => {
    expect(() => validateConfig({
      ...validConfig,
      proxyUrl: 'http://insecure-proxy.com'
    })).toThrow('Proxy URL must use HTTPS');
  });

  it('should validate proxy URL format when provided', () => {
    expect(() => validateConfig({
      ...validConfig,
      proxyUrl: 'not-a-url'
    })).toThrow('Invalid proxy URL provided');
  });

  it('should accept valid proxy URL', () => {
    expect(() => validateConfig({
      ...validConfig,
      proxyUrl: 'https://secure-proxy.com'
    })).not.toThrow();
  });
});