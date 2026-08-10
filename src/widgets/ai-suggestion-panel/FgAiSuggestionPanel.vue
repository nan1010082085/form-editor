<script setup lang="ts">
/**
 * FgAiSuggestionPanel — AI Suggestions面板
 */
import { computed, ref, inject } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { t } = useI18n();

const widgetData = inject(widgetDataKey)!;

const collapsed = ref(false);

const title = computed(
  () =>
    (widgetData.value.props?.title as string) ??
    t("editor.aiSuggestion.defaultTitle"),
);
const showIcon = computed(() => (widgetData.value.props?.showIcon as boolean) ?? true);
const collapsible = computed(() => (widgetData.value.props?.collapsible as boolean) ?? true);
const defaultExpanded = computed(
  () => (widgetData.value.props?.defaultExpanded as boolean) ?? true,
);
const suggestions = computed<Array<{ text?: string; level?: string; type?: string }>>(
  () => {
    const raw = widgetData.value.props?.suggestions;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Array<{ text?: string; level?: string; type?: string }>;
    return [];
  },
);

const isExpanded = computed(() => (collapsible.value ? !collapsed.value && defaultExpanded.value : true));

const LEVEL_ICON: Record<string, string> = {
  high: "warning-filled",
  medium: "warning",
  low: "info-filled",
  info: "info-filled",
  success: "circle-check-filled",
};

const LEVEL_COLOR: Record<string, string> = {
  high: "#f56c6c",
  medium: "#e6a23c",
  low: "#909399",
  info: "#409eff",
  success: "#67c23a",
};

function toggle() {
  if (collapsible.value) collapsed.value = !collapsed.value;
}

useExposeWidget((wd) => ({
  get suggestions() {
    return wd.value.props?.suggestions ?? [];
  },
}));
</script>

<template>
  <div :class="$style.panel" :style="{ fontSize: String(widgetData.style?.fontSize || '14px') }">
    <div :class="$style.header" @click="toggle">
      <div :class="$style.titleWrap">
        <AppIcon v-if="showIcon" name="magic-stick" :size="16" :class="$style.titleIcon" />
        <span :class="$style.title">{{ title }}</span>
        <el-tag size="small" type="info" effect="plain" round>{{ suggestions.length }}</el-tag>
      </div>
      <AppIcon
        v-if="collapsible"
        :name="isExpanded ? 'arrow-up' : 'arrow-down'"
        :size="12"
        :class="$style.toggleIcon"
      />
    </div>
    <transition name="collapse">
      <div v-show="isExpanded" :class="$style.list">
        <div v-if="!suggestions.length" :class="$style.empty">
          {{ t("editor.aiSuggestion.empty") }}
        </div>
        <div
          v-for="(item, idx) in suggestions"
          :key="idx"
          :class="$style.item"
        >
          <AppIcon
            v-if="showIcon"
            :name="LEVEL_ICON[item.level ?? 'info'] ?? 'info-filled'"
            :size="14"
            :style="{ color: LEVEL_COLOR[item.level ?? 'info'] ?? '#909399' }"
          />
          <span :class="$style.itemText">{{ item.text ?? item }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style module lang="scss">
.panel {
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  overflow: hidden;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
}
.titleWrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.titleIcon {
  color: var(--el-color-primary, #409eff);
}
.title {
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}
.toggleIcon {
  color: var(--el-text-color-secondary, #909399);
}
.list {
  padding: 0 12px 10px;
}
.empty {
  padding: 8px 0;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  text-align: center;
}
.item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  margin-top: 4px;
  background: var(--el-bg-color, #fff);
  border-radius: 6px;
}
.itemText {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular, #606266);
}
</style>
