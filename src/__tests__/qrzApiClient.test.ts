import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// Test helpers for creating typed responses
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
      apiKey: 'test-api-key'
    })
  })

  describe('constructor', () => {
    it('should create an instance with config', () => {
      const client = new QrzApiClient({ apiKey: 'test-api' })
      expect(client).toBeInstanceOf(QrzApiClient)
    })

    it('should require an API key', () => {
      expect(() => new QrzApiClient({ apiKey: '' })).toThrow(QrzError)
    })
  })

  describe('makeRequest', () => {
    it('should make POST request with correct headers and form data', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=OK')
      })

      parseQrzResponseSpy.mockReturnValueOnce(
        mockQrzResponse.success()
      )

      await (client as any).makeRequest({
        action: 'STATUS' as QrzAction
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://logbook.qrz.com/api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(String)
        }
      )

      const [, { body }] = fetchSpy.mock.calls[0]
      expect(body).toContain('KEY=test-api-key')
      expect(body).toContain('ACTION=STATUS')
    })

    it('should throw a QrzAuthError when the API key is invalid', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve('STATUS=AUTH&RESULT=AUTH&REASON=invalid api key 1234567&EXTENDED=')
      }

      fetchSpy
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse)

      const authResponse = mockQrzResponse.auth('invalid api key 1234567')

      parseQrzResponseSpy
        .mockReturnValueOnce(authResponse)
        .mockReturnValueOnce(authResponse)

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      })).rejects.toThrow(QrzAuthError)

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      })).rejects.toMatchObject({
        message: 'invalid api key 1234567'
      })
    })

    it('should throw QrzUnknownActionError for unrecognized actions', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve('STATUS=FAIL&RESULT=FAIL&REASON=unrecognized command&EXTENDED=')
      }

      fetchSpy
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse)

      const failResponse = mockQrzResponse.fail('unrecognized command')

      parseQrzResponseSpy
        .mockReturnValueOnce(failResponse)
        .mockReturnValueOnce(failResponse)

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      })).rejects.toThrow(QrzUnknownActionError)

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      })).rejects.toMatchObject({
        command: 'STATUS',
        message: 'unrecognized command'
      })
    })

    it('should throw QrzNetworkError when response is not ok', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      }))
        .rejects
        .toThrow(QrzNetworkError)
    })

    it('should throw QrzError when result is not OK', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=ERROR')
      })

      parseQrzResponseSpy.mockReturnValueOnce({
        result: 'ERROR' as QrzResultType,
        reason: 'Unknown error'
      })

      await expect((client as any).makeRequest({
        action: 'STATUS' as QrzAction
      }))
        .rejects
        .toThrow(QrzError)
    })

    it('should handle additional parameters', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('RESULT=OK&DATA=test-data')
      })

      parseQrzResponseSpy.mockReturnValueOnce(
        mockQrzResponse.success({
          data: 'test-data'
        })
      )

      await (client as any).makeRequest({
        action: 'STATUS' as QrzAction,
        option: 'test-option',
        customParam: 'custom-value'
      })

      const [, { body }] = fetchSpy.mock.calls[0]
      expect(body).toContain('KEY=test-api-key')
      expect(body).toContain('ACTION=STATUS')
      expect(body).toContain('OPTION=test-option')
      expect(body).toContain('CUSTOMPARAM=custom-value')
    })
  })
})