<script setup lang="ts">
import { inject, computed, ref } from "vue";
import { widgetDataKey, widgetStyleKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";
import { Menu, Setting } from "@element-plus/icons-vue";
import styles from "./style.module.scss";

const widgetData = inject(widgetDataKey)!;
const widgetStyle = inject(widgetStyleKey)!;
const { isDisabled } = useWidgetRenderState();

const treeRef = ref();

// Expose checkedKeys to linkage system
useExposeWidget(() => ({
  get checkedKeys() {
    return treeRef.value?.getCheckedKeys() ?? [];
  },
}));

// Node data
const treeData = computed(() => {
  const data = widgetData.value.props?.data;
  if (Array.isArray(data) && data.length > 0) return data;
  // Editor mode: show example data
  return [
    {
      id: "system",
      label: "System",
      type: "menu",
      children: [
        { id: "user", label: "User management", type: "menu" },
        { id: "role", label: "Role management", type: "menu" },
        { id: "menu", label: "Menu management", type: "menu" },
      ],
    },
    {
      id: "form",
      label: "Form management",
      type: "menu",
      children: [
        { id: "form_list", label: "Form list", type: "menu" },
        { id: "form_create", label: "Create form", type: "button" },
        { id: "form_edit", label: "EditForm", type: "button" },
        { id: "form_delete", label: "DeleteForm", type: "button" },
      ],
    },
  ];
});

// 树Config
const treeProps = computed(() => {
  const props =
    (widgetData.value.props?.props as Record<string, unknown> | undefined) ??
    {};
  return {
    children: (props.children as string) || "children",
    label: (props.label as string) || "label",
  };
});

const nodeKey = computed(
  () => (widgetData.value.props?.nodeKey as string) || "id",
);
const showCheckbox = computed(() =>
  Boolean(widgetData.value.props?.showCheckbox),
);
const checkStrictly = computed(() =>
  Boolean(widgetData.value.props?.checkStrictly),
);
const defaultExpandAll = computed(() =>
  Boolean(widgetData.value.props?.defaultExpandAll ?? true),
);

// 动态Style
const dynamicStyle = computed(() => {
  const s: Record<string, string> = {};
  if (widgetStyle.value?.fontSize)
    s.fontSize = widgetStyle.value.fontSize as string;
  if (widgetStyle.value?.color) s.color = widgetStyle.value.color as string;
  if (widgetStyle.value?.backgroundColor)
    s.backgroundColor = widgetStyle.value.backgroundColor as string;
  return s;
});

// 节点图标
function getNodeIcon(data: { type?: string }) {
  return data.type === "button" ? Setting : Menu;
}

function getNodeIconClass(data: { type?: string }) {
  return data.type === "button" ? styles.buttonIcon : styles.menuIcon;
}
</script>

<template>
  <div :class="styles.container" :style="dynamicStyle">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :node-key="nodeKey"
      :show-checkbox="showCheckbox"
      :check-strictly="checkStrictly"
      :default-expand-all="defaultExpandAll"
      :disabled="isDisabled"
      highlight-current
    >
      <template #default="{ data }">
        <span :class="styles.nodeContent">
          <el-icon :class="[styles.nodeIcon, getNodeIconClass(data)]">
            <component :is="getNodeIcon(data)" />
          </el-icon>
          <span :class="styles.label">{{ data.label }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>
