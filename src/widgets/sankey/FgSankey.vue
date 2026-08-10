<script setup lang="ts">
/**
 * FgSankey — Sankey Chart Widget
 *
 * 适合流量/转化Analysis, 展示Data在不同阶段的流动。
 * 核心能力：
 * - 节点和链接DataConfig
 * - 水平/垂直方向
 * - 节点Width/Gap/链接曲率
 * - LabelShow位置
 * - 配色方案
 * - 邻接高亮
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
const hasError = computed(() => false); // Error state handled by WidgetErrorBoundary

// ---- Chart Ref ----
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// ---- Props ----
const orientation = computed(() => (widgetData.value.props?.orientation as string) ?? "horizontal");
const nodeWidth = computed(() => (widgetData.value.props?.nodeWidth as number) ?? 20);
const nodeGap = computed(() => (widgetData.value.props?.nodeGap as number) ?? 8);
const linkCurvature = computed(() => (widgetData.value.props?.linkCurvature as number) ?? 0.5);
const showLabels = computed(() => (widgetData.value.props?.showLabels as boolean) ?? true);
const labelPosition = computed(() => (widgetData.value.props?.labelPosition as string) ?? "right");
const colorScheme = computed(() => (widgetData.value.props?.colorScheme as string) ?? "default");
const emphasis = computed(() => (widgetData.value.props?.emphasis as string) ?? "adjacency");

// ---- Data ----
const nodes = computed(() => (widgetData.value.props?.nodes as Array<{ name: string }>) ?? []);
const links = computed(() =>
  (widgetData.value.props?.links as Array<{ source: string; target: string; value: number }>) ?? [],
);

// ---- Color Schemes ----
const COLOR_SCHEMES: Record<string, string[]> = {
  default: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"],
  warm: ["#ff6b6b", "#ffa07a", "#ffd700", "#ff8c00", "#ff4500"],
  cool: ["#4e79a7", "#59a14f", "#9c755f", "#f28e2b", "#e15759"],
  gradient: ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"],
};

// ---- Chart Option ----
const chartOption = computed<EChartsOption>(() => {
  const colors = COLOR_SCHEMES[colorScheme.value] ?? COLOR_SCHEMES.default;

  return {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
    },
    color: colors,
    series: [
      {
        type: "sankey",
        layout: orientation.value,
        nodeWidth: nodeWidth.value,
        nodeGap: nodeGap.value,
        orient: orientation.value as "horizontal" | "vertical",
        draggable: true,
        emphasis: {
          focus: emphasis.value === "adjacency" ? "adjacency" : "none",
        },
        label: {
          show: showLabels.value,
          position: labelPosition.value as "left" | "right" | "inside",
        },
        lineStyle: {
          curveness: linkCurvature.value,
          opacity: 0.3,
        },
        data: nodes.value.map((node) => ({ name: node.name })),
        links: links.value.map((link) => ({
          source: link.source,
          target: link.target,
          value: link.value,
        })),
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
  <div class="fg-sankey">
    <div
      v-if="isLoading"
      class="fg-sankey__loading"
    >
      Loading...
    </div>
    <div
      v-else-if="hasError"
      class="fg-sankey__error"
    >
      Error loading chart
    </div>
    <div
      v-else
      ref="chartRef"
      class="fg-sankey__chart"
    />
  </div>
</template>

<style scoped>
.fg-sankey {
  width: 100%;
  height: 100%;
  position: relative;
}

.fg-sankey__chart {
  width: 100%;
  height: 100%;
}

.fg-sankey__loading,
.fg-sankey__error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
}
</style>
