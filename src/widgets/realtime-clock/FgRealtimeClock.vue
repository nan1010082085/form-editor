<script setup lang="ts">
/**
 * FgRealtimeClock — 实时时钟
 *
 * 大屏必备组件，显示当前日期和时间，支持多种格式。
 */
import { inject, ref, computed, onMounted, onUnmounted } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const showDate = computed(() => widgetData.value.props?.showDate !== false)
const showTime = computed(() => widgetData.value.props?.showTime !== false)
const showWeekday = computed(() => widgetData.value.props?.showWeekday === true)
const format = computed(() => (widgetData.value.props?.format as string) ?? '24h')
const dateFormat = computed(() => (widgetData.value.props?.dateFormat as string) ?? 'YYYY-MM-DD')

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const weekdayKeys = ['weekdaySun', 'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat'] as const

const dateStr = computed(() => {
  const d = now.value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (dateFormat.value === 'YYYY/MM/DD') return `${y}/${m}/${day}`
  return `${y}-${m}-${day}`
})

const timeStr = computed(() => {
  const d = now.value
  let h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const sec = String(d.getSeconds()).padStart(2, '0')
  if (format.value === '12h') {
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${min}:${sec} ${ampm}`
  }
  return `${String(h).padStart(2, '0')}:${min}:${sec}`
})

const weekdayStr = computed(() => t(`editor.realtimeClock.${weekdayKeys[now.value.getDay()]}`))

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

useExposeWidget(() => ({
  get now() { return now.value },
}))
</script>

<template>
  <div :class="styles.clock" :style="widgetStyle">
    <div v-if="showTime" :class="styles.time">{{ timeStr }}</div>
    <div v-if="showDate || showWeekday" :class="styles.dateRow">
      <span v-if="showDate" :class="styles.date">{{ dateStr }}</span>
      <span v-if="showWeekday" :class="styles.weekday">{{ weekdayStr }}</span>
    </div>
  </div>
</template>
