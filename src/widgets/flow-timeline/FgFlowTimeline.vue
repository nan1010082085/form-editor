<script setup lang="ts">
import { inject, computed, ref, onMounted, watch, type ComputedRef } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";
import { fetchApprovalLogs, type ApprovalLogItem } from "@/api/flowApi";
import { resolveWidgetUrl } from "@/utils/resolveWidgetUrl";
import { WIDGET_SURFACE_KEY, type WidgetSurface } from "../base/widgetMock";
import { flowTimelineMock } from "./mock";
import styles from "./style.module.scss";

const { t } = useI18n();

const widgetData = inject(widgetDataKey)!;
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  "variablesContext",
  computed(() => ({})),
);
const surface = inject(WIDGET_SURFACE_KEY, "runtime" as WidgetSurface);

const logs = ref<ApprovalLogItem[]>([]);
const loading = ref(false);

useExposeWidget(() => ({
  get logs() {
    return logs.value;
  },
  get loading() {
    return loading.value;
  },
}));

const title = computed(
  () =>
    (widgetData.value.props?.title as string) ||
    t("editor.flowTimeline.defaultTitle"),
);

/** Approval Actions文案Map */
const ACTION_LABEL_KEY: Record<string, string> = {
  approve: "editor.flowTimeline.actionApprove",
  reject: "editor.flowTimeline.actionReject",
  claim: "editor.flowTimeline.actionClaim",
  delegate: "editor.flowTimeline.actionDelegate",
  comment: "editor.flowTimeline.actionComment",
  "reject-to-node": "editor.flowTimeline.actionRejectToNode",
};

function resolveInstanceId(): string {
  const fixed = widgetData.value.props?.instanceId as string | undefined;
  if (fixed) {
    return resolveWidgetUrl(fixed, variablesContext.value);
  }
  const varName =
    (widgetData.value.props?.instanceIdVariable as string) || "flowInstanceId";
  const val = variablesContext.value[varName];
  return val != null ? String(val) : "";
}

const ACTION_TYPE: Record<string, "" | "success" | "danger" | "warning"> = {
  approve: "success",
  reject: "danger",
  claim: "",
  delegate: "warning",
  "reject-to-node": "danger",
};

function actionLabel(action: string): string {
  const key = ACTION_LABEL_KEY[action];
  return key ? t(key) : action;
}

function actionType(action: string): "" | "success" | "danger" | "warning" {
  return ACTION_TYPE[action] ?? "";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN");
}

async function loadLogs() {
  const instanceId = resolveInstanceId();
  if (!instanceId) {
    if (surface === "editor") {
      logs.value = flowTimelineMock.staticData.logs;
    }
    return;
  }

  loading.value = true;
  try {
    logs.value = await fetchApprovalLogs(instanceId);
  } catch (err) {
    console.error("[FgFlowTimeline] load failed:", err);
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadLogs);
watch(variablesContext, loadLogs, { deep: true });
watch(() => widgetData.value.props?.instanceId, loadLogs);
</script>

<template>
  <div :class="styles.wrapper">
    <h4 v-if="title" :class="styles.title">{{ title }}</h4>
    <div v-if="loading" :class="styles.loading">
      {{ t("editor.flowTimeline.loading") }}
    </div>
    <div v-else-if="logs.length === 0" :class="styles.empty">
      {{ t("editor.flowTimeline.empty") }}
    </div>
    <ul v-else :class="styles.list">
      <li v-for="log in logs" :key="log.id" :class="styles.item">
        <div :class="styles.header">
          <el-tag :type="actionType(log.action)" size="small">{{
            actionLabel(log.action)
          }}</el-tag>
          <span :class="styles.node">{{ log.nodeName }}</span>
        </div>
        <div :class="styles.body">
          <span :class="styles.operator">{{ log.operator }}</span>
          <span v-if="log.comment" :class="styles.comment">{{
            log.comment
          }}</span>
        </div>
        <div :class="styles.time">{{ formatTime(log.createdAt) }}</div>
      </li>
    </ul>
  </div>
</template>
