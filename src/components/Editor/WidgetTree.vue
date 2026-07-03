<script setup lang="ts">
/**
 * WidgetTree — Widget 结构树面板
 *
 * 树形展示画布内所有 Widget 的层级结构，支持：
 * - 容器节点可展开/折叠
 * - 点击节点选中对应画布部件
 * - 双向同步选中状态
 */
import { computed, ref, watch, nextTick } from 'vue'
import { useWidgetStore } from '../../stores/widget'
import { useEditorStore } from '../../stores/editor'
import type { Widget } from '../../widgets/base/types'
import { getWidget } from '../../widgets/registry'
import { getAllContainerTypes } from '../../composables/useConstant'
import { scrollToWidget, scrollTreeNodeIntoView } from '../../utils/editorScroll'
import styles from './WidgetTree.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'

const widgetStore = useWidgetStore()
const editorStore = useEditorStore()

// ---- 树节点类型 ----

interface TreeNode {
  id: string
  label: string
  type: string
  tabKey?: string
  colIndex?: number
  isContainer: boolean
  children: TreeNode[]
  widget: Widget
}

// ---- 构建树 ----

function buildTree(widgets: Widget[]): TreeNode[] {
  const containerTypes = getAllContainerTypes()
  return widgets.map(w => ({
    id: w.id,
    label: w.label || getWidget(w.type)?.displayName || w.type,
    type: w.type,
    tabKey: w.tabKey,
    colIndex: w.colIndex,
    isContainer: containerTypes.has(w.type),
    children: w.children?.length ? buildTree(w.children) : [],
    widget: w,
  }))
}

const treeData = computed(() => buildTree(widgetStore.widgets))

// ---- 展开状态（由 el-tree default-expand-all 管理） ----

const treeRef = ref()

// ---- 选中 ----

const selectedId = computed(() => editorStore.selectedId || '')

function handleNodeClick(node: TreeNode) {
  editorStore.select(node.id)
  nextTick(() => scrollToWidget(node.id))
}

watch(selectedId, (id) => {
  if (!id) return
  nextTick(() => {
    treeRef.value?.setCurrentKey(id)
    scrollTreeNodeIntoView(treeRef.value?.$el as HTMLElement | undefined, id)
  })
})

// ---- 类型图标 ----

const TYPE_ICONS: Record<string, string> = {
  form: 'document', card: 'notebook', tabs: 'menu', dialog: 'chat-dot-round',
  'single-col': 'grid', 'double-col': 'grid', 'triple-col': 'grid', 'quad-col': 'grid',
  input: 'edit', select: 'arrow-down', number: 'sort', radio: 'circle-check', checkbox: 'check',
  date: 'calendar', textarea: 'edit-pen', title: 'document',
  divider: 'minus', spacer: 'rank', 'toolbar-buttons': 'set-up', table: 'grid', button: 'click',
  // 图表部件
  'bar-chart': 'data-board', 'stacked-bar-chart': 'data-board', 'horizontal-bar-chart': 'data-board',
  'line-chart': 'trend-charts', 'area-chart': 'trend-charts',
  'pie-chart': 'pie-chart', 'donut-chart': 'pie-chart',
  'scatter-chart': 'aim', 'bubble-chart': 'aim',
  'gauge': 'odometer', 'multi-gauge': 'odometer',
  'funnel': 'sort', 'compare-funnel': 'sort',
  'heatmap': 'grid', 'radar': 'cpu', 'filled-radar': 'cpu',
  'candlestick': 'data-line',
  'advanced-table': 'grid', 'crud-list-page': 'grid', 'tree-table': 'grid',
  'user-management': 'user', 'role-management': 'user-filled',
  'flow-timeline': 'clock', 'flow-task-actions': 'circle-check',
  kanban: 'menu', calendar: 'calendar', notification: 'bell',
  'compliance-checklist': 'list', 'qr-scanner': 'full-screen',
  'adhoc-query': 'search', 'auto-refresh': 'refresh',
  'user-selector': 'user', 'icon-picker': 'picture',
  'tree-select': 'menu', 'permission-tree': 'menu',
  'dynamic-detail-table': 'grid', iframe: 'link',
  'micro-app': 'connection', 'micro-app-container': 'monitor',
  statistic: 'data-analysis', descriptions: 'document',
}

function getIcon(type: string): string {
  return TYPE_ICONS[type] ?? 'document'
}
</script>

<template>
  <div :class="styles.tree" style="overflow: auto; height: 100%;">
    <div v-if="treeData.length === 0" :class="styles.empty">
      暂无部件
    </div>
    <el-tree
      v-else
      ref="treeRef"
      :data="treeData"
      node-key="id"
      default-expand-all
      highlight-current
      :current-node-key="selectedId"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <div
          :class="styles.node"
        >
          <!-- 图标 -->
          <span :class="styles.icon"><AppIcon :name="getIcon(data.type)" :size="14" /></span>

          <!-- 类型标签 -->
          <span :class="styles.badge">{{ data.label }}</span>

          <!-- 字段名 -->
          <span v-if="data.widget.field" :class="styles.field">{{ data.widget.field }}</span>

          <!-- 页签标识 -->
          <span v-else-if="data.tabKey" :class="styles.tabKey">{{ data.tabKey }}</span>

          <!-- 列索引 -->
          <span v-else-if="data.colIndex != null" :class="styles.colIndex">列 {{ data.colIndex + 1 }}</span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

