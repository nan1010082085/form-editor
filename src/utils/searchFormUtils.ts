import type { FormFieldValue } from '@/components/WidgetRenderer/types'
import type { SearchFieldSchema } from '@/components/WidgetRenderer/types'

function isEmptyValue(value: FormFieldValue): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/** 从字段 schema 初始化搜索表单值 */
export function initSearchFormValues(fields: SearchFieldSchema[]): Record<string, FormFieldValue> {
  const values: Record<string, FormFieldValue> = {}
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      values[field.field] = field.defaultValue
      continue
    }
    if (field.type === 'checkbox') {
      values[field.field] = false
    } else if (field.type === 'date-range') {
      values[field.field] = []
    } else {
      values[field.field] = ''
    }
  }
  return values
}

/** 将搜索表单值转为 API 查询参数 */
export function buildSearchParams(
  fields: SearchFieldSchema[],
  form: Record<string, FormFieldValue>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {}

  for (const field of fields) {
    const raw = form[field.field]
    if (isEmptyValue(raw)) continue

    if (field.type === 'date-range' && Array.isArray(raw)) {
      const startKey = String(field.props?.rangeStartField ?? `${field.field}Start`)
      const endKey = String(field.props?.rangeEndField ?? `${field.field}End`)
      const [start, end] = raw
      if (start) params[startKey] = start
      if (end) params[endKey] = end
      continue
    }

    if (field.type === 'checkbox') {
      if (raw === true) params[field.field] = true
      continue
    }

    params[field.field] = raw
  }

  return params
}
