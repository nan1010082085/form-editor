<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const title = computed(() => (widgetData.value.props?.title as string) ?? "Energy Dashboard");
const timeField = computed(() => (widgetData.value.props?.timeField as string) ?? "time");
const valueField = computed(() => (widgetData.value.props?.valueField as string) ?? "value");
const unit = computed(() => (widgetData.value.props?.unit as string) ?? "kWh");
const showChart = computed(() => (widgetData.value.props?.showChart as boolean) ?? true);
const showStats = computed(() => (widgetData.value.props?.showStats as boolean) ?? true);

const staticData = computed(() => {
  const raw = widgetData.value.props?.staticData;
  return Array.isArray(raw) ? raw as Record<string, unknown>[] : [];
});

const stats = computed(() => {
  const values = staticData.value.map(d => Number(d[valueField.value]) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const peak = values.length ? Math.max(...values) : 0;
  const avg = values.length ? total / values.length : 0;
  return { total, peak, avg };
});

function renderChart() {
  if (!chart || !showChart.value || !staticData.value.length) return;
  chart.setOption({
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: staticData.value.map(d => (d[timeField.value] as string) ?? ""),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: "value", name: unit.value },
    series: [{
      type: "bar",
      data: staticData.value.map(d => Number(d[valueField.value]) || 0),
      itemStyle: { color: "#5470c6", borderRadius: [3, 3, 0, 0] },
    }],
    tooltip: { trigger: "axis" },
  }, true);
}

onMounted(() => {
  if (!chartRef.value || !showChart.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
  const ro = new ResizeObserver(() => chart?.resize());
  ro.observe(chartRef.value);
  onUnmounted(() => { ro.disconnect(); chart?.dispose(); });
});

watch([staticData, showChart], renderChart);

useExposeWidget(() => ({
  get energyData() { return staticData.value; },
}));
</script>

<template>
  <div :class="$style.dashboard">
    <div :class="$style.header">
      <div :class="$style.title">{{ title }}</div>
      <div v-if="showStats" :class="$style.stats">
        <div :class="$style.stat">
          <span :class="$style.statLabel">Total</span>
          <span :class="$style.statValue">{{ stats.total.toFixed(1) }} {{ unit }}</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.statLabel">Peak</span>
          <span :class="$style.statValue">{{ stats.peak.toFixed(1) }} {{ unit }}</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.statLabel">Average</span>
          <span :class="$style.statValue">{{ stats.avg.toFixed(1) }} {{ unit }}</span>
        </div>
      </div>
    </div>
    <div v-if="showChart && staticData.length" ref="chartRef" :class="$style.chart" />
    <div v-if="!staticData.length" :class="$style.empty">No energy data configured</div>
  </div>
</template>

<style module lang="scss">
.dashboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}
.stats {
  display: flex;
  gap: 12px;
}
.stat {
  display: flex;
  flex-direction: column;
  padding: 6px 14px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
  min-width: 80px;
}
.statLabel {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  text-transform: uppercase;
}
.statValue {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.chart {
  flex: 1;
  min-height: 200px;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
}
</style>
