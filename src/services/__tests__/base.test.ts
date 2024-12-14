// services/__tests__/base.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseQrzService } from '../base';
import type { QrzClientConfig } from '../../types';

// Concrete implementation for testing
class TestService extends BaseQrzService {
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public createTestFormData(params: Record<string, string | undefined>): URLSearchParams {
    return this.createFormData(params);
  }
}

describe('BaseQrzService', () => {
  const validConfig: QrzClientConfig = {
    apiKey: 'test-key',
    userAgent: 'TestApp/1.0.0'
  };

  describe('baseUrl', () => {
    const originalWindow = global.window;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      (global as any).window = undefined;
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
      if (originalWindow) {
        (global as any).window = originalWindow;
      }
      consoleSpy.mockRestore();
    });

    it('should return direct API URL by default', () => {
      const service = new TestService(validConfig);
      expect(service.getBaseUrl()).toBe('https://logbook.qrz.com/api');
    });

    it('should warn about CORS in browser environment', () => {
      (global as any).window = {};
      const service = new TestService(validConfig);

      service.getBaseUrl();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Using QRZ API directly in a browser environment may fail due to CORS restrictions. Consider using a proxy.'
      );
    });

    it('should use proxy URL when provided', () => {
      const proxyUrl = 'https://my-proxy.com';
      const service = new TestService({
        ...validConfig,
        proxyUrl
      });

      expect(service.getBaseUrl()).toBe(proxyUrl);
    });
  });

  describe('createFormData', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService(validConfig);
    });

    it('should create URLSearchParams with configured API key', () => {
      const formData = service.createTestFormData({});
      expect(formData.get('KEY')).toBe('test-key');
    });

    it('should convert keys to uppercase', () => {
      const formData = service.createTestFormData({
        action: 'test',
        someParam: 'value'
      });

      expect(formData.get('ACTION')).toBe('test');
      expect(formData.get('SOMEPARAM')).toBe('value');
    });

    it('should exclude undefined values', () => {
      const formData = service.createTestFormData({
        defined: 'value',
        undefined: undefined
      });

      expect(formData.has('DEFINED')).toBe(true);
      expect(formData.has('UNDEFINED')).toBe(false);
    });

    it('should handle empty string values', () => {
      const formData = service.createTestFormData({
        empty: ''
      });

      expect(formData.get('EMPTY')).toBe('');
    });

    it('should always use configured API key regardless of params', () => {
      const formData = service.createTestFormData({
        key: 'different-key'  // This should be ignored
      });

      expect(formData.get('KEY')).toBe('test-key');
    });
  });
});