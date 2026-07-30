<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const taskField = computed(() => (widgetData.value.props?.taskField as string) ?? "name");
const startField = computed(() => (widgetData.value.props?.startField as string) ?? "start");
const endField = computed(() => (widgetData.value.props?.endField as string) ?? "end");
const statusField = computed(() => (widgetData.value.props?.statusField as string) ?? "status");
const progressField = computed(() => (widgetData.value.props?.progressField as string) ?? "progress");
const showProgress = computed(() => (widgetData.value.props?.showProgress as boolean) ?? true);
const showStatus = computed(() => (widgetData.value.props?.showStatus as boolean) ?? true);
const title = computed(() => (widgetData.value.props?.title as string) ?? "");
const rowHeight = computed(() => (widgetData.value.props?.rowHeight as number) ?? 32);
const colorScheme = computed(() => (widgetData.value.props?.colorScheme as string) ?? "default");

const staticData = computed(() => {
  const raw = widgetData.value.props?.staticData;
  return Array.isArray(raw) ? raw as Record<string, unknown>[] : [];
});

const STATUS_COLORS: Record<string, string> = {
  done: "#91cc75",
  active: "#5470c6",
  pending: "#fac858",
  delayed: "#ee6666",
};

function buildOption() {
  const data = staticData.value;
  if (!data.length) {
    return {
      title: { text: title.value || "Gantt Chart", left: "center" },
      graphic: { type: "text", left: "center", top: "middle", style: { text: "No task data", fontSize: 14, fill: "#999" } },
    };
  }

  const categories = data.map(d => (d[taskField.value] as string) ?? "");
  const startTimes = data.map(d => new Date(d[startField.value] as string).getTime());
  const endTimes = data.map(d => new Date(d[endField.value] as string).getTime());
  const statuses = data.map(d => (d[statusField.value] as string) ?? "pending");
  const progresses = data.map(d => (d[progressField.value] as number) ?? 0);

  // custom series for Gantt bars
  const barData = data.map((d, i) => ({
    value: [i, startTimes[i], endTimes[i]],
    status: statuses[i],
    progress: progresses[i],
  }));

  return {
    title: title.value ? { text: title.value, left: "center" } : undefined,
    tooltip: {
      trigger: "item",
      formatter: (params: { dataIndex: number }) => {
        const idx = params.dataIndex;
        const name = categories[idx];
        const start = new Date(startTimes[idx]).toLocaleDateString();
        const end = new Date(endTimes[idx]).toLocaleDateString();
        const status = statuses[idx];
        const progress = progresses[idx];
        return `<b>${name}</b><br/>Start: ${start}<br/>End: ${end}<br/>Status: ${status}<br/>Progress: ${progress}%`;
      },
    },
    grid: { left: 120, right: 30, top: title.value ? 40 : 20, bottom: 30 },
    xAxis: {
      type: "time",
      position: "top",
      axisLabel: { formatter: (val: number) => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
    },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisTick: { show: false },
    },
    series: [
      {
        name: "Task",
        type: "custom",
        renderItem: (params: { dataIndex: number }, api: { coord: (val: [number, number]) => [number, number]; size: ([w, h]: [number, number]) => [number, number]; value: (idx: number, dim: number) => number }) => {
          const idx = params.dataIndex;
          const start = api.coord([api.value(idx, 1), idx]);
          const end = api.coord([api.value(idx, 2), idx]);
          const height = api.size([0, 1])[1] * 0.6;
          const rectWidth = end[0] - start[0];
          const y = start[1] - height / 2;

          const status = statuses[idx];
          const progress = progresses[idx];
          const color = colorScheme.value === "status" ? (STATUS_COLORS[status] ?? "#5470c6") : "#5470c6";

          return {
            type: "group",
            children: [
              // background bar
              {
                type: "rect",
                shape: { x: start[0], y, width: rectWidth, height, r: 3 },
                style: { fill: "#e8e8e8", stroke: color, lineWidth: 1 },
              },
              // progress fill
              ...(showProgress.value && progress > 0 ? [{
                type: "rect",
                shape: { x: start[0], y, width: rectWidth * (progress / 100), height, r: 3 },
                style: { fill: color, opacity: 0.7 },
              }] : []),
              // status label
              ...(showStatus.value ? [{
                type: "text",
                style: {
                  x: start[0] + rectWidth / 2,
                  y: start[1],
                  text: `${progress}%`,
                  textAlign: "center",
                  textVerticalAlign: "middle",
                  fontSize: 11,
                  fill: progress > 50 ? "#fff" : "#333",
                },
              }] : []),
            ],
          };
        },
        encode: { x: [1, 2], y: 0 },
        data: barData,
      },
    ],
  };
}

function renderChart() {
  if (!chart) return;
  chart.setOption(buildOption(), true);
}

onMounted(() => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
  const ro = new ResizeObserver(() => chart?.resize());
  ro.observe(chartRef.value);
  onUnmounted(() => { ro.disconnect(); chart?.dispose(); });
});

watch([staticData, showProgress, showStatus, colorScheme, title], renderChart);

useExposeWidget(() => ({
  get taskData() { return staticData.value; },
  refresh: renderChart,
}));
</script>

<template>
  <div :class="$style.wrapper" :style="{ height: widgetData.style?.height || '400px' }">
    <div ref="chartRef" :class="$style.chart" />
  </div>
</template>

<style module lang="scss">
.wrapper {
  width: 100%;
  height: 100%;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>
