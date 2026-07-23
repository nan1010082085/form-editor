<script setup lang="ts">
/**
 * FgRankList — 排行榜列表
 *
 * 数据源驱动的排名列表，支持动态排名、趋势箭头、数值高亮。
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
const items = computed(() => (widgetData.value.props?.items as Array<Record<string, unknown>>) ?? [])
const nameKey = computed(() => (widgetData.value.props?.nameKey as string) ?? 'name')
const valueKey = computed(() => (widgetData.value.props?.valueKey as string) ?? 'value')
const trendKey = computed(() => (widgetData.value.props?.trendKey as string) ?? 'trend')
const maxItems = computed(() => (widgetData.value.props?.maxItems as number) ?? 10)
const showRank = computed(() => widgetData.value.props?.showRank !== false)
const showTrend = computed(() => widgetData.value.props?.showTrend !== false)
const highlightTop = computed(() => (widgetData.value.props?.highlightTop as number) ?? 3)

const sortedItems = computed(() => {
  return [...items.value]
    .sort((a, b) => ((b[valueKey.value] as number) ?? 0) - ((a[valueKey.value] as number) ?? 0))
    .slice(0, maxItems.value)
})

function getRankClass(index: number): string {
  if (index < highlightTop.value) return styles.rankTop
  return styles.rankNormal
}

function getTrendIcon(trend: unknown): string {
  if (typeof trend === 'number') {
    if (trend > 0) return '↑'
    if (trend < 0) return '↓'
  }
  return '→'
}

function getTrendClass(trend: unknown): string {
  if (typeof trend === 'number') {
    if (trend > 0) return styles.trendUp
    if (trend < 0) return styles.trendDown
  }
  return styles.trendFlat
}

useExposeWidget(() => ({
  get sortedItems() { return sortedItems.value },
}))
</script>

<template>
  <div :class="styles.rankList" :style="widgetStyle">
    <div v-if="title" :class="styles.title">{{ title }}</div>
    <div :class="styles.list">
      <div v-for="(item, index) in sortedItems" :key="index" :class="styles.item">
        <span v-if="showRank" :class="[styles.rank, getRankClass(index)]">{{ index + 1 }}</span>
        <span :class="styles.name">{{ item[nameKey] ?? '' }}</span>
        <span :class="styles.value">{{ item[valueKey] ?? '' }}</span>
        <span v-if="showTrend && item[trendKey] !== undefined" :class="[styles.trend, getTrendClass(item[trendKey])]">
          {{ getTrendIcon(item[trendKey]) }}
        </span>
      </div>
      <div v-if="sortedItems.length === 0" :class="styles.empty">{{ t('editor.rankList.empty') }}</div>
    </div>
  </div>
</template>
