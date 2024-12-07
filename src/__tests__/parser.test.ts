import { describe, it, expect } from 'vitest'
import { parseQrzResponse } from '../parser'

describe('parseQrzResponse', () => {
  it('should convert snake_case to camelCase', () => {
    const input = 'END_DATE=2023-12-31&START_TIME=10:00&LAST_MODIFIED_BY=admin'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      endDate: '2023-12-31',
      startTime: '10:00',
      lastModifiedBy: 'admin'
    })
  })

  it('should decode URL encoded values', () => {
    const input = 'FIRST_NAME=John%20Doe&HOME_LOCATION=New%20York'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      firstName: 'John Doe',
      homeLocation: 'New York'
    })
  })

  it('should handle empty values', () => {
    const input = 'FIRST_NAME=&LAST_NAME=Smith'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      firstName: '',
      lastName: 'Smith'
    })
  })

  it('should parse a real QRZ API response', () => {
    const input = 'CALLSIGN=KB0ICT&CONFIRMED=2849&COUNT=4148&BOOK_NAME=KB0ICT Logbook&END_DATE=2030-09-05&DXCC_COUNT=44&BOOKID=273699&RESULT=OK&OWNER=KB0ICT&ACTION=STATUS&START_DATE=2020-09-01'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      callsign: 'KB0ICT',
      confirmed: '2849',
      count: '4148',
      bookName: 'KB0ICT Logbook',
      endDate: '2030-09-05',
      dxccCount: '44',
      bookid: '273699',
      result: 'OK',
      owner: 'KB0ICT',
      action: 'STATUS',
      startDate: '2020-09-01'
    })
  })

  it('should handle error responses', () => {
    const input = 'RESULT=FAIL&REASON=unrecognized command&STATUS=FAIL'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      result: 'FAIL',
      reason: 'unrecognized command',
      status: 'FAIL'
    })
  })

  it('should handle auth error responses', () => {
    const input = 'RESULT=AUTH&REASON=invalid api key'
    const result = parseQrzResponse(input)
    expect(result).toEqual({
      result: 'AUTH',
      reason: 'invalid api key'
    })
  })
})