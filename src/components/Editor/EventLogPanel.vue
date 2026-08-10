<script setup lang="ts">
/**
 * EventLogPanel — Event执RowLog面板
 *
 * 展示 useEventLog 捕获的Event/Rule/API 执RowLog。
 */
import { ref, nextTick, watch, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { useEventLog } from "../../composables/useEventLog";
import styles from "./EventLogPanel.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

const { entries, clear } = useEventLog();
const scrollRef = ref<HTMLElement | null>(null);
const { t } = useI18n();

watch(
  () => entries.value.length,
  async () => {
    await nextTick();
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  },
);

const LEVEL_COLORS: Record<string, string> = {
  event: "#0060A2",
  rule: "#9c27b0",
  api: "#67c23a",
  warn: "#e6a23c",
  error: "#f56c6c",
  info: "#909399",
  debug: "#c0c4cc",
};

const LEVEL_LABELS = computed<Record<string, string>>(() => ({
  event: t("editor.eventLog.levelEvent"),
  rule: t("editor.eventLog.levelRule"),
  api: t("editor.eventLog.levelApi"),
  warn: t("editor.common.warning"),
  error: t("editor.common.error"),
  info: t("editor.common.info"),
  debug: t("editor.eventLog.levelDebug"),
}));
</script>

<template>
  <div :class="styles.panel">
    <div :class="styles.header">
      <span :class="styles.title">{{ t('editor.toolbar.executionLog') }}</span>
      <span :class="styles.count">{{ entries.length }}</span>
      <el-button
        :class="styles.clearBtn"
        type="danger"
        link
        size="small"
        @click="clear"
      >
        <AppIcon name="delete" />
        {{ t('editor.toolbar.clear') }}
      </el-button>
    </div>
    <div ref="scrollRef" :class="styles.scroll">
      <div v-if="entries.length === 0" :class="styles.empty">{{ t('editor.eventLog.noEntries') }}</div>
      <div v-for="entry in entries" :key="entry.id" :class="styles.entry">
        <span :class="styles.time">{{ entry.time }}</span>
        <span
          :class="styles.level"
          :style="{
            color: LEVEL_COLORS[entry.level] || 'var(--text-color-muted)',
          }"
        >
          {{ LEVEL_LABELS[entry.level] ?? entry.level }}
        </span>
        <span :class="styles.scope">[{{ entry.scope }}]</span>
        <span :class="styles.message">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>
