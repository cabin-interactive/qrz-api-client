// index.test.ts
import { describe, it, expect } from 'vitest'
import QrzApiClient, {
  QrzError,
  QrzAuthError,
  QrzNetworkError,
  QrzUnknownActionError,
  type QrzAction,
  type QrzClientConfig,
  type QrzResponse
} from '../index'

describe('index exports', () => {
  it('should export QrzApiClient as default', () => {
    expect(QrzApiClient).toBeDefined()
    expect(new QrzApiClient({ apiKey: 'test', userAgent: 'test/1.0.0' })).toBeInstanceOf(QrzApiClient)
  })

  it('should export error classes', () => {
    expect(QrzError).toBeDefined()
    expect(QrzAuthError).toBeDefined()
    expect(QrzNetworkError).toBeDefined()
    expect(QrzUnknownActionError).toBeDefined()
  })

  it('should export types', () => {
    const config: QrzClientConfig = { apiKey: 'test', userAgent: 'test/1.0.0' }
    expect(config).toBeDefined()

    const action: QrzAction = 'STATUS'
    expect(action).toBeDefined()

    const response: QrzResponse = {
      result: 'OK'
    }
    expect(response).toBeDefined()
  })
})