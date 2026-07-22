<script setup lang="ts">
/**
 * WidgetStateShell - widget 统一状态壳
 *
 * 包裹数据型 widget，统一渲染 loading / empty / error 三态，避免每个 widget 各写一套。
 * - loading: skeleton（默认）或 spinner
 * - empty: 空态插画 + 文案
 * - error: 错误信息 + 重试按钮
 * 三态都不命中时渲染 default slot。
 *
 * 用法：
 *   <WidgetStateShell :loading="loading" :error="error" :empty="tableData.length === 0" @retry="fetchData">
 *     <MyTable :data="tableData" />
 *   </WidgetStateShell>
 */
import { useI18n } from '@schema-platform/platform-shared'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './WidgetStateShell.module.scss'

const props = withDefaults(defineProps<{
  loading?: boolean
  error?: string
  empty?: boolean
  /** loading 时用 skeleton（默认）还是 spinner */
  skeleton?: boolean
  /** skeleton 行数 */
  skeletonRows?: number
  /** 空态最小高度 */
  minHeight?: string
}>(), {
  loading: false,
  error: '',
  empty: false,
  skeleton: true,
  skeletonRows: 5,
  minHeight: '200px',
})

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <div :class="styles.shell" :style="{ minHeight: props.minHeight }">
    <!-- loading -->
    <div v-if="props.loading" :class="styles.loading">
      <template v-if="props.skeleton">
        <div v-for="i in props.skeletonRows" :key="i" :class="styles.skeletonRow" />
      </template>
      <template v-else>
        <AppIcon name="loading" :size="28" :class="styles.spinner" />
        <span :class="styles.loadingText">{{ t('editor.widgetState.loading') }}</span>
      </template>
    </div>

    <!-- error -->
    <div v-else-if="props.error" :class="styles.error">
      <AppIcon name="warning-filled" :size="40" :class="styles.errorIcon" />
      <div :class="styles.errorTitle">{{ t('editor.widgetState.error') }}</div>
      <div :class="styles.errorDesc">{{ props.error }}</div>
      <el-button type="primary" size="small" @click="handleRetry">
        <AppIcon name="refresh" :size="14" style="margin-right: 4px;" />
        {{ t('editor.widgetState.retry') }}
      </el-button>
    </div>

    <!-- empty -->
    <div v-else-if="props.empty" :class="styles.empty">
      <AppIcon name="document" :size="40" :class="styles.emptyIcon" />
      <div :class="styles.emptyTitle">{{ t('editor.widgetState.empty') }}</div>
      <div :class="styles.emptyDesc">{{ t('editor.widgetState.emptyDesc') }}</div>
    </div>

    <!-- content -->
    <slot v-else />
  </div>
</template>
