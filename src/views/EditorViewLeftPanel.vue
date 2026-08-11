<script setup lang="ts">
/**
 * EditorViewLeftPanel — 左侧面板子Component
 *
 * 从 EditorView.vue 拆Min而来, 负责渲染左侧面板（Component树/大纲）。
 * 包含可见性切换的动画逻辑。
 */
import EditorLeftPanel from "@/components/Editor/EditorLeftPanel.vue";
import styles from "./EditorView.module.scss";

defineProps<{
  visible: boolean;
  schemaStatus: "draft" | "published";
  schemaType: "form" | "page";
  schemaId: string | null;
}>();
</script>

<template>
  <div
    :class="[styles.left, { [styles.leftClosed]: !visible }]"
    :aria-hidden="!visible"
    :inert="!visible"
  >
    <EditorLeftPanel
      :schema-status="schemaStatus"
      :schema-type="schemaType"
      :schema-id="schemaId"
    />
  </div>
</template>
