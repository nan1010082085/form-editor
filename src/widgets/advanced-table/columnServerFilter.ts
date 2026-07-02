import type { AdvancedTableColumn } from './config'

/** 将 el-table filter-change 事件转为 API 查询参数（E-30） */
export function buildServerFilterParams(
  filters: Record<string, unknown>,
  columns: AdvancedTableColumn[],
): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const col of columns) {
    if (!col.filterable || !col.prop) continue
    const key = col.prop
    const raw = filters[key]
    if (raw == null) {
      params[key] = undefined
      continue
    }
    const values = Array.isArray(raw) ? raw : [raw]
    if (values.length === 0) {
      params[key] = undefined
    } else {
      params[key] = values.length === 1 ? values[0] : values
    }
  }
  return params
}

/** 配置了 API 且存在 filterable 列时，默认走服务端筛选 */
export function shouldUseServerSideFilter(
  props: Record<string, unknown> | undefined,
  hasApiUrl: boolean,
  columns: AdvancedTableColumn[],
): boolean {
  if (props?.serverSideFilter === false) return false
  if (props?.serverSideFilter === true) return true
  return hasApiUrl && columns.some((c) => c.filterable)
}
