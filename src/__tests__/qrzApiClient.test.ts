// src/__tests__/qrzApiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QrzApiClient from '../qrzApiClient';
import { HttpService } from '../services/http';
import { QsoService } from '../services/qso';
import { QrzAuthError, QrzNetworkError, QrzError, QrzQsoStationCallsignError } from '../errors';
import type { QrzResponse } from '../types';

vi.mock('../services/http');
vi.mock('../services/qso');

describe('QrzApiClient', () => {
  const validConfig = {
    apiKey: 'test-key',
    userAgent: 'TestApp/1.0.0'
  };

  let mockHttpService: HttpService;
  let mockQsoService: QsoService;

  beforeEach(() => {
    vi.resetAllMocks();

    mockHttpService = { post: vi.fn() } as unknown as HttpService;
    mockQsoService = { uploadQso: vi.fn() } as unknown as QsoService;

    vi.mocked(HttpService).mockImplementation(() => mockHttpService);
    vi.mocked(QsoService).mockImplementation(() => mockQsoService);
  });

  describe('constructor', () => {
    it('creates an instance with valid config', () => {
      const client = new QrzApiClient(validConfig);
      expect(client).toBeInstanceOf(QrzApiClient);
    });

    it('throws error if API key is missing', () => {
      expect(() => new QrzApiClient({ ...validConfig, apiKey: '' }))
        .toThrow('API key is required');
    });

    it('throws error if user agent is missing', () => {
      expect(() => new QrzApiClient({ ...validConfig, userAgent: '' }))
        .toThrow('User agent is required');
    });

    it('throws error if user agent is too long', () => {
      expect(() => new QrzApiClient({
        ...validConfig,
        userAgent: 'A'.repeat(129)
      })).toThrow('User agent must be 128 characters or less');
    });

    it('throws error if proxy URL is insecure', () => {
      expect(() => new QrzApiClient({ ...validConfig, proxyUrl: 'http://insecure.com' }))
        .toThrow('Proxy URL must use HTTPS');
    });
  });

  describe('makeRequest', () => {
    it('calls http.post with given parameters and returns the response', async () => {
      const client = new QrzApiClient(validConfig);
      const mockResponse = { result: 'OK' } as QrzResponse;
      vi.mocked(mockHttpService.post).mockResolvedValueOnce(mockResponse);

      const result = await client.makeRequest({ action: 'STATUS' });

      expect(mockHttpService.post).toHaveBeenCalledWith({ action: 'STATUS' });
      expect(result).toBe(mockResponse);
    });

    it('bubbles up errors from http.post', async () => {
      const client = new QrzApiClient(validConfig);
      vi.mocked(mockHttpService.post).mockRejectedValueOnce(new QrzAuthError('invalid api key'));

      await expect(client.makeRequest({ action: 'STATUS' }))
        .rejects
        .toThrow(QrzAuthError);
    });
  });

  describe('testAuth', () => {
    let client: QrzApiClient;

    beforeEach(() => {
      client = new QrzApiClient(validConfig);
    });

    it('returns { isValid: true } if http.post succeeds', async () => {
      vi.mocked(mockHttpService.post).mockResolvedValueOnce({ result: 'OK' });
      const result = await client.testAuth();
      expect(result).toEqual({ isValid: true });
    });

    it('returns an error message if QrzAuthError is thrown', async () => {
      vi.mocked(mockHttpService.post).mockRejectedValueOnce(new QrzAuthError('invalid api key'));
      const result = await client.testAuth();
      expect(result).toEqual({ isValid: false, error: 'invalid api key' });
    });

    it('returns a network error message if QrzNetworkError is thrown', async () => {
      vi.mocked(mockHttpService.post).mockRejectedValueOnce(new QrzNetworkError('Network error', 500));
      const result = await client.testAuth();
      expect(result).toEqual({ isValid: false, error: 'Could not connect to QRZ.com API' });
    });

    it('returns a generic error message for unknown errors', async () => {
      vi.mocked(mockHttpService.post).mockRejectedValueOnce(new Error('Unknown error'));
      const result = await client.testAuth();
      expect(result).toEqual({ isValid: false, error: 'Unknown error occurred while testing API key' });
    });
  });

  describe('uploadQso', () => {
    let client: QrzApiClient;
    const validAdif = '<band:3>80m<mode:3>SSB<call:4>W1AW<qso_date:8>20240101<station_callsign:5>W2XYZ<time_on:4>1200<eor>';

    beforeEach(() => {
      client = new QrzApiClient(validConfig);
    });

    it('handles successful QSO upload', async () => {
      vi.mocked(mockQsoService.uploadQso).mockResolvedValueOnce({
        logId: '1193542649',
        status: 'OK',
        count: 1
      });

      const result = await client.uploadQso(validAdif);

      expect(mockQsoService.uploadQso).toHaveBeenCalledWith(validAdif, undefined);
      expect(result).toEqual({
        logId: '1193542649',
        status: 'OK',
        count: 1
      });
    });

    it('handles duplicate QSO error', async () => {
      vi.mocked(mockQsoService.uploadQso).mockRejectedValueOnce(
        new QrzError('QSO already exists in logbook')
      );

      await expect(client.uploadQso(validAdif))
        .rejects
        .toThrow('QSO already exists in logbook');
    });

    it('handles station callsign mismatch error', async () => {
      vi.mocked(mockQsoService.uploadQso).mockRejectedValueOnce(
        new QrzQsoStationCallsignError(
          'wrong station_callsign for this logbook KB0ICTS doesnt match book callsign KB0ICT'
        )
      );

      await expect(client.uploadQso(validAdif))
        .rejects
        .toThrow('wrong station_callsign for this logbook');
    });

    it('handles replace option', async () => {
      vi.mocked(mockQsoService.uploadQso).mockResolvedValueOnce({
        logId: '1193542649',
        status: 'REPLACE',
        count: 1
      });

      const result = await client.uploadQso(validAdif, { replace: true });

      expect(mockQsoService.uploadQso).toHaveBeenCalledWith(validAdif, { replace: true });
      expect(result).toEqual({
        logId: '1193542649',
        status: 'REPLACE',
        count: 1
      });
    });
  });
});