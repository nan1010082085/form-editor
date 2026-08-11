<script setup lang="ts">
/**
 * EditorViewRightPanel — 右侧Property面板子Component
 *
 * 从 EditorView.vue 拆Min而来, 负责渲染右侧Property面板Region。
 * 包含可见性切换的动画逻辑。
 */
import PropertyPanel from "@/components/Editor/PropertyPanel.vue";
import styles from "./EditorView.module.scss";

defineProps<{
  visible: boolean;
}>();
</script>

<template>
  <div
    :class="[styles.right, { [styles.rightClosed]: !visible }]"
    :aria-hidden="!visible"
    :inert="!visible"
  >
    <PropertyPanel />
  </div>
</template>
