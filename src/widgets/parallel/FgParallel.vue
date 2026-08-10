<script setup lang="ts">
/**
 * FgParallel — Parallel Chart Widget
 *
 * 适合多维DataAnalysis, 展示多个Dimension之间的关系。
 * 核心能力：
 * - DimensionConfig（Name/范围）
 * - Data绑定
 * - 平滑曲线/直线
 * - 线宽/Opacity
 * - 配色方案
 */
import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";
import { echarts } from "../base/echarts";
import type { EChartsOption } from "echarts";

const widgetData = inject(widgetDataKey)!;
const { renderState } = useWidgetRenderState();
const isLoading = computed(() => !renderState.value.visible);

// ---- Chart Ref ----
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// ---- Props ----
const smooth = computed(() => (widgetData.value.props?.smooth as boolean) ?? false);
const lineWidth = computed(() => (widgetData.value.props?.lineWidth as number) ?? 1);
const opacity = computed(() => (widgetData.value.props?.opacity as number) ?? 0.5);
const colorScheme = computed(() => (widgetData.value.props?.colorScheme as string) ?? "default");

// ---- Data ----
const dimensions = computed(() =>
  (widgetData.value.props?.dimensions as Array<{ name: string; min?: number; max?: number }>) ?? [],
);
const data = computed(() => (widgetData.value.props?.data as unknown[][]) ?? []);

// ---- Color Schemes ----
const COLOR_SCHEMES: Record<string, string[]> = {
  default: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"],
  warm: ["#ff6b6b", "#ffa07a", "#ffd700", "#ff8c00", "#ff4500"],
  cool: ["#4e79a7", "#59a14f", "#9c755f", "#f28e2b", "#e15759"],
};

// ---- Chart Option ----
const chartOption = computed<EChartsOption>(() => {
  const colors = COLOR_SCHEMES[colorScheme.value] ?? COLOR_SCHEMES.default;

  return {
    tooltip: {
      trigger: "item",
    },
    color: colors,
    parallelAxis: dimensions.value.map((dim, idx) => ({
      dim: idx,
      name: dim.name,
      min: dim.min,
      max: dim.max,
    })),
    series: [
      {
        type: "parallel",
        smooth: smooth.value,
        lineStyle: {
          width: lineWidth.value,
          opacity: opacity.value,
        },
        data: data.value as (string | number)[][],
      },
    ],
  };
});

// ---- Expose ----
useExposeWidget(() => ({
  loading: isLoading.value,
}));

// ---- Chart Lifecycle ----
function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(chartOption.value);
}

function updateChart() {
  if (!chartInstance) return;
  chartInstance.setOption(chartOption.value, true);
}

function handleResize() {
  chartInstance?.resize();
}

// ---- Lifecycle ----
onMounted(() => {
  nextTick(() => {
    initChart();
  });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});

// Watch for option changes
watch(chartOption, () => {
  updateChart();
});
</script>

<template>
  <div class="fg-parallel">
    <div
      v-if="isLoading"
      class="fg-parallel__loading"
    >
      Loading...
    </div>
    <div
      v-else
      ref="chartRef"
      class="fg-parallel__chart"
    />
  </div>
</template>

<style scoped>
.fg-parallel {
  width: 100%;
  height: 100%;
  position: relative;
}

.fg-parallel__chart {
  width: 100%;
  height: 100%;
}

.fg-parallel__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
}
</style>
