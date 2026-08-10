<script setup lang="ts">
/**
 * FgApprovalProcess — Approval Process Widget
 *
 * 展示审批工作流的当前节点和历史记录。
 * 核心能力：
 * - 流程节点Config（Label/Status/审批人/Hrs间/备注）
 * - 水平/垂直方向
 * - Hrs间线Show
 * - 节点大小
 * - Status颜色（活跃/已passed/已拒绝）
 */
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;

// ---- Props ----
const orientation = computed(() => (widgetData.value.props?.orientation as string) ?? "horizontal");
const showTimeline = computed(() => (widgetData.value.props?.showTimeline as boolean) ?? true);
const nodeSize = computed(() => (widgetData.value.props?.nodeSize as string) ?? "medium");
const activeColor = computed(() => (widgetData.value.props?.activeColor as string) ?? "#409eff");
const approvedColor = computed(() => (widgetData.value.props?.approvedColor as string) ?? "#67c23a");
const rejectedColor = computed(() => (widgetData.value.props?.rejectedColor as string) ?? "#f56c6c");

// ---- Data ----
interface ApprovalNode {
  id: string;
  label: string;
  status: "pending" | "active" | "approved" | "rejected";
  assignee?: string;
  time?: string;
  comment?: string;
}

const nodes = computed<ApprovalNode[]>(() => (widgetData.value.props?.nodes as ApprovalNode[]) ?? []);
const currentNode = computed(() => nodes.value.find((n) => n.status === "active")?.label ?? "");
const status = computed(() => {
  const active = nodes.value.find((n) => n.status === "active");
  if (active) return "pending";
  const rejected = nodes.value.find((n) => n.status === "rejected");
  if (rejected) return "rejected";
  const allApproved = nodes.value.every((n) => n.status === "approved" || n.status === "pending");
  if (allApproved && nodes.value.some((n) => n.status === "approved")) return "approved";
  return "pending";
});

// ---- Expose ----
useExposeWidget(() => ({
  currentNode: currentNode.value,
  status: status.value,
}));

// ---- Helpers ----
function getNodeColor(nodeStatus: string): string {
  switch (nodeStatus) {
    case "active":
      return activeColor.value;
    case "approved":
      return approvedColor.value;
    case "rejected":
      return rejectedColor.value;
    default:
      return "#c0c4cc";
  }
}

function getNodeIcon(nodeStatus: string): string {
  switch (nodeStatus) {
    case "active":
      return "⏳";
    case "approved":
      return "✓";
    case "rejected":
      return "✗";
    default:
      return "○";
  }
}
</script>

<template>
  <div
    class="fg-approval-process"
    :class="[`fg-approval-process--${orientation}`, `fg-approval-process--${nodeSize}`]"
  >
    <!-- Process Nodes -->
    <div class="fg-approval-process__nodes">
      <div
        v-for="(node, idx) in nodes"
        :key="node.id"
        class="fg-approval-process__node"
        :class="[`fg-approval-process__node--${node.status}`]"
      >
        <!-- Node Circle -->
        <div
          class="fg-approval-process__circle"
          :style="{ backgroundColor: getNodeColor(node.status) }"
        >
          <span class="fg-approval-process__icon">{{ getNodeIcon(node.status) }}</span>
        </div>

        <!-- Connector Line -->
        <div
          v-if="idx < nodes.length - 1"
          class="fg-approval-process__line"
          :style="{ backgroundColor: node.status === 'approved' ? approvedColor : '#c0c4cc' }"
        />

        <!-- Node Label -->
        <div class="fg-approval-process__label">
          {{ node.label }}
        </div>

        <!-- Timeline -->
        <div v-if="showTimeline" class="fg-approval-process__timeline">
          <div v-if="node.assignee" class="fg-approval-process__assignee">
            {{ node.assignee }}
          </div>
          <div v-if="node.time" class="fg-approval-process__time">
            {{ node.time }}
          </div>
          <div v-if="node.comment" class="fg-approval-process__comment">
            {{ node.comment }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fg-approval-process {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fg-approval-process__nodes {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.fg-approval-process--vertical .fg-approval-process__nodes {
  flex-direction: column;
  align-items: flex-start;
}

.fg-approval-process__node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.fg-approval-process--vertical .fg-approval-process__node {
  flex-direction: row;
  min-width: auto;
  min-height: 80px;
}

.fg-approval-process__circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.fg-approval-process--small .fg-approval-process__circle {
  width: 24px;
  height: 24px;
}

.fg-approval-process--large .fg-approval-process__circle {
  width: 40px;
  height: 40px;
}

.fg-approval-process__icon {
  color: white;
  font-size: 14px;
}

.fg-approval-process__line {
  position: absolute;
  top: 16px;
  left: 32px;
  right: -32px;
  height: 2px;
}

.fg-approval-process--vertical .fg-approval-process__line {
  top: 32px;
  left: 16px;
  right: auto;
  width: 2px;
  height: calc(100% - 32px);
}

.fg-approval-process__label {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.fg-approval-process--vertical .fg-approval-process__label {
  margin-top: 0;
  margin-left: 12px;
}

.fg-approval-process__timeline {
  margin-top: 8px;
  font-size: 11px;
  color: #909399;
  text-align: center;
}

.fg-approval-process--vertical .fg-approval-process__timeline {
  margin-top: 0;
  margin-left: 12px;
}

.fg-approval-process__assignee {
  font-weight: 500;
}

.fg-approval-process__time {
  margin-top: 2px;
}

.fg-approval-process__comment {
  margin-top: 2px;
  font-style: italic;
}
</style>
