<script setup lang="ts">
import { inject, computed } from "vue";
import { widgetDataKey } from "../base/types";

const widgetData = inject(widgetDataKey)!;
const padding = computed(() => (widgetData.value.props?.padding as number) ?? 8);
const background = computed(() => (widgetData.value.props?.background as string) ?? "transparent");
const minHeight = computed(() => (widgetData.value.props?.minHeight as number) ?? 100);
const direction = computed(() => (widgetData.value.props?.direction as string) ?? "row");
const gap = computed(() => (widgetData.value.props?.gap as number) ?? 8);
const wrap = computed(() => (widgetData.value.props?.wrap as boolean) ?? true);
const justify = computed(() => (widgetData.value.props?.justify as string) ?? "flex-start");
const align = computed(() => (widgetData.value.props?.align as string) ?? "stretch");
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      justifyContent: justify,
      alignItems: align,
      gap: gap + 'px',
      padding: padding + 'px',
      background,
      minHeight: minHeight + 'px',
      border: '1px dashed var(--el-border-color, #dcdfe6)',
      borderRadius: '6px',
    }"
  >
    <slot />
  </div>
</template>
