import { describe, it, expect, beforeEach } from 'vitest'
import QrzClient from '../index'

describe('QrzClient', () => {
  let client: QrzClient

  beforeEach(() => {
    client = new QrzClient({
      apiKey: 'abcd-efgh-ijkl-mnop',
    })
  })

  it('should create an instance with config', () => {
    expect(client).toBeInstanceOf(QrzClient)
  })

})