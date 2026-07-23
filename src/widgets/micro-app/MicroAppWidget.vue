<script setup lang="ts">
/**
 * MicroAppWidget — 微应用嵌入 Widget（编辑器占位）
 *
 * 在编辑器画布中显示为灰色占位容器，
 * 预览/发布时由运行时渲染器通过 <micro-app> 标签加载实际微应用。
 */
import { inject, computed } from 'vue'
import { widgetDataKey } from '../base/types'
import { useI18n } from '@schema-platform/platform-shared'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!

const appName = computed(() => widgetData.value.props?.name as string ?? '')
const appUrl = computed(() => widgetData.value.props?.url as string ?? '')
const width = computed(() => (widgetData.value.props?.width as string) || '100%')
const height = computed(() => (widgetData.value.props?.height as string) || '400px')
const isIframe = computed(() => widgetData.value.props?.iframe as boolean ?? false)
</script>

<template>
  <div :class="$style.container" :style="{ width, height }">
    <div v-if="!appName || !appUrl" :class="$style.placeholder">
      {{ t('editor.microApp.configHint') }}
    </div>
    <div v-else :class="$style.placeholder">
      <span :class="$style.appName">{{ appName }}</span>
      <span :class="$style.mode">{{ isIframe ? t('editor.microApp.iframeMode') : t('editor.microApp.defaultMode') }}</span>
    </div>
  </div>
</template>

<style module>
.container {
  position: relative;
  overflow: hidden;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
}

.appName {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.mode {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
