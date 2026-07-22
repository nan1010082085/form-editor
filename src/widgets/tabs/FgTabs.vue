<script setup lang="ts">
/**
 * FgTabs - 页签容器 Widget
 *
 * 职责：
 * - el-tabs 包裹，支持多标签页
 * - 渲染 tab headers（标签头）
 *
 * 子组件渲染：
 * - free 模式：由 SchemaNode 的 childrenLayer 以绝对坐标定位，FgTabs 不消费 slot
 * - flex 模式：WidgetNode 通过默认 slot 传入当前页签的子节点，FgTabs 渲染在 tab 内容区
 */
import { inject, ref, computed, watch } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import styles from './style.module.scss'

const props = defineProps<{
  editable?: boolean
  editorSelectable?: boolean
  /** flex 模式下由父级（WidgetNode）通过 slot 传入子节点并设为 true；free 模式（SchemaNode）不传，子节点由 childrenLayer 渲染 */
  renderChildren?: boolean
}>()

const widgetData = inject(widgetDataKey)!
useExposeWidget(() => ({
  get activeKey() { return activeKey.value },
}))

interface TabItem {
  key: string
  label: string
}

const tabs = computed<TabItem[]>(() => {
  const raw = widgetData.value.props?.tabs
  return Array.isArray(raw) ? raw as TabItem[] : []
})

const activeKey = ref((widgetData.value.props?.activeKey as string) || tabs.value[0]?.key || 'tab1')

const tabType = computed(() => {
  const t = widgetData.value.props?.type as string
  return t === 'card' ? 'card' : undefined
})

const tabPosition = computed(() => {
  const pos = widgetData.value.props?.tabPosition as string
  return ['top', 'right', 'bottom', 'left'].includes(pos)
    ? pos as 'top' | 'right' | 'bottom' | 'left'
    : 'top'
})

const closable = computed(() => Boolean(widgetData.value.props?.closable))
const addable = computed(() => Boolean(widgetData.value.props?.addable))
const stretch = computed(() => Boolean(widgetData.value.props?.stretch))

/**
 * 是否渲染默认 slot（子节点）。
 * - free 模式：SchemaNode 不传 renderChildren（默认 false），子节点由 childrenLayer 绝对定位渲染
 * - flex 模式：WidgetNode 传 renderChildren=true，通过 slot 传入子节点（编辑态过滤后+拖放区，预览态全量）
 */
const shouldRenderSlot = computed(() => Boolean(props.renderChildren))

watch(activeKey, (key) => {
  if (widgetData.value.props) {
    widgetData.value.props.activeKey = key
  }
})

defineExpose({ activeKey })
</script>

<template>
  <div :class="styles.tabsContainer">
    <el-tabs
      v-model="activeKey"
      :type="tabType"
      :tab-position="tabPosition"
      :closable="closable"
      :addable="addable"
      :stretch="stretch"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      />
    </el-tabs>
    <!-- Flex 模式：渲染当前页签子节点（由 WidgetNode 通过默认 slot 传入） -->
    <div v-if="shouldRenderSlot" :class="styles.tabContent">
      <slot />
    </div>
  </div>
</template>
