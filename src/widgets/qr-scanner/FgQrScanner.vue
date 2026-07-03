<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { WIDGET_SURFACE_KEY, type WidgetSurface } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const scanValue = ref('')

useExposeWidget(() => ({ get value() { return scanValue.value } }))

const label = computed(() => (widgetData.value.props?.label as string) || '扫码录入')
const placeholder = computed(() => (widgetData.value.props?.placeholder as string) || '扫描条码或手动输入')
const field = computed(() => widgetData.value.field as string | undefined)

function simulateScan() {
  scanValue.value = `SCAN-${Date.now()}`
  if (field.value) widgetData.value.defaultValue = scanValue.value
}
</script>

<template>
  <div :class="styles.wrapper">
    <label :class="styles.label">{{ label }}</label>
    <p v-if="surface === 'editor'" :class="styles.preview">
      设计器预览：可模拟扫码；运行时调用设备摄像头或扫码枪
    </p>
    <div :class="styles.row">
      <el-input
        v-model="scanValue"
        :placeholder="placeholder"
        @change="widgetData.defaultValue = scanValue"
      />
      <el-button type="primary" @click="simulateScan">模拟扫码</el-button>
    </div>
    <p v-if="field" :class="styles.hint">绑定字段: {{ field }}</p>
  </div>
</template>
