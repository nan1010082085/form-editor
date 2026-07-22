<script setup lang="ts">
/**
 * FgAdvancedTableVirtual - advanced-table 的虚拟滚动渲染路径
 *
 * 当 advanced-table 配置 virtual=true 且数据量超过阈值时启用，使用 el-table-v2
 * 渲染 1000+ 行而不卡顿。支持主要列渲染类型：text/tag/link/image/buttons。
 * 不支持的复杂类型（flowStatus/expiryAlert/badge/custom）回退为 text。
 *
 * el-table-v2 与 el-table API 差异较大（columns prop + cellRenderer 函数），
 * 故独立组件，由 FgAdvancedTable 按 virtual 开关切换。
 */
import { computed, h } from 'vue'
import { ElTableV2, ElAutoResizer, ElTag, ElLink, ElImage, ElButton } from 'element-plus'
import type { Component } from 'vue'
import type { AdvancedTableColumn, ActionButton } from './config'
import { getRowCellValue } from './tableRowValue'

const props = defineProps<{
  columns: AdvancedTableColumn[]
  data: Record<string, unknown>[]
  height?: number
  estimatedRowHeight?: number
  fixedColumns?: boolean
}>()

const emit = defineEmits<{
  rowClick: [row: Record<string, unknown>, index: number]
  rowButtonClick: [btn: ActionButton, row: Record<string, unknown>, index: number]
}>()

const tableHeight = computed(() => props.height ?? 400)

/** tag type 解析（复用 advanced-table 的 colorMap 逻辑） */
function getTagType(colorMap: Record<string, string> | undefined, value: unknown): string {
  return colorMap?.[String(value)] ?? 'info'
}

/** option label 解析 */
function getOptionLabel(options: Array<{ label: string; value: string | number }> | undefined, value: unknown): string {
  return options?.find((o) => o.value === value)?.label ?? String(value ?? '')
}

/** el-table-v2 列定义：将 AdvancedTableColumn 转为 cellRenderer 形式 */
const v2Columns = computed(() =>
  props.columns.map((col): Record<string, unknown> => {
    const cellRenderer = ({ rowData, rowIndex }: { rowData: Record<string, unknown>; rowIndex: number }) => {
      const value = getRowCellValue(rowData, col.prop)
      const render = col.render ?? 'text'

      switch (render) {
        case 'tag':
          return h(ElTag as Component, {
            type: getTagType(col.colorMap, value) as never,
            size: 'small',
          }, () => getOptionLabel(col.options, value))

        case 'link':
          return h(ElLink as Component, {
            type: 'primary',
            onClick: (e: Event) => { e.stopPropagation(); emit('rowClick', rowData, rowIndex) },
          }, () => String(value ?? ''))

        case 'image':
          return h(ElImage as Component, {
            src: String(value ?? ''),
            style: { width: (col.imageWidth ?? 40) + 'px', height: (col.imageWidth ?? 40) + 'px' },
            fit: 'cover',
          })

        case 'buttons': {
          const buttons = col.buttons ?? []
          return h(
            'div',
            { style: 'display:flex; gap:4px; align-items:center;' },
            buttons.map((btn) =>
              h(ElButton as Component, {
                type: btn.type ?? undefined,
                size: btn.size ?? 'small',
                link: true,
                onClick: (e: Event) => { e.stopPropagation(); emit('rowButtonClick', btn, rowData, rowIndex) },
              }, () => btn.label),
            ),
          )
        }

        // flowStatus / expiryAlert / badge / custom / text / 默认 -> 文本
        default:
          return h('span', String(value ?? ''))
      }
    }

    return {
      key: col.prop,
      dataKey: col.prop,
      title: col.label,
      width: typeof col.width === 'number' ? col.width : (col.minWidth ?? 120),
      align: col.align ?? 'left',
      fixed: props.fixedColumns ? col.fixed : undefined,
      cellRenderer,
    }
  }),
)

function handleRowClick({ rowData, rowIndex }: { rowData: Record<string, unknown>; rowIndex: number }) {
  emit('rowClick', rowData, rowIndex)
}
</script>

<template>
  <div :style="{ height: tableHeight + 'px' }">
    <ElAutoResizer>
      <template #default="{ height: h, width: w }">
        <ElTableV2
          :columns="v2Columns"
          :data="props.data"
          :width="w"
          :height="h"
          :row-height="props.estimatedRowHeight ?? 48"
          :estimated-row-height="props.estimatedRowHeight ?? 48"
          fixed
          @row-click="handleRowClick"
        />
      </template>
    </ElAutoResizer>
  </div>
</template>
