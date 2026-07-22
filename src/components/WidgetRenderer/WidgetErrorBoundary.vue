<script setup lang="ts">
/**
 * WidgetErrorBoundary - widget 渲染崩溃隔离
 *
 * 基于 Vue 3 onErrorCaptured 捕获子树渲染错误，防止单个 widget 崩溃拖垮整画布。
 * 崩溃时显示「组件渲染异常 + 重置」占位，并上报 telemetry（复用 reportTelemetry）。
 *
 * 用法：
 *   <WidgetErrorBoundary :widget-type="widget.type" :widget-id="widget.id">
 *     <component :is="resolvedComponent" ... />
 *   </WidgetErrorBoundary>
 */
import { ref, onErrorCaptured } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { reportError } from '@schema-platform/platform-shared'
import { reportTelemetryError } from '@/api/telemetryApi'
import styles from './WidgetErrorBoundary.module.scss'

const props = defineProps<{
  widgetType?: string
  widgetId?: string
}>()

const { t } = useI18n()

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err: unknown) => {
  hasError.value = true
  const msg = err instanceof Error ? err.message : String(err)
  errorMessage.value = msg
  const stack = err instanceof Error ? err.stack ?? '' : ''
  // 上报渲染异常到 server /api/telemetry/errors（静默降级，不阻塞）
  void reportTelemetryError(msg, { widgetType: props.widgetType, widgetId: props.widgetId }, stack)
  // 复用平台错误上报
  void reportError(err instanceof Error ? err : new Error(msg), {
    info: `widget render error: ${props.widgetType ?? 'unknown'}`,
  })
  // 阻止错误向上冒泡（不拖垮整画布）
  return false
})

function reset() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="hasError" :class="styles.boundary">
    <AppIcon name="warning-filled" :size="36" :class="styles.icon" />
    <div :class="styles.title">{{ t('editor.widgetState.renderError') }}</div>
    <div :class="styles.desc">{{ t('editor.widgetState.renderErrorDesc') }}</div>
    <div :class="styles.widgetInfo">{{ widgetType }}</div>
    <el-button size="small" @click="reset">
      <AppIcon name="refresh" :size="14" style="margin-right: 4px;" />
      {{ t('editor.widgetState.reset') }}
    </el-button>
  </div>
  <slot v-else />
</template>
