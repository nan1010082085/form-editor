<script setup lang="ts">
/**
 * FgRowContainer - 24 栅格行容器（Flex 画布专用）
 *
 * 职责：
 * - 24 栅格系统，每个子节点按 span（1-24）分配宽度
 * - 子节点横向排列，span 之和超过 24 自动换行
 * - 编辑模式：单个顺序拖放区（前/中/后插入），新子节点默认 span=24
 * - 预览模式：直接渲染子节点
 *
 * 与 col 容器区别：col 是固定列数等宽；row-container 是任意 span 自由栅格。
 */
import { inject, computed, ref } from 'vue'
import { widgetDataKey } from '../base/types'
import type { Widget } from '../base/types'
import SchemaRender from '../../components/WidgetRenderer/SchemaRender.vue'
import { useFlexDropZone } from '../../composables/useFlexDropZone'
import { useExposeWidget } from '../../composables/useExposeWidget'
import styles from './style.module.scss'

const props = defineProps<{ editable?: boolean; editorSelectable?: boolean }>()

const widgetData = inject(widgetDataKey)!

useExposeWidget(() => ({
  get children() { return widgetData.value.children ?? [] },
}))

const gutter = computed(() => (widgetData.value.props?.gutter as number) ?? 12)
const children = computed(() => (widgetData.value.children ?? []) as Widget[])

/** 解析子节点 span（1-24），默认 24（满宽独占一行） */
function spanOf(child: Widget): number {
  const s = child.span
  const n = typeof s === 'number' ? s : 24
  return Math.max(1, Math.min(24, n))
}

/** 单元格 flex-basis：span/24 宽度，扣除 gutter 避免溢出换行计算偏差 */
function cellStyle(child: Widget): Record<string, string> {
  const span = spanOf(child)
  const g = gutter.value
  return {
    flex: `0 0 calc(${(span / 24) * 100}% - ${g}px)`,
    maxWidth: `calc(${(span / 24) * 100}% - ${g}px)`,
  }
}

// ---- 编辑态拖放（顺序插入，无过滤，无需 allChildren 映射） ----
const dropRef = ref<HTMLElement | null>(null)
const dropEnabled = computed(() => Boolean(props.editorSelectable && widgetData.value.id))

const {
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useFlexDropZone(
  dropRef,
  () => widgetData.value.id ?? null,
  () => children.value,
  () => dropEnabled.value,
  // 新拖入的子节点默认 span=24（满宽独占一行）
  () => ({ span: 24 }),
)
</script>

<template>
  <div :class="styles.rowContainer" :style="{ gap: gutter + 'px' }">
    <!-- 编辑态：拖放区包裹所有子节点 -->
    <div
      v-if="editorSelectable"
      ref="dropRef"
      :class="[styles.dropZone, isDragOver ? styles.dropZoneActive : '']"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div :class="styles.rowContainer" :style="{ gap: gutter + 'px' }">
        <div
          v-for="(child, ci) in children"
          :key="ci"
          :class="styles.cell"
          :style="cellStyle(child)"
        >
          <div :class="styles.cellContent">
            <SchemaRender
              :schema="child"
              :editor-selectable="editorSelectable"
            />
          </div>
        </div>
      </div>
      <div v-if="!children.length" :class="styles.dropEmpty">
        拖入部件到栅格行（默认占满一行，选中后可调整 span）
      </div>
    </div>

    <!-- 预览态：直接渲染 -->
    <template v-else>
      <div
        v-for="(child, ci) in children"
        :key="ci"
        :class="styles.cell"
        :style="cellStyle(child)"
      >
        <div :class="styles.cellContent">
          <SchemaRender :schema="child" />
        </div>
      </div>
      <div v-if="editable && !children.length" :class="styles.cellGhost">
        拖入部件
      </div>
    </template>
  </div>
</template>
