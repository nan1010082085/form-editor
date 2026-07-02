<script setup lang="ts">
/** E-07 — 树形表格：部门/菜单等层级数据 */
import { inject, computed, ref, onMounted, type ComputedRef } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { fetchWidgetDataSource } from '@/api/widgetApi'
import { resolveWidgetUrl } from '@/utils/resolveWidgetUrl'
import type { TreeTableColumn } from './config'
import { treeTableMockRows } from './mock'
import { WIDGET_SURFACE_KEY, shouldUseWidgetMock } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime')
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  'variablesContext',
  computed(() => ({})),
)

const treeData = ref<Record<string, unknown>[]>([])
const loading = ref(false)

const columns = computed<TreeTableColumn[]>(() =>
  (widgetData.value.props?.columns as TreeTableColumn[]) ?? [],
)
const rowKey = computed(() => (widgetData.value.props?.rowKey as string) || 'id')
const childrenKey = computed(() => (widgetData.value.props?.childrenKey as string) || 'children')
const defaultExpandAll = computed(() => widgetData.value.props?.defaultExpandAll !== false)
const stripe = computed(() => widgetData.value.props?.stripe !== false)
const border = computed(() => widgetData.value.props?.border !== false)
const tableHeight = computed(() => (widgetData.value.props?.height as number) ?? 560)

useExposeWidget(() => ({
  get loading() { return loading.value },
  get treeData() { return treeData.value },
  refresh: loadData,
}))

function normalizeTree(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[]
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[]
  }
  return []
}

async function loadData() {
  const api = widgetData.value.api
  if (shouldUseWidgetMock(surface, Boolean(api?.url))) {
    treeData.value = treeTableMockRows
    return
  }
  if (!api?.url) return

  loading.value = true
  try {
    const url = resolveWidgetUrl(api.url, variablesContext.value)
    const resp = await fetchWidgetDataSource<unknown>(url)
    treeData.value = normalizeTree(resp)
  } catch (err) {
    console.error('[FgTreeTable] load failed:', err)
    treeData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadData() })
</script>

<template>
  <div :class="styles.wrap">
    <el-table
      v-loading="loading"
      :data="treeData"
      :row-key="rowKey"
      :tree-props="{ children: childrenKey }"
      :default-expand-all="defaultExpandAll"
      :stripe="stripe"
      :border="border"
      :height="tableHeight"
      style="width: 100%"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :min-width="col.minWidth"
        :width="col.width"
        :align="col.align"
      />
    </el-table>
  </div>
</template>
