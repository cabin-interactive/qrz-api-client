// index.test.ts
import { describe, it, expect } from 'vitest'
import QrzApiClient, {
  QrzError,
  QrzAuthError,
  QrzNetworkError,
  QrzUnknownActionError,
  type QrzAction,
  type QrzConfig,
  type QrzResponse
} from '../index'

describe('index exports', () => {
  it('should export QrzApiClient as default', () => {
    expect(QrzApiClient).toBeDefined()
    expect(new QrzApiClient({ apiKey: 'test' })).toBeInstanceOf(QrzApiClient)
  })

  it('should export error classes', () => {
    expect(QrzError).toBeDefined()
    expect(QrzAuthError).toBeDefined()
    expect(QrzNetworkError).toBeDefined()
    expect(QrzUnknownActionError).toBeDefined()
  })

  it('should export types', () => {
    const config: QrzConfig = { apiKey: 'test' }
    expect(config).toBeDefined()

    const action: QrzAction = 'STATUS'
    expect(action).toBeDefined()

    // We can't directly test types, but we can verify they're importable
    const response: QrzResponse = {
      result: 'OK'
    }
    expect(response).toBeDefined()
  })
})