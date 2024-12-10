// services/__tests__/http.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpService } from '../http';
import { QrzNetworkError, QrzError } from '../../errors';
import { parseQrzResponse } from '../../parser';

vi.mock('../../parser', () => ({
  parseQrzResponse: vi.fn()
}));

describe('HttpService', () => {
  let service: HttpService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    vi.mocked(parseQrzResponse).mockImplementation((input) => JSON.parse(input));

    service = new HttpService({
      apiKey: 'test-key',
      userAgent: 'TestApp/1.0.0'
    });
  });

  describe('post', () => {
    it('should make POST request with correct headers', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'OK' }))
      });

      await service.post({ action: 'STATUS' });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://logbook.qrz.com/api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TestApp/1.0.0'
          },
          body: expect.any(String)
        }
      );
    });

    it('should convert params to uppercase', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'OK' }))
      });

      await service.post({ action: 'status', option: 'test' });

      const requestBody = new URLSearchParams(fetchSpy.mock.calls[0][1].body);
      expect(requestBody.get('ACTION')).toBe('status');
      expect(requestBody.get('OPTION')).toBe('test');
    });

    it('should include API key', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'OK' }))
      });

      await service.post({ action: 'STATUS' });

      const requestBody = new URLSearchParams(fetchSpy.mock.calls[0][1].body);
      expect(requestBody.get('KEY')).toBe('test-key');
    });

    it('should handle network errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(service.post({ action: 'STATUS' }))
        .rejects
        .toThrow(QrzNetworkError);
    });

    it('should parse response', async () => {
      const mockResponse = { result: 'OK', data: 'test' };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const result = await service.post({ action: 'STATUS' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('proxy handling', () => {
    it('should use proxy URL when provided', async () => {
      const proxyUrl = 'https://my-proxy.com';
      const serviceWithProxy = new HttpService({
        apiKey: 'test-key',
        userAgent: 'TestApp/1.0.0',
        proxyUrl
      });

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'OK' }))
      });

      await serviceWithProxy.post({ action: 'STATUS' });

      expect(fetchSpy).toHaveBeenCalledWith(
        proxyUrl,
        expect.any(Object)
      );
    });

    it('should validate proxy URL when making request', async () => {
      const serviceWithInvalidProxy = new HttpService({
        apiKey: 'test-key',
        userAgent: 'TestApp/1.0.0',
        proxyUrl: 'invalid-url'
      });

      // The error happens when we try to use the proxy URL
      await expect(serviceWithInvalidProxy.post({ action: 'STATUS' }))
        .rejects
        .toThrow('Invalid proxy URL provided');
    });
  });
});