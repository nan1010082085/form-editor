<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const LEVEL_LABEL: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "严重",
};
const LEVEL_TYPE: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const level = computed(() => (widgetData.value.props?.level as string) ?? "medium");
const description = computed(() => (widgetData.value.props?.description as string) ?? "");
const label = computed(() => widgetData.value.label ?? "风险标签");

useExposeWidget((wd) => ({
  get level() {
    return (wd.value.props?.level as string) ?? "medium";
  },
}));
</script>

<template>
  <div :class="$style.riskBadge" :style="{ fontSize: widgetData.style?.fontSize || '14px' }">
    <div :class="$style.badgeWrap">
      <span :class="$style.label">{{ label }}</span>
      <el-tag :type="LEVEL_TYPE[level] ?? 'info'" size="default" effect="dark">
        <AppIcon name="warning" :size="12" />
        {{ LEVEL_LABEL[level] ?? level }}
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
