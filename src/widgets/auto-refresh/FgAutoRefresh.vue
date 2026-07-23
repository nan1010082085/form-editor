<script setup lang="ts">
/** E-09 — 大屏自动刷新：定时调用目标组件 exposed.refresh 或 triggerEvent('refresh') */
import { inject, computed, ref, onMounted, onUnmounted, type Ref } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { WIDGET_SURFACE_KEY, type WidgetSurface } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const { t } = useI18n()
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const eventCtx = inject(EVENT_CONTEXT_KEY, null)
const exposedContext = inject<Ref<Record<string, Record<string, unknown>>> | null>('exposedContext', null)

const tickCount = ref(0)
const lastRefreshAt = ref('')
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const intervalSeconds = computed(() => {
  const n = Number(widgetData.value.props?.intervalSeconds ?? 30)
  return Number.isFinite(n) && n >= 5 ? n : 30
})

const showStatus = computed(() => widgetData.value.props?.showStatus !== false)

const targetIds = computed(() => {
  const raw = String(widgetData.value.props?.targets ?? '')
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
})

function refreshTargets() {
  const ids = targetIds.value
  const exposed = exposedContext?.value ?? {}
  for (const id of ids) {
    const state = exposed[id]
    if (state && typeof state.refresh === 'function') {
      ;(state.refresh as () => void)()
    } else if (eventCtx?.triggerEvent) {
      eventCtx.triggerEvent(id, 'refresh')
    }
  }
  tickCount.value += 1
  lastRefreshAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  countdown.value = intervalSeconds.value
}

function startTimer() {
  countdown.value = intervalSeconds.value
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      refreshTargets()
    }
  }, 1000)
}

onMounted(() => {
  if (surface === 'editor') {
    lastRefreshAt.value = t('editor.autoRefresh.designerPreview')
    countdown.value = intervalSeconds.value
    return
  }
  refreshTargets()
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

useExposeWidget(() => ({
  get lastRefreshAt() { return lastRefreshAt.value },
  get tickCount() { return tickCount.value },
  refresh: refreshTargets,
}))
</script>

<template>
  <div v-if="showStatus" :class="styles.container">
    <span :class="styles.dot" />
    <span v-if="surface === 'editor'">{{ t('editor.autoRefresh.previewStatus', { interval: intervalSeconds }) }}</span>
    <span v-else>{{ t('editor.autoRefresh.countdownStatus', { countdown }) }}</span>
    <span v-if="lastRefreshAt">· {{ lastRefreshAt }}</span>
  </div>
</template>
