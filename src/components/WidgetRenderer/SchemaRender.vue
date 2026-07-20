<script setup lang="ts">
/**
 * SchemaRender — Widget 递归渲染引擎
 *
 * 两条渲染路径：
 * 1. widgets prop → SchemaNode（绝对定位，编辑器画布）
 * 2. schema prop → WidgetNode（流式布局，WidgetRenderer 预览/发布/运行时）
 *
 * 自由布局编辑模式下启用视口剔除（仅 DOM 层，不影响交互命中）。
 */
import { computed, inject, type Ref } from 'vue'
import type { Widget, PartialWidget } from '../../widgets/base/types'
import type { FormData } from './types'
import SchemaNode from './SchemaNode.vue'
import WidgetNode from './WidgetNode.vue'
import {
  VIEWPORT_CULLING_KEY,
  isWidgetVisibleInViewport,
  type ViewportRect,
} from '../../composables/useViewportCulling'

const props = defineProps<{
  /** Widget-based absolute rendering (editor canvas) */
  widgets?: Widget[]
  mode?: 'edit' | 'preview'
  /** Single Widget flow rendering (WidgetRenderer) */
  schema?: PartialWidget
  formData?: FormData
  editable?: boolean
  isDragging?: boolean
  readonly?: boolean
  path?: number[]
  editorSelectable?: boolean
  /** 画布绝对坐标偏移（嵌套容器内子部件剔除用） */
  canvasOffsetX?: number
  canvasOffsetY?: number
}>()

const viewport = inject(VIEWPORT_CULLING_KEY, null) as Ref<ViewportRect | null> | null

const cullingActive = computed(() => props.mode === 'edit' && !!viewport?.value)

function widgetCanvasRect(widget: Widget) {
  const pos = widget.position
  const ox = props.canvasOffsetX ?? 0
  const oy = props.canvasOffsetY ?? 0
  if (!pos) return { x: ox, y: oy, w: 0, h: 0 }
  return { x: ox + pos.x, y: oy + pos.y, w: pos.w, h: pos.h }
}

function shouldRender(widget: Widget): boolean {
  if (!cullingActive.value) return true
  const { x, y, w, h } = widgetCanvasRect(widget)
  return isWidgetVisibleInViewport(x, y, w, h, viewport!.value)
}

function placeholderStyle(widget: Widget): Record<string, string> {
  const pos = widget.position
  if (!pos) return { display: 'none' }
  return {
    position: 'absolute',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${pos.w}px`,
    height: `${pos.h}px`,
    pointerEvents: 'none',
    visibility: 'hidden',
  }
}
</script>

<template>
  <!-- Editor canvas: absolute positioning via SchemaNode -->
  <template v-if="widgets" v-for="widget in widgets" :key="widget.id">
    <SchemaNode
      v-if="shouldRender(widget)"
      :widget="widget"
      :mode="mode"
      :canvas-offset-x="canvasOffsetX ?? 0"
      :canvas-offset-y="canvasOffsetY ?? 0"
    />
    <div v-else :style="placeholderStyle(widget)" aria-hidden="true" />
  </template>

  <!-- WidgetRenderer: flow layout via WidgetNode -->
  <WidgetNode
    v-else-if="schema"
    :widget="schema"
    :form-data="formData"
    :readonly="readonly"
    :editor-selectable="editorSelectable"
  />
</template>
