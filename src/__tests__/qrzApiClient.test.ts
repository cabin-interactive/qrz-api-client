import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import QrzApiClient from '../qrzApiClient'
import type {
  QrzAction,
  QrzResponse,
  QrzSuccessResponse,
  QrzFailResponse,
  QrzAuthResponse,
  QrzResultType
} from '../types'
import { QrzError, QrzAuthError, QrzNetworkError, QrzUnknownActionError } from '../errors'
import { parseQrzResponse } from '../parser'

const mockQrzResponse = {
  success: (data?: Partial<QrzSuccessResponse>): QrzResponse => ({
    result: 'OK',
    ...data
  }),
  fail: (reason: string): QrzFailResponse => ({
    result: 'FAIL',
    reason
  }),
  auth: (reason: string): QrzAuthResponse => ({
    result: 'AUTH',
    reason
  })
};

vi.mock('../parser', () => ({
  parseQrzResponse: vi.fn()
}))

describe('QrzClient', () => {
  let client: QrzApiClient
  let fetchSpy: ReturnType<typeof vi.fn>
  let parseQrzResponseSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetAllMocks()
    fetchSpy = vi.fn()
    global.fetch = fetchSpy
    parseQrzResponseSpy = vi.fn()
    vi.mocked(parseQrzResponse).mockImplementation(parseQrzResponseSpy)
    client = new QrzApiClient({
      apiKey: 'test-api-key',
      userAgent: 'TestApp/1.0.0'
    })
  })

  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      const client = new QrzApiClient({
        apiKey: 'test-api',
        userAgent: 'TestApp/1.0.0'
      })
      expect(client).toBeInstanceOf(QrzApiClient)
    })

    it('should require an API key', () => {
      expect(() => new QrzApiClient({
        apiKey: '',
        userAgent: 'TestApp/1.0.0'
      })).toThrow(QrzError)
    })

    it('should require a user agent', () => {
      expect(() => new QrzApiClient({
        apiKey: 'test-api',
        // @ts-expect-error Testing runtime behavior when userAgent is missing
        userAgent: undefined
      })).toThrow('User agent is required');
    });

    it('should not allow empty user agent', () => {
      expect(() => new QrzApiClient({
        apiKey: 'test-api',
        userAgent: ''
      })).toThrow('User agent is required');
    });

    it('should enforce user agent length limit', () => {
      expect(() => new QrzApiClient({
        apiKey: 'test-api',
        userAgent: 'A'.repeat(129)
      })).toThrow('User agent must be 128 characters or less');
    });

    it('should accept user agent of maximum length', () => {
      const client = new QrzApiClient({
        apiKey: 'test-api',
        userAgent: 'A'.repeat(128)
      });
      expect(client).toBeInstanceOf(QrzApiClient);
    });
  })

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

    it('should use direct API URL in non-browser environment', () => {
      const client = new QrzApiClient({
        apiKey: 'test',
        userAgent: 'TestApp/1.0.0'
      });
      expect((client as any).baseUrl).toBe('https://logbook.qrz.com/api');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should warn and use direct API URL in browser without proxy', () => {
      (global as any).window = {};
      const client = new QrzApiClient({
        apiKey: 'test',
        userAgent: 'TestApp/1.0.0'
      });
      expect((client as any).baseUrl).toBe('https://logbook.qrz.com/api');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use proxy URL when provided', () => {
      const proxyUrl = 'https://my-proxy.com';
      const client = new QrzApiClient({
        apiKey: 'test',
        userAgent: 'TestApp/1.0.0',
        proxyUrl
      });
      expect((client as any).baseUrl).toBe(proxyUrl);
    });
  });

  describe('createFormData', () => {
    it('should convert params to uppercase', async () => {
      const formData = await (client as any).createFormData({
        action: 'STATUS' as QrzAction,
        option: 'test-option'
      })

      expect(formData.toString()).toContain('ACTION=STATUS')
      expect(formData.toString()).toContain('OPTION=test-option')
    })

    it('should include API key', async () => {
      const formData = await (client as any).createFormData({
        action: 'STATUS' as QrzAction
      })

      expect(formData.toString()).toContain('KEY=test-api-key')
    })

    it('should skip undefined values', async () => {
      const formData = await (client as any).createFormData({
        action: 'STATUS' as QrzAction,
        option: undefined
      })

      expect(formData.toString()).not.toContain('OPTION')
    })
  })

  describe('fetchWithErrorHandling', () => {
    it('should make POST request with correct headers', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=OK')
      })

      const formData = new URLSearchParams({ TEST: 'value' })
      await (client as any).fetchWithErrorHandling(formData)

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://logbook.qrz.com/api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TestApp/1.0.0'
          },
          body: formData.toString()
        }
      )
    })

    it('should throw QrzNetworkError when response is not ok', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const formData = new URLSearchParams({ TEST: 'value' })
      await expect((client as any).fetchWithErrorHandling(formData))
        .rejects
        .toThrow(QrzNetworkError)
    })

    it('should maintain user agent across multiple requests', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('RESULT=OK')
      })

      const formData = new URLSearchParams({ TEST: 'value' })
      await (client as any).fetchWithErrorHandling(formData)
      await (client as any).fetchWithErrorHandling(formData)
      await (client as any).fetchWithErrorHandling(formData)

      expect(fetchSpy).toHaveBeenCalledTimes(3)
      fetchSpy.mock.calls.forEach(call => {
        expect(call[1].headers).toEqual(
          expect.objectContaining({
            'User-Agent': 'TestApp/1.0.0'
          })
        )
      })
    })
  })

  // Rest of the test file remains the same...
  describe('handleQrzResponse', () => {
    it('should return response for OK result', () => {
      const response = mockQrzResponse.success({ data: 'test' })
      const result = (client as any).handleQrzResponse(response, 'STATUS')
      expect(result).toEqual(response)
    })

    it('should throw QrzAuthError for AUTH result', () => {
      const response = mockQrzResponse.auth('invalid key')
      expect(() => (client as any).handleQrzResponse(response, 'STATUS'))
        .toThrow(QrzAuthError)
    })

    it('should throw QrzUnknownActionError for unrecognized command', () => {
      const response = mockQrzResponse.fail('unrecognized command')
      expect(() => (client as any).handleQrzResponse(response, 'STATUS'))
        .toThrow(QrzUnknownActionError)
    })

    it('should throw QrzError for other FAIL results', () => {
      const response = mockQrzResponse.fail('other error')
      expect(() => (client as any).handleQrzResponse(response, 'STATUS'))
        .toThrow(QrzError)
    })
  })

  describe('makeRequest', () => {
    it('should orchestrate the request flow successfully', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=OK&DATA=test-data')
      })

      parseQrzResponseSpy.mockReturnValueOnce(
        mockQrzResponse.success({
          data: 'test-data'
        })
      )

      const result = await client.makeRequest({
        action: 'STATUS' as QrzAction,
        option: 'test-option'
      })

      expect(result).toEqual(
        mockQrzResponse.success({
          data: 'test-data'
        })
      )
    })
  })

  describe('testAuth', () => {
    it('should return valid result for successful auth', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=OK')
      })

      parseQrzResponseSpy.mockReturnValueOnce({
        result: 'OK'
      })

      const result = await client.testAuth()
      expect(result).toEqual({
        isValid: true
      })
    })

    it('should return invalid result for auth error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=AUTH&REASON=invalid api key')
      })

      parseQrzResponseSpy.mockReturnValueOnce({
        result: 'AUTH',
        reason: 'invalid api key'
      })

      const result = await client.testAuth()
      expect(result).toEqual({
        isValid: false,
        error: 'invalid api key'
      })
    })

    it('should return invalid result for network error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await client.testAuth()
      expect(result).toEqual({
        isValid: false,
        error: 'Could not connect to QRZ.com API'
      })
    })

    it('should return invalid result for unknown error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=ERROR')
      })

      parseQrzResponseSpy.mockReturnValueOnce({
        result: 'ERROR'
      })

      const result = await client.testAuth()
      expect(result).toEqual({
        isValid: false,
        error: 'Unknown error occurred while testing API key'
      })
    })
  })
})