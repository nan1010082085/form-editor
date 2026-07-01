<script setup lang="ts">
import { inject, computed } from 'vue'
import { widgetDataKey } from '../base/types'
import './FgTransfer.module.scss'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useDynamicOptions } from '../../composables/useDynamicOptions'
import { useWidgetControlSize } from '../../composables/useWidgetControlSize'

const widgetData = inject(widgetDataKey)!
const { widgetWidth, controlStyle } = useWidgetControlSize(300, 700)

useExposeWidget((wd) => ({
  get value() { return wd.value.defaultValue },
}))

const { options: dynamicOptions } = useDynamicOptions(
  computed(() => widgetData.value.api),
)

const transferData = computed(() => {
  const opts = dynamicOptions.value.length
    ? dynamicOptions.value
    : (widgetData.value.options ?? [])
  return opts.map(opt => ({
    key: opt.value,
    label: opt.label,
    disabled: opt.disabled,
  }))
})

const selectedKeys = computed({
  get: () => {
    const val = widgetData.value.defaultValue
    return Array.isArray(val) ? val as Array<string | number> : []
  },
  set: (keys: Array<string | number>) => {
    widgetData.value.defaultValue = keys
  },
})

const dynamicStyle = computed(() => ({
  fontSize: controlStyle.value.fontSize,
  color: controlStyle.value.color,
}))

const titles = computed(() => [
  (widgetData.value.props?.leftTitle as string) || '待选',
  (widgetData.value.props?.rightTitle as string) || '已选',
])

const panelWidth = computed(() => {
  const totalW = widgetWidth.value
  const btnArea = 124
  return Math.max(120, (totalW - btnArea) / 2)
})

const transferStyle = computed(() => ({
  ...dynamicStyle.value,
  '--transfer-panel-width': `${panelWidth.value}px`,
}))
</script>

<template>
  <el-transfer
    v-model="selectedKeys"
    :data="transferData"
    :titles="titles"
    :filterable="widgetData.props?.filterable !== false"
    :style="transferStyle"
  />
</template>
