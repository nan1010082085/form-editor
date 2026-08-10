<script setup lang="ts">
/**
 * FgRiskBadge — 风险等级Label
 */
import { computed, inject } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { t } = useI18n();
const widgetData = inject(widgetDataKey)!;

/** 风险等级 i18n key Map */
const LEVEL_LABEL_KEY: Record<string, string> = {
  low: "editor.riskBadge.levelLow",
  medium: "editor.riskBadge.levelMedium",
  high: "editor.riskBadge.levelHigh",
  critical: "editor.riskBadge.levelCritical",
};

const LEVEL_TYPE: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const level = computed(() => (widgetData.value.props?.level as string) ?? "medium");
const description = computed(() => (widgetData.value.props?.description as string) ?? "");
const label = computed(
  () => widgetData.value.label ?? t("editor.riskBadge.defaultLabel"),
);

/**
 * Parse风险等级展示文案
 */
function levelLabel(levelKey: string): string {
  const key = LEVEL_LABEL_KEY[levelKey];
  return key ? t(key) : levelKey;
}

useExposeWidget((wd) => ({
  get level() {
    return (wd.value.props?.level as string) ?? "medium";
  },
}));
</script>

<template>
  <div :class="$style.riskBadge" :style="{ fontSize: String(widgetData.style?.fontSize || '14px') }">
    <div :class="$style.badgeWrap">
      <span :class="$style.label">{{ label }}</span>
      <el-tag :type="LEVEL_TYPE[level] ?? 'info'" size="default" effect="dark">
        <AppIcon name="warning" :size="12" />
        {{ levelLabel(level) }}
      </el-tag>
    </div>
    <div v-if="description" :class="$style.desc">{{ description }}</div>
  </div>
</template>

<style module lang="scss">
.riskBadge {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
}
.badgeWrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}
.desc {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}
</style>
