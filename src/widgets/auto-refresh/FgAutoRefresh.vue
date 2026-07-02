<script setup lang="ts">
/** E-09 — 大屏自动刷新：定时调用目标组件 exposed.refresh 或 triggerEvent('refresh') */
import { inject, computed, ref, onMounted, onUnmounted, type Ref } from 'vue'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
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
    <span>自动刷新 {{ countdown }}s</span>
    <span v-if="lastRefreshAt">· {{ lastRefreshAt }}</span>
  </div>
</template>
