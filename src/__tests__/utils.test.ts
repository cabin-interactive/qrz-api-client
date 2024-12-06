// utils.test.ts
import { describe, it, expect } from 'vitest'
import { parseQRZResponse } from '../utils.ts'

describe('parseQRZResponse', () => {
  it('should parse a simple key-value response', () => {
    const input = 'KEY=value'
    const result = parseQRZResponse(input)
    expect(result).toEqual({ key: 'value' })
  })

  it('should parse multiple key-value pairs', () => {
    const input = 'KEY1=value1&KEY2=value2&KEY3=value3'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    })
  })

  it('should convert snake_case to camelCase', () => {
    const input = 'END_DATE=2023-12-31&START_TIME=10:00&LAST_MODIFIED_BY=admin'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      endDate: '2023-12-31',
      startTime: '10:00',
      lastModifiedBy: 'admin'
    })
  })

  it('should handle multiple underscores', () => {
    const input = 'VERY_LONG_FIELD_NAME=value'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      veryLongFieldName: 'value'
    })
  })

  it('should decode URL encoded values', () => {
    const input = 'FIRST_NAME=John%20Doe&HOME_LOCATION=New%20York'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      firstName: 'John Doe',
      homeLocation: 'New York'
    })
  })

  it('should handle empty values', () => {
    const input = 'FIRST_NAME=&LAST_NAME=Smith'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      firstName: '',
      lastName: 'Smith'
    })
  })

  it('should handle special characters in values', () => {
    const input = 'SPECIAL_CHARS=%21%40%23%24%25%5E%26'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      specialChars: '!@#$%^&'
    })
  })

  it('should handle a real QRZ API response', () => {
    const input = 'ACTION=STATUS&CALLSIGN=KB0ICT&OWNER=KB0ICT&END_DATE=2030-09-05&COUNT=4148&CONFIRMED=2849&BOOK_ID=12345&START_DATE=2020-09-01'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      action: 'STATUS',
      callsign: 'KB0ICT',
      owner: 'KB0ICT',
      endDate: '2030-09-05',
      count: '4148',
      confirmed: '2849',
      bookId: '12345',
      startDate: '2020-09-01'
    })
  })

  it('should preserve keys without underscores', () => {
    const input = 'ACTION=status&count=123&simple=value'
    const result = parseQRZResponse(input)
    expect(result).toEqual({
      action: 'status',
      count: '123',
      simple: 'value'
    })
  })
})