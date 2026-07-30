<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const LEVEL_LABEL: Record<string, string> = {
  excellent: "优秀",
  good: "良好",
  medium: "中等",
  poor: "较差",
};
const LEVEL_TYPE: Record<string, "success" | "warning" | "danger"> = {
  excellent: "success",
  good: "success",
  medium: "warning",
  poor: "danger",
};

const score = computed(() => (widgetData.value.props?.score as number) ?? 0);
const maxScore = computed(() => (widgetData.value.props?.maxScore as number) ?? 100);
const level = computed(() => (widgetData.value.props?.level as string) ?? "medium");
const description = computed(() => (widgetData.value.props?.description as string) ?? "");
const showLevel = computed(() => (widgetData.value.props?.showLevel as boolean) ?? true);
const label = computed(() => widgetData.value.label ?? "评分卡");

const percent = computed(() =>
  maxScore.value > 0 ? Math.round((score.value / maxScore.value) * 100) : 0,
);
const scoreColor = computed(() => {
  if (percent.value >= 80) return "#67c23a";
  if (percent.value >= 60) return "#e6a23c";
  return "#f56c6c";
});

useExposeWidget((wd) => ({
  get score() {
    return (wd.value.props?.score as number) ?? 0;
  },
}));
</script>

<template>
  <div :class="$style.scoreCard" :style="{ fontSize: widgetData.style?.fontSize || '14px' }">
    <div :class="$style.header">
      <span :class="$style.label">{{ label }}</span>
      <el-tag v-if="showLevel" :type="LEVEL_TYPE[level] ?? 'info'" size="small">
        {{ LEVEL_LABEL[level] ?? level }}
      </el-tag>
    </div>
    <div :class="$style.scoreWrap">
      <span :class="$style.score" :style="{ color: scoreColor }">{{ score }}</span>
      <span :class="$style.max">/ {{ maxScore }}</span>
    </div>
    <el-progress
      :percentage="percent"
      :color="scoreColor"
      :show-text="false"
      :stroke-width="6"
    />
    <div v-if="description" :class="$style.desc">{{ description }}</div>
  </div>
</template>

<style module lang="scss">
.scoreCard {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.label {
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}
.scoreWrap {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}
.score {
  font-size: 28px;
  font-weight: 600;
}
.max {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}
.desc {
  margin-top: 8px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}
</style>
