// services/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth';
import { HttpService } from '../http';
import { QrzAuthError, QrzNetworkError } from '../../errors';
import type { QrzResponse } from '../../types';

vi.mock('../http', () => ({
  HttpService: vi.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockHttp: HttpService;
  const config = {
    apiKey: 'test-key',
    userAgent: 'TestApp/1.0.0'
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockHttp = {
      post: vi.fn(),
    } as unknown as HttpService;

    service = new AuthService(config, mockHttp);
  });

  describe('testAuth', () => {
    it('should return valid result for successful auth', async () => {
      vi.mocked(mockHttp.post).mockResolvedValueOnce({ result: 'OK' } as QrzResponse);

      const result = await service.testAuth();
      expect(result).toEqual({ isValid: true });
      expect(mockHttp.post).toHaveBeenCalledWith({ action: 'STATUS' });
    });

    it('should handle auth errors', async () => {
      vi.mocked(mockHttp.post).mockRejectedValueOnce(
        new QrzAuthError('invalid api key')
      );

      const result = await service.testAuth();
      expect(result).toEqual({
        isValid: false,
        error: 'invalid api key'
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(mockHttp.post).mockRejectedValueOnce(
        new QrzNetworkError('Network error', 500)
      );

      const result = await service.testAuth();
      expect(result).toEqual({
        isValid: false,
        error: 'Could not connect to QRZ.com API'
      });
    });

    it('should handle unknown errors', async () => {
      vi.mocked(mockHttp.post).mockRejectedValueOnce(
        new Error('Unknown error')
      );

      const result = await service.testAuth();
      expect(result).toEqual({
        isValid: false,
        error: 'Unknown error occurred while testing API key'
      });
    });
  });
});