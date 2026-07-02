import { describe, it, expect } from 'vitest'
import type { SearchField } from '../config'

function buildSearchParams(fields: SearchField[], form: Record<string, string>): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const field of fields) {
    const val = form[field.field]
    if (val !== undefined && val !== '') params[field.field] = val
  }
  return params
}

describe('advanced-table searchBar (E-32)', () => {
  const fields: SearchField[] = [
    { field: 'keyword', label: '关键词', type: 'input' },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      options: [{ label: '审批中', value: 'submitted' }],
    },
  ]

  it('builds params from non-empty search form values', () => {
    expect(buildSearchParams(fields, { keyword: '请假', status: 'submitted' })).toEqual({
      keyword: '请假',
      status: 'submitted',
    })
  })

  it('omits empty search values', () => {
    expect(buildSearchParams(fields, { keyword: '', status: '' })).toEqual({})
  })
})
