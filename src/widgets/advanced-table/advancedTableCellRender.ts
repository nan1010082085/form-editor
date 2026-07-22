/**
 * advanced-table 单元格渲染辅助函数
 *
 * 从 FgAdvancedTable 抽出的纯函数：tag type / option label / flowStatus / expiry /
 * tooltip / cell value 解析。供 el-table 模板与 FgAdvancedTableVirtual 复用。
 */
import type { AdvancedTableColumn } from './config'
import { getRowCellValue } from './tableRowValue'

/** 解析 tag type（colorMap 映射，无则空串） */
export function getTagType(colorMap?: Record<string, string>, value?: unknown): string {
  if (!colorMap) return ''
  return (colorMap[String(value)] ?? '') as string
}

/** 解析 option label（options 匹配 value，无则原值字符串） */
export function getOptionLabel(
  options?: Array<{ label: string; value: unknown }>,
  value?: unknown,
): string {
  if (!options) return String(value ?? '')
  const found = options.find((o) => o.value === value)
  return found?.label ?? String(value ?? '')
}

const FLOW_STATUS_COLOR: Record<string, string> = {
  running: 'warning',
  completed: 'success',
  terminated: 'danger',
  cancelled: 'info',
}

/** 流程状态标签文本 */
export function getFlowStatusLabel(row: Record<string, unknown>): string {
  const label = row.flowStatusLabel ?? row.flowStatus
  if (label) return String(label)
  return row.status != null ? String(row.status) : '-'
}

/** 流程状态 tag type */
export function getFlowStatusTagType(row: Record<string, unknown>): string {
  const raw = String(row.flowStatus ?? '')
  return FLOW_STATUS_COLOR[raw] ?? ''
}

const EXPIRY_COLOR: Record<string, string> = {
  valid: 'success',
  expiring: 'warning',
  expired: 'danger',
}

/** 到期状态标签文本 */
export function getExpiryLabel(row: Record<string, unknown>): string {
  const status = String(row.expiryStatus ?? row.status ?? '')
  if (status === 'expiring') return '即将到期'
  if (status === 'expired') return '已过期'
  if (status === 'valid') return '有效'
  const days = row.daysUntilDue
  if (typeof days === 'number' && days <= 30) return `${days} 天后到期`
  return status || '-'
}

/** 到期状态 tag type */
export function getExpiryTagType(row: Record<string, unknown>): string {
  const status = String(row.expiryStatus ?? row.status ?? '')
  return EXPIRY_COLOR[status] ?? ''
}

/** tooltip 内容：优先 tooltipField，否则取列值 */
export function getTooltipContent(col: AdvancedTableColumn, row: Record<string, unknown>): string {
  if (col.tooltipField) return String(getRowCellValue(row, col.tooltipField) ?? '')
  return String(getRowCellValue(row, col.prop) ?? '')
}

/** 单元格值（透传 getRowCellValue，便于模板调用） */
export function cellValue(row: Record<string, unknown>, prop: string): unknown {
  return getRowCellValue(row, prop)
}
