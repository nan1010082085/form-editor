<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

interface TreeNode {
  id?: string;
  label: string;
  children?: TreeNode[];
  [k: string]: unknown;
}

const data = computed<TreeNode>(() => {
  const raw = widgetData.value.props?.data;
  return raw && typeof raw === "object" ? (raw as TreeNode) : { id: "root", label: "Root", children: [] };
});

const layout = computed(() => (widgetData.value.props?.layout as string) ?? "vertical");
const expandAll = computed(() => (widgetData.value.props?.expandAll as boolean) ?? true);

function toElTreeData(node: TreeNode, path = ""): Record<string, unknown> {
  const id = node.id ?? path;
  return {
    id,
    label: node.label ?? "Node",
    children: (node.children ?? []).map((c, i) => toElTreeData(c, `${id}-${i}`)),
  };
}

const treeData = computed(() => [toElTreeData(data.value)]);

useExposeWidget(() => ({
  get selectedNode() { return data.value.label; },
}));
</script>

<template>
  <div :class="$style.mindMap">
    <el-tree
      :data="treeData"
      :default-expand-all="expandAll"
      node-key="id"
      :props="{ label: 'label', children: 'children' }"
    >
      <template #default="{ data: node }">
        <span :class="$style.nodeLabel">{{ node.label }}</span>
      </template>
    </el-tree>
  </div>
</template>

<style module lang="scss">
.mindMap {
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 6px;
  padding: 12px;
}
.nodeLabel {
  font-size: 13px;
  color: var(--el-text-color-primary, #303133);
}
</style>
