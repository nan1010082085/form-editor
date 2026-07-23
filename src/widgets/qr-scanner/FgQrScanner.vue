<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { WIDGET_SURFACE_KEY, type WidgetSurface } from '../base/widgetMock'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const scanValue = ref('')

useExposeWidget(() => ({ get value() { return scanValue.value } }))

const label = computed(() => (widgetData.value.props?.label as string) || t('editor.qrScanner.label'))
const placeholder = computed(() => (widgetData.value.props?.placeholder as string) || t('editor.qrScanner.placeholder'))
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
      {{ t('editor.qrScanner.editorHint') }}
    </p>
    <div :class="styles.row">
      <el-input
        v-model="scanValue"
        :placeholder="placeholder"
        @change="widgetData.defaultValue = scanValue"
      />
      <el-button type="primary" @click="simulateScan">{{ t('editor.qrScanner.simulateScan') }}</el-button>
    </div>
    <p v-if="field" :class="styles.hint">{{ t('editor.qrScanner.boundField', { field }) }}</p>
  </div>
</template>
