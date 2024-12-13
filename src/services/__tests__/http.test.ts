// services/__tests__/http.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpService } from '../http';
import { QrzNetworkError, QrzError, QrzAuthError } from '../../errors';
// STATUS=FAIL&RESULT=FAIL&REASON=Unable to add QSO to database: duplicate&EXTENDED=
// STATUS=FAIL&RESULT=FAIL&REASON=wrong station_callsign for this logbook KB0ICTS doesnt match book callsign KB0ICT&EXTENDED=
// COUNT=1&LOGID=1193542649&RESULT=OK
// STATUS=FAIL&RESULT=FAIL&REASON=Replace error on record: DXCC could not be determined for TEST2&EXTENDED=
// COUNT=1&RESULT=REPLACE&LOGID=1193504315

describe('HttpService', () => {
  let service: HttpService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    service = new HttpService({
      apiKey: 'test-key',
      userAgent: 'TestApp/1.0.0'
    });
  });

  describe('post', () => {
    it('makes a POST request with correct headers and body', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('RESULT=OK')
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

    it('converts parameter keys to uppercase but keeps values unchanged', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('RESULT=OK')
      });

      await service.post({ action: 'status', option: 'test' });
      const requestBody = new URLSearchParams(fetchSpy.mock.calls[0][1].body as string);
      expect(requestBody.get('ACTION')).toBe('status');
      expect(requestBody.get('OPTION')).toBe('test');
    });

    it('includes the API key in the request body', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('RESULT=OK')
      });

      await service.post({ action: 'STATUS' });
      const requestBody = new URLSearchParams(fetchSpy.mock.calls[0][1].body as string);
      expect(requestBody.get('KEY')).toBe('test-key');
    });

    it('throws QrzNetworkError on non-200 HTTP responses', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('')
      });

      await expect(service.post({ action: 'STATUS' }))
        .rejects
        .toThrow(QrzNetworkError);
    });

    describe('authentication errors', () => {
      it('throws QrzAuthError if the API returns an AUTH status', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(
            'STATUS=AUTH&RESULT=AUTH&REASON=invalid api key 123456789123&EXTENDED='
          )
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow(QrzAuthError);
      });

      it('includes the error reason in the QrzAuthError message', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(
            'STATUS=AUTH&RESULT=AUTH&REASON=invalid api key 123456789123&EXTENDED='
          )
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow('invalid api key 123456789123');
      });

      it('throws QrzAuthError for subscription requirement', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('RESULT=AUTH&REASON=subscription required')
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow(QrzAuthError);
      });

      it('includes "subscription required" in the QrzAuthError message', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('RESULT=AUTH&REASON=subscription required')
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow('subscription required');
      });

      it('includes the error reason in the message when provided', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('STATUS=AUTH&RESULT=AUTH&REASON=invalid api key')
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow('invalid api key');
      });

      it('throws a generic QrzAuthError if no reason is given', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('STATUS=AUTH&RESULT=AUTH')
        });

        await expect(service.post({ action: 'STATUS' }))
          .rejects
          .toThrow('Authentication failed');
      });
    });

    describe('successful responses', () => {
      it('parses a successful QSO insert response', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('RESULT=OK&LOGID=130877825&COUNT=1')
        });

        const result = await service.post({
          action: 'INSERT',
          adif: '<band:3>80m<mode:3>SSB<call:4>XX1X<qso_date:8>20140121<station_callsign:5>AA7BQ<time_on:4>0346<eor>'
        });

        expect(result).toEqual({
          result: 'OK',
          logid: '130877825',
          count: '1'
        });
      });

      it('parses a successful STATUS request response', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('RESULT=OK&COUNT=4148&CONFIRMED=2849&DXCC_COUNT=44')
        });

        const result = await service.post({ action: 'STATUS' });
        expect(result).toEqual({
          result: 'OK',
          count: '4148',
          confirmed: '2849',
          dxccCount: '44'
        });
      });
    });
  });

  describe('proxy handling', () => {
    it('uses the provided proxy URL if set', async () => {
      const proxyUrl = 'https://my-proxy.com';
      const serviceWithProxy = new HttpService({
        apiKey: 'test-key',
        userAgent: 'TestApp/1.0.0',
        proxyUrl
      });

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('RESULT=OK')
      });

      await serviceWithProxy.post({ action: 'STATUS' });
      expect(fetchSpy).toHaveBeenCalledWith(proxyUrl, expect.any(Object));
    });
  });
});