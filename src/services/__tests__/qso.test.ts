// services/__tests__/qso.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QsoService } from '../qso';
import { HttpService } from '../http';
import {
  QrzAdifFormatError,
  QrzQsoValidationError,
  QrzError,
  QrzDuplicateQsoError,
} from '../../errors';
import type { QrzResponse } from '../../types';

vi.mock('../http', () => ({
  HttpService: vi.fn()
}));

describe('QsoService', () => {
  let service: QsoService;
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
    service = new QsoService(config, mockHttp);
  });

  const validAdif = '<band:3>80m<mode:3>SSB<call:4>XX1X<qso_date:8>20240121<station_callsign:5>AA7BQ<time_on:4>0346<eor>';
  const inValidAdif = '<band:3>80m<mode:3>SSB<call:4>XX1X<qso_date:8>20240121<station_callsign:5>AA7BQ<time_on:4>0346';

  describe('uploadQso', () => {
    it('should successfully upload a QSO', async () => {
      vi.mocked(mockHttp.post).mockResolvedValueOnce({
        result: 'OK',
        logId: '12345',
        count: '1'
      } as QrzResponse);

      const result = await service.uploadQso(validAdif);

      expect(result).toEqual({
        logId: '12345',
        status: 'OK',
        count: 1
      });

      expect(mockHttp.post).toHaveBeenCalledWith({
        action: 'INSERT',
        adif: validAdif
      });
    });

    it('should validate ADIF format', async () => {
      const invalidAdif = '<band:3>80m<mode:3>SSB'; // Missing <eor>

      await expect(service.uploadQso(invalidAdif))
        .rejects
        .toThrow(QrzAdifFormatError);
    });

    it('should validate required fields', async () => {
      const missingFieldAdif = '<band:3>80m<mode:3>SSB<station_callsign:5>AA7BQ<eor>';

      await expect(service.uploadQso(missingFieldAdif))
        .rejects
        .toThrow(QrzQsoValidationError);
    });

    it('should validate station identification', async () => {
      const noStationAdif = '<band:3>80m<mode:3>SSB<call:4>XX1X<qso_date:8>20240121<time_on:4>0346<eor>';

      await expect(service.uploadQso(noStationAdif))
        .rejects
        .toThrow(QrzQsoValidationError);
    });

    it('should handle replace option', async () => {
      vi.mocked(mockHttp.post).mockResolvedValueOnce({
        result: 'REPLACE',
        logId: '12345',
        count: '1'
      } as QrzResponse);

      const result = await service.uploadQso(validAdif, { replace: true });

      expect(result).toEqual({
        logId: '12345',
        status: 'REPLACE',
        count: 1
      });

      expect(mockHttp.post).toHaveBeenCalledWith({
        action: 'INSERT',
        adif: validAdif,
        option: 'REPLACE'
      });
    });
    it('should throw QrzDuplicateQsoError when QSO already exists', async () => {
      vi.mocked(mockHttp.post).mockResolvedValueOnce({
        status: 'FAIL',
        result: 'FAIL',
        reason: 'Unable to add QSO to database: duplicate',
        extended: ''
      } as QrzResponse);

      await expect(service.uploadQso(validAdif))
        .rejects
        .toThrow(QrzDuplicateQsoError);
    });
    it('should validate response format', async () => {
      vi.mocked(mockHttp.post).mockResolvedValueOnce({
        result: 'OK'
      } as QrzResponse);
      await expect(service.uploadQso(inValidAdif))
        .rejects
        .toThrow(QrzAdifFormatError);
      await expect(service.uploadQso(inValidAdif))
        .rejects
        .toThrowError('Invalid ADIF format: missing <eor> tag');
    });
  });
});