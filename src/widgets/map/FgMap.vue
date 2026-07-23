<script setup lang="ts">
import { inject, ref, shallowRef, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useChartOption } from '../base/useChartOption'
import { useChartLazyInit } from '../base/useChartLazyInit'
import { useChartEvents } from '../../composables/useChartEvents'
import { echarts, type EChartsType } from '../base/echarts'
import { useI18n } from '@schema-platform/platform-shared'
import WidgetStateShell from '../../components/WidgetRenderer/WidgetStateShell.vue'
import styles from './FgMap.module.scss'

const { t } = useI18n()

const CHINA_GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'

const widgetData = inject(widgetDataKey)!

const geoLoaded = ref(false)
const geoError = ref('')
const mapCache = new Map<string, boolean>()

async function loadMapGeo(mapType: string): Promise<boolean> {
  if (mapCache.get(mapType)) return true

  try {
    if (mapType === 'china') {
      const resp = await fetch(CHINA_GEO_URL)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const geoJson = await resp.json()
      echarts.registerMap('china', geoJson as never)
    } else {
      // World map: fetch from a public CDN
      const resp = await fetch('https://cdn.jsdelivr.net/npm/echarts/map/json/world.json')
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const geoJson = await resp.json()
      echarts.registerMap('world', geoJson as never)
    }
    mapCache.set(mapType, true)
    return true
  } catch (e) {
    geoError.value = (e as Error).message || t('editor.map.geoLoadFailed')
    return false
  }
}

function buildOption(data: Record<string, unknown>[], props: Record<string, unknown>): Record<string, unknown> {
  const mapType = (props.mapType as string) || 'china'
  const nameField = (props.nameField as string) || 'name'
  const valueField = (props.valueField as string) || 'value'
  const title = props.title as string
  const showLabel = props.showLabel !== false
  const showScatter = props.showScatter === true
  const roam = props.roam !== false
  const visualMapMin = (props.visualMapMin as number) ?? 0
  const visualMapMax = (props.visualMapMax as number) ?? 1000
  const colorScheme = (props.colorScheme as string) || 'default'
  const customColors = props.customColors as string[] | undefined
  const animation = props.animation !== false

  const colorMap: Record<string, string[]> = {
    default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
    dark: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53'],
    light: ['#37A2DA', '#32C5E9', '#67E0E3', '#9FE6B8', '#FFDB5C'],
  }
  const colors = customColors && customColors.length > 0 ? customColors : (colorMap[colorScheme] || colorMap.default)

  const mapData = data.map(item => ({
    name: item[nameField] as string,
    value: item[valueField] as number,
  }))

  const series: Record<string, unknown>[] = [
    {
      type: 'map',
      map: mapType,
      roam,
      label: { show: showLabel },
      data: mapData,
      animation,
    },
  ]

  if (showScatter) {
    const geoData = data
      .filter(item => item.lng != null && item.lat != null)
      .map(item => ({
        name: item[nameField] as string,
        value: [(item.lng as number), (item.lat as number), item[valueField] as number],
      }))
    if (geoData.length > 0) {
      series.push({
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: geoData,
        symbolSize: (val: number[]) => Math.max(8, Math.min(30, (val[2] ?? 0) / visualMapMax * 30)),
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke' },
        animation,
      })
    }
  }

  return {
    color: colors,
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: { trigger: 'item' },
    visualMap: {
      min: visualMapMin,
      max: visualMapMax,
      left: 'left',
      top: 'bottom',
      text: [t('editor.map.visualMapHigh'), t('editor.map.visualMapLow')],
      calculable: true,
      inRange: { color: colors },
    },
    geo: {
      map: mapType,
      roam,
      label: { show: false },
      emphasis: {
        label: { show: true },
        itemStyle: { areaColor: colors[0] },
      },
    },
    series,
  }
}

const { chartOption, loading, chartData } = useChartOption({
  widgetData,
  buildOption,
})

useExposeWidget(() => ({
  get loading() { return loading.value },
  get chartData() { return chartData.value },
}))

const chartRef = ref<HTMLDivElement>()
const chartInstanceRef = shallowRef<EChartsType | null>(null)
let chartInstance: EChartsType | null = null

useChartEvents(chartInstanceRef, widgetData, chartData)
let resizeObserver: ResizeObserver | null = null

const { isVisible } = useChartLazyInit(chartRef)

const currentMapType = ref('')

async function initChart() {
  if (!chartRef.value) return

  const mapType = (widgetData.value.props?.mapType as string) || 'china'
  if (currentMapType.value !== mapType) {
    geoLoaded.value = false
    geoError.value = ''
    const ok = await loadMapGeo(mapType)
    if (!ok) return
    currentMapType.value = mapType
    geoLoaded.value = true
  }

  chartInstance = echarts.init(chartRef.value)
  chartInstanceRef.value = chartInstance
  if (chartOption.value && Object.keys(chartOption.value).length > 0) {
    chartInstance.setOption(chartOption.value)
  }
}

function handleResize() {
  chartInstance?.resize()
}

watch(isVisible, (visible) => {
  if (visible) {
    nextTick(() => initChart())
  }
})

watch(chartOption, async (option) => {
  if (!isVisible.value) return
  if (!chartInstance) {
    await nextTick()
    await initChart()
  }
  if (chartInstance && Object.keys(option).length > 0) {
    chartInstance.setOption(option, true)
  }
})

// Re-init when mapType changes
watch(() => widgetData.value.props?.mapType, async (newType, oldType) => {
  if (newType === oldType) return
  currentMapType.value = ''
  geoLoaded.value = false
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
    chartInstanceRef.value = null
  }
  if (isVisible.value) {
    await nextTick()
    await initChart()
  }
})

onMounted(() => {
  if (isVisible.value) {
    initChart()
  }
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
  chartInstanceRef.value = null
})
</script>

<template>
  <WidgetStateShell
    :loading="loading || (!geoLoaded && !geoError)"
    :error="geoError"
    :empty="chartData.length === 0 && !loading"
    :skeleton="false"
  >
    <div ref="chartRef" :class="styles.container" />
  </WidgetStateShell>
</template>
