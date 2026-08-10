<script setup lang="ts">
/**
 * FgRowContainer - 24 栅格RowContainer（Flex 画布专用）
 *
 * 职责：
 * - 24 栅格系统, 每个子节点按 span（1-24）Min配Width
 * - 子节点横向排Column, span 之和超过 24 自动换Row
 * - Edit模式：单个顺序拖放区（前/中/后插入）, 新子节点默认 span=24
 * - 预览模式：直接渲染子节点
 *
 * 与 col Container区别：col 是Fixed column数等宽；row-container 是任意 span 自由栅格。
 */
import { inject, computed, ref } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { widgetDataKey } from "../base/types";
import type { Widget } from "../base/types";
import SchemaRender from "../../components/WidgetRenderer/SchemaRender.vue";
import { useGridDropZone } from "../../composables/useGridDropZone";
import { useExposeWidget } from "../../composables/useExposeWidget";
import styles from "./style.module.scss";

const props = defineProps<{ editable?: boolean; editorSelectable?: boolean }>();

const { t } = useI18n();
const widgetData = inject(widgetDataKey)!;

useExposeWidget(() => ({
  get children() {
    return widgetData.value.children ?? [];
  },
}));

const gutter = computed(() => (widgetData.value.props?.gutter as number) ?? 12);
const children = computed(() => (widgetData.value.children ?? []) as Widget[]);

/** Parse子节点 span（1-24）, 默认 24（满宽独占一Row） */
function spanOf(child: Widget): number {
  const s = child.span;
  const n = typeof s === "number" ? s : 24;
  return Math.max(1, Math.min(24, n));
}

/** 单元格 flex-basis：span/24 Width, 扣除 gutter 避免溢出换Row计算偏差 */
function cellStyle(child: Widget): Record<string, string> {
  const span = spanOf(child);
  const g = gutter.value;
  return {
    flex: `0 0 calc(${(span / 24) * 100}% - ${g}px)`,
    maxWidth: `calc(${(span / 24) * 100}% - ${g}px)`,
  };
}

// ---- Edit态拖放（顺序插入, 无Filter, 无需 allChildren Map） ----
const dropRef = ref<HTMLElement | null>(null);
const dropEnabled = computed(() =>
  Boolean(props.editorSelectable && widgetData.value.id),
);

const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
  useGridDropZone(
    dropRef,
    () => widgetData.value.id ?? null,
    () => children.value,
    () => dropEnabled.value,
    // 新拖入的子节点默认 span=24（满宽独占一Row）
    () => ({ span: 24 }),
  );
</script>

<template>
  <div :class="styles.rowContainer" :style="{ gap: gutter + 'px' }">
    <!-- Edit态：拖放区包裹所有子节点 -->
    <div
      v-if="editorSelectable"
      ref="dropRef"
      :class="[styles.dropZone, isDragOver ? styles.dropZoneActive : '']"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div :class="styles.rowContainer" :style="{ gap: gutter + 'px' }">
        <div
          v-for="(child, ci) in children"
          :key="ci"
          :class="styles.cell"
          :style="cellStyle(child)"
        >
          <div :class="styles.cellContent">
            <SchemaRender
              :schema="child"
              :editor-selectable="editorSelectable"
            />
          </div>
        </div>
      </div>
      <div v-if="!children.length" :class="styles.dropEmpty">
        {{ t("editor.canvas.dragWidgetToRow") }}
      </div>
    </div>

    <!-- 预览态：直接渲染 -->
    <template v-else>
      <div
        v-for="(child, ci) in children"
        :key="ci"
        :class="styles.cell"
        :style="cellStyle(child)"
      >
        <div :class="styles.cellContent">
          <SchemaRender :schema="child" />
        </div>
      </div>
      <div v-if="editable && !children.length" :class="styles.cellGhost">
        {{ t("editor.canvas.dragWidget") }}
      </div>
    </template>
  </div>
</template>
