import { getNestedValue } from '@/utils/responseNormalizer'

/** 读取表格行单元格值，支持嵌套 prop 路径如 data.applicantName */
export function getRowCellValue(row: Record<string, unknown>, prop: string): unknown {
  if (!prop) return undefined
  return getNestedValue(row, prop)
}
