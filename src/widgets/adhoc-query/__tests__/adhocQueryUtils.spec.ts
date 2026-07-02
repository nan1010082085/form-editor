import { describe, expect, it } from 'vitest'
import { buildAdhocFilterParams, emptyAdhocCondition } from '../adhocQueryUtils'

describe('adhocQueryUtils (E-20)', () => {
  it('buildAdhocFilterParams skips empty rows', () => {
    expect(buildAdhocFilterParams([
      { field: 'keyword', operator: 'contains', value: '请假' },
      emptyAdhocCondition(),
    ])).toEqual({ keyword: '请假', keywordOp: 'contains' })
  })

  it('buildAdhocFilterParams maps eq operator', () => {
    expect(buildAdhocFilterParams([
      { field: 'status', operator: 'eq', value: 'approved' },
    ])).toEqual({ status: 'approved' })
  })
})
