<script setup lang="ts">
/**
 * FgTreemap — 矩形树图
 *
 * 适合层级占比展示，ECharts 内置图表类型。
 */
import { inject, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useChartOption } from '../base/useChartOption'
import { useChartLazyInit } from '../base/useChartLazyInit'
import { useChartEvents } from '../../composables/useChartEvents'
import { echarts, type EChartsType } from '../base/echarts'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!

function buildOption(data: Record<string, unknown>[], props: Record<string, unknown>): Record<string, unknown> {
  const title = props.title as string
  const showLabel = props.showLabel !== false
  const colorScheme = (props.colorScheme as string) || 'default'

  const colorMap: Record<string, string[]> = {
    default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
    warm: ['#ee6666', '#fac858', '#fc8452', '#ea7ccc', '#9a60b4'],
    cool: ['#5470c6', '#91cc75', '#73c0de', '#3ba272', '#73b9bc'],
  }

  return {
    color: colorMap[colorScheme] || colorMap.default,
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'treemap',
      data,
      roam: false,
      label: showLabel ? { show: true, formatter: '{b}' } : undefined,
      itemStyle: { borderColor: '#fff', borderWidth: 1, gapWidth: 1 },
      upperLabel: { show: true, height: 20 },
      levels: [
        { itemStyle: { borderColor: '#555', borderWidth: 4, gapWidth: 4 } },
        { colorSaturation: [0.35, 0.5], itemStyle: { borderColorSaturation: 0.6, gapWidth: 2, borderWidth: 2 } },
      ],
    }],
  }
}

const { chartOption, loading, chartData, loadData } = useChartOption({ widgetData, buildOption })

useExposeWidget(() => ({
  get loading() { return loading.value },
  get chartData() { return chartData.value },
  refresh: loadData,
}))

const chartRef = ref<HTMLDivElement>()
const chartInstanceRef = ref<EChartsType | null>(null)
let chartInstance: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

useChartEvents(chartInstanceRef, widgetData, chartData)

const { isVisible } = useChartLazyInit(chartRef)

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstanceRef.value = chartInstance
  if (chartOption.value && Object.keys(chartOption.value).length > 0) {
    chartInstance.setOption(chartOption.value)
  }
}

function handleResize() { chartInstance?.resize() }

watch(isVisible, (visible) => { if (visible) nextTick(() => initChart()) })

watch(chartOption, async (option) => {
  if (!isVisible.value) return
  if (!chartInstance) { await nextTick(); initChart() }
  if (chartInstance && Object.keys(option).length > 0) {
    chartInstance.setOption(option, true)
  }
})

onMounted(() => {
  if (isVisible.value) initChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
})
</script>

<template>
  <div :class="styles.treemap">
    <div v-if="loading" :class="styles.loading">加载中...</div>
    <div ref="chartRef" :class="styles.chart" />
  </div>
</template>
