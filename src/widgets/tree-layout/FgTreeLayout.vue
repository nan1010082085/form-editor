<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import { widgetDataKey } from '../base/types'
import type { Widget } from '../base/types'
import SchemaRender from '../../components/WidgetRenderer/SchemaRender.vue'
import styles from './style.module.scss'

const props = defineProps<{ editable?: boolean }>()

const widgetData = inject(widgetDataKey)!
const searchKeyword = ref('')

const hasChildren = computed(() => (widgetData.value.children?.length ?? 0) > 0)
const showHeader = computed(() => widgetData.value.props?.showHeader !== false)
const showSearch = computed(() => widgetData.value.props?.showSearch !== false)

const filteredChildren = computed(() => {
  const children = widgetData.value.children ?? []
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return children
  return children.filter((c: Widget) => {
    const label = (c.label || c.field || c.type || '').toLowerCase()
    return label.includes(kw)
  })
})
</script>
<template>
  <div :class="styles.container">
    <div v-if="showHeader" :class="styles.header">{{ (widgetData.props?.title as string) || '侧栏面板' }}</div>
    <div v-if="showSearch" :class="styles.search">
      <el-input
        v-model="searchKeyword"
        :placeholder="(widgetData.props?.searchPlaceholder as string) || '搜索'"
        size="small"
        clearable
      />
    </div>
    <div :class="styles.body">
      <SchemaRender v-if="filteredChildren.length" :widgets="filteredChildren" />
      <div
        v-else-if="props.editable && searchKeyword && hasChildren"
        :class="styles.placeholder"
      >
        无匹配子部件
      </div>
      <div v-else-if="props.editable && !hasChildren" :class="styles.placeholder">拖入部件</div>
    </div>
  </div>
</template>
