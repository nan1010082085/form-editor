import type { DictItem } from '@/components/WidgetRenderer/types'
import type { AdvancedTableColumn } from './config'

export function resolveColumnOptions(
  col: AdvancedTableColumn,
  dictMap?: Record<string, DictItem[]>,
): Array<{ label: string; value: string | number }> | undefined {
  if (col.options?.length) return col.options
  if (col.dictCode && dictMap?.[col.dictCode]) {
    return dictMap[col.dictCode].map(d => ({
      label: d.label,
      value: d.value as string | number,
    }))
  }
  return undefined
}

export function resolveColumnColorMap(
  col: AdvancedTableColumn,
  dictItems?: DictItem[],
): Record<string, string> | undefined {
  if (col.colorMap) return col.colorMap
  if (!dictItems?.length) return undefined
  const map: Record<string, string> = {}
  for (const item of dictItems) {
    const extra = item as DictItem & { type?: string; color?: string }
    const tagType = extra.type ?? extra.color
    if (tagType) map[String(item.value)] = tagType
  }
  return Object.keys(map).length > 0 ? map : undefined
}

/** 合并 dictCode 解析结果，供渲染与筛选使用 */
export function resolveEffectiveColumn(
  col: AdvancedTableColumn,
  dictMap?: Record<string, DictItem[]>,
): AdvancedTableColumn {
  const dictItems = col.dictCode ? dictMap?.[col.dictCode] : undefined
  const options = resolveColumnOptions(col, dictMap)
  const colorMap = resolveColumnColorMap(col, dictItems)
  return {
    ...col,
    ...(options ? { options } : {}),
    ...(colorMap ? { colorMap } : {}),
  }
}
