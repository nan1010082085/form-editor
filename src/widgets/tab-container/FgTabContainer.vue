<script setup lang="ts">
/**
 * FgTabContainer — Tab 容器
 *
 * 内部切换多个子画布，每个 Tab 页可包含独立的 widget 集合。
 * 与 tabs 的区别：tabs 是布局容器，tab-container 支持子画布级 widget 集合。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey, type Widget } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import SchemaRender from '../../components/WidgetRenderer/SchemaRender.vue'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const tabs = computed(() => {
  const raw = widgetData.value.props?.tabs as Array<{ key: string; label: string; children?: Widget[] }> ?? []
  return raw.map(t => ({
    key: t.key,
    label: t.label,
    children: (t.children ?? []) as Widget[],
  }))
})

const activeTab = ref(tabs.value[0]?.key ?? '')

function handleTabChange(key: string) {
  activeTab.value = key
}

const activeChildren = computed(() => {
  const tab = tabs.value.find(t => t.key === activeTab.value)
  return tab?.children ?? []
})

useExposeWidget(() => ({
  get activeTab() { return activeTab.value },
  setActiveTab(key: string) { activeTab.value = key },
}))
</script>

<template>
  <div :class="styles.tabContainer" :style="widgetStyle">
    <div :class="styles.tabHeader">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="[styles.tabItem, { [styles.tabItemActive]: tab.key === activeTab }]"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>
    <div :class="styles.tabBody">
      <SchemaRender v-if="activeChildren.length > 0" :widgets="activeChildren" mode="edit" />
      <div v-else :class="styles.empty">拖拽组件到此 Tab 页</div>
    </div>
  </div>
</template>
