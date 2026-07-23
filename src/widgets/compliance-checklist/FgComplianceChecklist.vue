<script setup lang="ts">
import { inject, computed, ref, onMounted } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { WIDGET_SURFACE_KEY, getWidgetMock, type WidgetSurface } from '../base/widgetMock'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'

const { t } = useI18n()

interface CheckItem {
  key: string
  label: string
}

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const checked = ref<Record<string, boolean>>({})
const remark = ref('')

useExposeWidget(() => ({
  get checkedItems() { return checked.value },
  get remark() { return remark.value },
}))

const title = computed(() => (widgetData.value.props?.title as string) || t('editor.complianceChecklist.title'))
const items = computed<CheckItem[]>(() =>
  (widgetData.value.props?.items as CheckItem[]) ?? [],
)

function toggle(key: string, val: boolean) {
  checked.value = { ...checked.value, [key]: val }
}

onMounted(() => {
  if (items.value.length > 0 || surface !== 'editor') return
  const mock = getWidgetMock('compliance-checklist')
  if (mock?.kind !== 'statistic') return
  const mockItems = mock.defaultProps.items as CheckItem[] | undefined
  if (!mockItems?.length) return
  widgetData.value.props = {
    ...widgetData.value.props,
    items: mockItems,
    title: mock.defaultProps.title ?? widgetData.value.props?.title,
  }
})
</script>

<template>
  <div :class="styles.wrapper">
    <h4 v-if="title" :class="styles.title">{{ title }}</h4>
    <el-checkbox
      v-for="item in items"
      :key="item.key"
      :model-value="checked[item.key] ?? false"
      @update:model-value="(v: boolean) => toggle(item.key, v)"
    >
      {{ item.label }}
    </el-checkbox>
    <el-input v-model="remark" type="textarea" :rows="2" :placeholder="t('editor.complianceChecklist.remarkPlaceholder')" :class="styles.remark" />
  </div>
</template>
