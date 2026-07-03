<script setup lang="ts">
/**
 * FgSingleCol — 单列布局容器
 */
import { inject, computed } from 'vue'
import { widgetDataKey } from '../base/types'
import type { Widget } from '../base/types'
import SchemaRender from '../../components/WidgetRenderer/SchemaRender.vue'
import FlexColDropZone from '../../components/Editor/FlexColDropZone.vue'
import styles from './style.module.scss'

defineProps<{ editable?: boolean; editorSelectable?: boolean }>()

const widgetData = inject(widgetDataKey)!

const gutter = computed(() => (widgetData.value.props?.gutter as number) || 0)
const colWidths = computed(() => (widgetData.value.props?.colWidths as number[]) || [0])
const columnCount = computed(() => colWidths.value.length)
const allChildren = computed(() => (widgetData.value.children ?? []) as Widget[])
const parentId = computed(() => widgetData.value.id ?? '')

function getChildrenByCol(colIndex: number): Widget[] {
  return widgetData.value.children?.filter(
    (c) => (c.colIndex ?? 0) === colIndex,
  ) || []
}

function colStyle(idx: number): Record<string, string> {
  const w = colWidths.value[idx] ?? 0
  if (w > 0) {
    return { flex: `0 0 ${w}px` }
  }
  return { flex: '1 1 0' }
}
</script>

<template>
  <div :class="styles.colContainer" :style="{ gap: gutter + 'px' }">
    <div
      v-for="col in columnCount"
      :key="col"
      :class="styles.col"
      :style="colStyle(col - 1)"
    >
      <div :class="styles.colContent">
        <FlexColDropZone
          v-if="editorSelectable && parentId"
          :parent-id="parentId"
          :col-index="col - 1"
          :all-children="allChildren"
          :editor-selectable="editorSelectable"
        />
        <template v-else>
          <SchemaRender :widgets="getChildrenByCol(col - 1)" />
          <div v-if="editable && getChildrenByCol(col - 1).length === 0" :class="styles.colGhost">
            拖入部件
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
