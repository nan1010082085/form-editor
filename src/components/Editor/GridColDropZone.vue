<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import type { Widget } from "@/widgets/base/types";
import { useGridDropZone } from "@/composables/useGridDropZone";
import SchemaRender from "../WidgetRenderer/SchemaRender.vue";
import styles from "../WidgetRenderer/WidgetNode.module.scss";

const props = defineProps<{
  parentId: string;
  colIndex: number;
  allChildren: Widget[];
  editorSelectable?: boolean;
}>();

const { t } = useI18n();

const siblings = computed(() =>
  props.allChildren.filter((c) => (c.colIndex ?? 0) === props.colIndex),
);

const dropRef = ref<HTMLElement | null>(null);
const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
  useGridDropZone(
    dropRef,
    () => props.parentId,
    () => siblings.value,
    () => Boolean(props.editorSelectable),
    () => ({ colIndex: props.colIndex }),
    // col Container按 colIndex Filter, 拖放Index需Map回全量 children
    () => props.allChildren,
  );
</script>

<template>
  <div
    ref="dropRef"
    :class="[styles.gridDropZone, isDragOver ? styles.gridDropZoneActive : '']"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <SchemaRender
      v-for="(child, ci) in siblings"
      :key="ci"
      :schema="child"
      :editor-selectable="editorSelectable"
    />
    <div v-if="!siblings.length" :class="styles.gridDropEmpty">{{ t('editor.canvas.dragWidget') }}</div>
  </div>
</template>
