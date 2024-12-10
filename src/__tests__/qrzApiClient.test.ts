// src/__tests__/qrzApiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QrzApiClient from '../qrzApiClient';
import { HttpService } from '../services/http';
import { QrzError } from '../errors';
import type { QrzResponse } from '../types';

vi.mock('../services/http');

describe('QrzApiClient', () => {
  const validConfig = {
    apiKey: 'test-key',
    userAgent: 'TestApp/1.0.0'
  };

  let mockHttpService: HttpService;

  beforeEach(() => {
    vi.resetAllMocks();
    mockHttpService = {
      post: vi.fn()
    } as unknown as HttpService;
    vi.mocked(HttpService).mockImplementation(() => mockHttpService);
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const client = new QrzApiClient(validConfig);
      expect(client).toBeInstanceOf(QrzApiClient);
    });

    it('should require API key', () => {
      expect(() => new QrzApiClient({
        ...validConfig,
        apiKey: ''
      })).toThrow(QrzError);
    });

    it('should require user agent', () => {
      expect(() => new QrzApiClient({
        ...validConfig,
        userAgent: ''
      })).toThrow(QrzError);
    });
  });

  describe('service delegation', () => {
    let client: QrzApiClient;

    beforeEach(() => {
      client = new QrzApiClient(validConfig);
    });

    it('should delegate makeRequest to http service', async () => {
      const mockResponse = { result: 'OK' } as QrzResponse;
      vi.mocked(mockHttpService.post).mockResolvedValueOnce(mockResponse);

      const result = await client.makeRequest({ action: 'STATUS' });

      expect(mockHttpService.post).toHaveBeenCalledWith({ action: 'STATUS' });
      expect(result).toBe(mockResponse);
    });

    it('should delegate testAuth to auth service', async () => {
      vi.mocked(mockHttpService.post).mockResolvedValueOnce({ result: 'OK' });

      const result = await client.testAuth();

      expect(result).toEqual({ isValid: true });
      expect(mockHttpService.post).toHaveBeenCalledWith({ action: 'STATUS' });
    });

    it('should delegate uploadQso to qso service', async () => {
      const mockResponse = {
        result: 'OK',
        logId: '12345',
        count: '1'
      } as QrzResponse;

      vi.mocked(mockHttpService.post).mockResolvedValueOnce(mockResponse);

      const validAdif = '<band:3>80m<mode:3>SSB<call:4>W1AW<qso_date:8>20240101<station_callsign:5>W2XYZ<time_on:4>1200<eor>';
      const result = await client.uploadQso(validAdif, { replace: true });

      expect(mockHttpService.post).toHaveBeenCalledWith({
        action: 'INSERT',
        adif: validAdif,
        option: 'REPLACE'
      });
      expect(result).toEqual({
        logId: '12345',
        status: 'inserted',
        count: 1
      });
    });
  });
});