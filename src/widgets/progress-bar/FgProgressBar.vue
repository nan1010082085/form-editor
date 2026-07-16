<script setup lang="ts">
/**
 * FgProgressBar — 进度条/环形进度
 *
 * 支持线性进度条和环形进度两种形态，支持阈值颜色。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const value = computed(() => {
  const v = widgetData.value.props?.value
  return typeof v === 'number' ? v : 0
})
const max = computed(() => (widgetData.value.props?.max as number) ?? 100)
const variant = computed(() => (widgetData.value.props?.variant as string) ?? 'line')
const strokeWidth = computed(() => (widgetData.value.props?.strokeWidth as number) ?? 6)
const showText = computed(() => widgetData.value.props?.showText !== false)
const format = computed(() => (widgetData.value.props?.format as string) ?? 'percent')
const color = computed(() => (widgetData.value.props?.color as string) ?? '')
const thresholds = computed(() => (widgetData.value.props?.thresholds as Array<{ value: number; color: string }>) ?? [])

const percent = computed(() => Math.min(100, Math.max(0, (value.value / max.value) * 100)))

const activeColor = computed(() => {
  for (const t of thresholds.value) {
    if (percent.value <= t.value) return t.color
  }
  return color.value || 'var(--color-primary)'
})

const displayText = computed(() => {
  if (format.value === 'value') return `${value.value} / ${max.value}`
  return `${Math.round(percent.value)}%`
})

useExposeWidget(() => ({
  get percent() { return percent.value },
  get value() { return value.value },
}))
</script>

<template>
  <div :class="styles.progressBar" :style="widgetStyle">
    <template v-if="variant === 'line'">
      <div :class="styles.lineOuter">
        <div
          :class="styles.lineInner"
          :style="{ width: `${percent}%`, backgroundColor: activeColor }"
        />
      </div>
      <span v-if="showText" :class="styles.lineText">{{ displayText }}</span>
    </template>
    <template v-else>
      <div :class="styles.circleOuter" :style="{ width: `${widgetData.props?.size ?? 120}px`, height: `${widgetData.props?.size ?? 120}px` }">
        <svg :class="styles.circleSvg" viewBox="0 0 100 100">
          <circle
            :class="styles.circleBg"
            cx="50" cy="50" r="44"
            fill="none"
            :stroke-width="strokeWidth"
          />
          <circle
            :class="styles.circleFg"
            cx="50" cy="50" r="44"
            fill="none"
            :stroke="activeColor"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            :stroke-dasharray="`${percent * 2.764} 276.4`"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span v-if="showText" :class="styles.circleText">{{ displayText }}</span>
      </div>
    </template>
  </div>
</template>
