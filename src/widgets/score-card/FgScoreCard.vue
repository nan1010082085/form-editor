<script setup lang="ts">
/**
 * FgScoreCard — Score Card
 */
import { computed, inject } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const { t } = useI18n();
const widgetData = inject(widgetDataKey)!;

/** 评Min等级 i18n key Map */
const LEVEL_LABEL_KEY: Record<string, string> = {
  excellent: "editor.scoreCard.levelExcellent",
  good: "editor.scoreCard.levelGood",
  medium: "editor.scoreCard.levelMedium",
  poor: "editor.scoreCard.levelPoor",
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
const label = computed(
  () => widgetData.value.label ?? t("editor.scoreCard.defaultLabel"),
);

const percent = computed(() =>
  maxScore.value > 0 ? Math.round((score.value / maxScore.value) * 100) : 0,
);
const scoreColor = computed(() => {
  if (percent.value >= 80) return "#67c23a";
  if (percent.value >= 60) return "#e6a23c";
  return "#f56c6c";
});

/**
 * Parse评Min等级展示文案
 */
function levelLabel(levelKey: string): string {
  const key = LEVEL_LABEL_KEY[levelKey];
  return key ? t(key) : levelKey;
}

useExposeWidget((wd) => ({
  get score() {
    return (wd.value.props?.score as number) ?? 0;
  },
}));
</script>

<template>
  <div :class="$style.scoreCard" :style="{ fontSize: String(widgetData.style?.fontSize || '14px') }">
    <div :class="$style.header">
      <span :class="$style.label">{{ label }}</span>
      <el-tag v-if="showLevel" :type="LEVEL_TYPE[level] ?? 'info'" size="small">
        {{ levelLabel(level) }}
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
