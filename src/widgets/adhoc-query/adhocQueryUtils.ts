import type { AdhocCondition } from './config'

/** 将 Adhoc 条件行转为 API 查询参数（空值忽略） */
export function buildAdhocFilterParams(conditions: AdhocCondition[]): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const row of conditions) {
    if (!row.field || row.value === undefined || row.value === '') continue
    if (row.operator === 'contains') {
      params[row.field] = row.value
      params[`${row.field}Op`] = 'contains'
    } else {
      params[row.field] = row.value
    }
  }
  return params
}

export function emptyAdhocCondition(): AdhocCondition {
  return { field: '', operator: 'eq', value: '' }
}
