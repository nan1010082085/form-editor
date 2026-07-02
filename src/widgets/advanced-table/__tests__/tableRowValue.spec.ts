import { describe, it, expect } from 'vitest'
import { getRowCellValue } from '../tableRowValue'

describe('getRowCellValue', () => {
  it('reads flat prop', () => {
    expect(getRowCellValue({ name: 'Alice' }, 'name')).toBe('Alice')
  })

  it('reads nested data.xxx prop', () => {
    const row = {
      _id: 'sub1',
      data: { applicantName: 'Bob', days: 3 },
    }
    expect(getRowCellValue(row, 'data.applicantName')).toBe('Bob')
    expect(getRowCellValue(row, 'data.days')).toBe(3)
  })

  it('returns undefined for missing path', () => {
    expect(getRowCellValue({ data: {} }, 'data.missing')).toBeUndefined()
  })
})
