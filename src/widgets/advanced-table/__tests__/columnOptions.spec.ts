import { describe, it, expect } from 'vitest'
import { resolveColumnOptions, resolveColumnColorMap, resolveEffectiveColumn } from '../columnOptions'
import type { AdvancedTableColumn } from '../config'
import type { DictItem } from '@/components/WidgetRenderer/types'

describe('columnOptions', () => {
  const dictMap: Record<string, DictItem[]> = {
    leave_type: [
      { label: '年假', value: 'annual', type: 'success' },
      { label: '病假', value: 'sick', type: 'warning' },
    ],
  }

  it('prefers explicit options over dictCode', () => {
    const col: AdvancedTableColumn = {
      prop: 'leaveType',
      label: '假别',
      render: 'tag',
      dictCode: 'leave_type',
      options: [{ label: '自定义', value: 'custom' }],
    }
    expect(resolveColumnOptions(col, dictMap)).toEqual([{ label: '自定义', value: 'custom' }])
  })

  it('resolves options from dictCode', () => {
    const col: AdvancedTableColumn = {
      prop: 'leaveType',
      label: '假别',
      render: 'tag',
      dictCode: 'leave_type',
    }
    expect(resolveColumnOptions(col, dictMap)).toEqual([
      { label: '年假', value: 'annual' },
      { label: '病假', value: 'sick' },
    ])
  })

  it('builds colorMap from dict item type', () => {
    const col: AdvancedTableColumn = {
      prop: 'leaveType',
      label: '假别',
      render: 'tag',
      dictCode: 'leave_type',
    }
    expect(resolveColumnColorMap(col, dictMap.leave_type)).toEqual({
      annual: 'success',
      sick: 'warning',
    })
  })

  it('resolveEffectiveColumn merges dict-derived fields', () => {
    const col: AdvancedTableColumn = {
      prop: 'leaveType',
      label: '假别',
      render: 'tag',
      dictCode: 'leave_type',
      filterable: true,
    }
    const effective = resolveEffectiveColumn(col, dictMap)
    expect(effective.options).toHaveLength(2)
    expect(effective.colorMap).toEqual({ annual: 'success', sick: 'warning' })
  })
})
