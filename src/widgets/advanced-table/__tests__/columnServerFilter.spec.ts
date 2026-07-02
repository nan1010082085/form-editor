import { describe, expect, it } from 'vitest'
import { buildServerFilterParams, shouldUseServerSideFilter } from '../columnServerFilter'
import type { AdvancedTableColumn } from '../config'

describe('columnServerFilter (E-30)', () => {
  const cols: AdvancedTableColumn[] = [
    { prop: 'status', label: '状态', filterable: true },
    { prop: 'title', label: '标题' },
  ]

  it('buildServerFilterParams maps single filter value', () => {
    const params = buildServerFilterParams({ status: ['approved'] }, cols)
    expect(params).toEqual({ status: 'approved', title: undefined })
  })

  it('buildServerFilterParams clears removed filters', () => {
    const params = buildServerFilterParams({ status: [] }, cols)
    expect(params.status).toBeUndefined()
  })

  it('shouldUseServerSideFilter auto when API + filterable column', () => {
    expect(shouldUseServerSideFilter(undefined, true, cols)).toBe(true)
    expect(shouldUseServerSideFilter({ serverSideFilter: false }, true, cols)).toBe(false)
    expect(shouldUseServerSideFilter(undefined, false, cols)).toBe(false)
  })
})
