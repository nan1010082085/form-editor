<script setup lang="ts">
/**
 * ExecutionTimeline — 垂直节点执RowHrs间轴
 *
 * 展示工作流各节点的执RowStatus、耗Hrs、ErrorInfo。
 * 点击节点可ExpandViewInput/OutputData。
 */
import { ref } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./ExecutionTimeline.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

// ── Types ──
export interface NodeLog {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "running" | "completed" | "failed" | "skipped";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string;
  startedAt: string;
  completedAt: string | null;
  duration: number;
}

// ── Props ──
const props = defineProps<{
  nodeLogs: NodeLog[];
}>();

const { t } = useI18n();

// ── Emits ──
const emit = defineEmits<{
  "node-click": [node: NodeLog];
}>();

// ── State ──
const expandedNodes = ref<Set<string>>(new Set());

// ── Helpers ──
function nodeIcon(status: string): string {
  const map: Record<string, string> = {
    completed: "success-filled",
    failed: "circle-close-filled",
    running: "loading",
    skipped: "circle-close-filled",
  };
  return map[status] ?? "warning-filled";
}

function nodeIconColor(status: string): string {
  const map: Record<string, string> = {
    completed: "var(--color-success)",
    failed: "var(--color-danger)",
    running: "var(--color-primary)",
    skipped: "var(--text-color-secondary)",
  };
  return map[status] ?? "var(--text-color-secondary)";
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    running: t("editor.executionTimeline.statusRunning"),
    completed: t("editor.executionTimeline.statusCompleted"),
    failed: t("editor.executionTimeline.statusFailed"),
    skipped: t("editor.executionTimeline.statusSkipped"),
  };
  return map[s] ?? s;
}

function statusTheme(s: string): "default" | "success" | "warning" | "danger" {
  const map: Record<string, "default" | "success" | "warning" | "danger"> = {
    running: "default",
    completed: "success",
    failed: "danger",
    skipped: "default",
  };
  return map[s] ?? "default";
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatTime(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN");
}

function formatJson(obj: unknown): string {
  if (!obj || (typeof obj === "object" && Object.keys(obj).length === 0))
    return t("editor.executionTimeline.emptyJson");
  return JSON.stringify(obj, null, 2);
}

function hasIO(node: NodeLog): boolean {
  return (
    Object.keys(node.input ?? {}).length > 0 ||
    Object.keys(node.output ?? {}).length > 0
  );
}

function toggleExpand(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
}

function handleNodeClick(node: NodeLog) {
  emit("node-click", node);
  if (hasIO(node)) {
    toggleExpand(node.id);
  }
}
</script>

<template>
  <div v-if="props.nodeLogs.length > 0" :class="styles.root">
    <div
      v-for="node in props.nodeLogs"
      :key="node.id"
      :class="styles.item"
      @click="handleNodeClick(node)"
    >
      <!-- Dot -->
      <div :class="styles.dot">
        <AppIcon
          :name="nodeIcon(node.status)"
          :size="14"
          :class="styles.dotIcon"
          :style="{ color: nodeIconColor(node.status) }"
        />
      </div>

      <!-- Content card -->
      <div :class="styles.content">
        <div :class="styles.header">
          <span :class="styles.nodeName">{{
            node.nodeName || node.nodeId
          }}</span>
          <el-tag :type="statusTheme(node.status)" size="small">
            {{ statusLabel(node.status) }}
          </el-tag>
        </div>

        <div :class="styles.meta">
          <span v-if="node.duration" :class="styles.metaItem">
            {{ t('editor.executionTimeline.duration') }}: {{ formatDuration(node.duration) }}
          </span>
          <span :class="styles.metaItem">
            {{ formatTime(node.startedAt) }}
          </span>
        </div>

        <!-- Error -->
        <div v-if="node.error" :class="styles.errorBlock">
          <AppIcon name="circle-close-filled" />
          <span>{{ node.error }}</span>
        </div>

        <!-- I/O (expandable) -->
        <template v-if="hasIO(node)">
          <div :class="styles.ioToggle">
            <el-link type="primary" :underline="false">
              {{ expandedNodes.has(node.id) ? t('editor.common.collapse') : t('editor.executionTimeline.viewIO') }}
              {{ t('editor.executionTimeline.ioLabel') }}
            </el-link>
          </div>

          <div v-if="expandedNodes.has(node.id)" :class="styles.ioSection">
            <div v-if="Object.keys(node.input ?? {}).length > 0">
              <div :class="styles.ioLabel">Input</div>
              <pre :class="styles.ioBlock">{{ formatJson(node.input) }}</pre>
            </div>
            <div v-if="Object.keys(node.output ?? {}).length > 0">
              <div :class="styles.ioLabel">Output</div>
              <pre :class="styles.ioBlock">{{ formatJson(node.output) }}</pre>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <div v-else :class="styles.empty">{{ t('editor.executionTimeline.empty') }}</div>
</template>
