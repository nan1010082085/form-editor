<script setup lang="ts">
/**
 * FgComparisonCard — 对比卡片
 *
 * 展示两个指标对比（同比/环比），带趋势箭头和百分比。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const title = computed(() => (widgetData.value.props?.title as string) ?? '')
const currentValue = computed(() => widgetData.value.props?.currentValue ?? 0)
const previousValue = computed(() => widgetData.value.props?.previousValue ?? 0)
const unit = computed(() => (widgetData.value.props?.unit as string) ?? '')
const prefix = computed(() => (widgetData.value.props?.prefix as string) ?? '')
const comparisonLabel = computed(() => (widgetData.value.props?.comparisonLabel as string) ?? t('editor.comparisonCard.defaultLabel'))
const precision = computed(() => (widgetData.value.props?.precision as number) ?? 1)

const changePercent = computed(() => {
  const prev = Number(previousValue.value)
  if (prev === 0) return 0
  return ((Number(currentValue.value) - prev) / Math.abs(prev)) * 100
})

const trendDirection = computed(() => {
  if (changePercent.value > 0) return 'up'
  if (changePercent.value < 0) return 'down'
  return 'flat'
})

const formattedValue = computed(() => {
  const v = Number(currentValue.value)
  if (v >= 100000000) return `${(v / 100000000).toFixed(precision.value)}${t('editor.comparisonCard.unitYi')}`
  if (v >= 10000) return `${(v / 10000).toFixed(precision.value)}${t('editor.comparisonCard.unitWan')}`
  return v.toLocaleString()
})

useExposeWidget(() => ({
  get currentValue() { return currentValue.value },
  get changePercent() { return changePercent.value },
}))
</script>

<template>
  <div :class="styles.comparisonCard" :style="widgetStyle">
    <div :class="styles.title">{{ title }}</div>
    <div :class="styles.main">
      <span :class="styles.prefix">{{ prefix }}</span>
      <span :class="styles.value">{{ formattedValue }}</span>
      <span :class="styles.unit">{{ unit }}</span>
    </div>
    <div :class="styles.comparison">
      <span :class="styles.comparisonLabel">{{ comparisonLabel }}</span>
      <span :class="[styles.changePercent, styles[`trend${trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}`]]">
        <span v-if="trendDirection === 'up'">↑</span>
        <span v-else-if="trendDirection === 'down'">↓</span>
        <span v-else>→</span>
        {{ Math.abs(changePercent).toFixed(precision) }}%
      </span>
    </div>
  </div>
</template>
