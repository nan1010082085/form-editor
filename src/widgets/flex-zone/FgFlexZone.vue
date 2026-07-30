<script setup lang="ts">
import { inject, computed } from "vue";
import { widgetDataKey } from "../base/types";

const widgetData = inject(widgetDataKey)!;
const padding = computed(() => (widgetData.value.props?.padding as number) ?? 8);
const background = computed(() => (widgetData.value.props?.background as string) ?? "transparent");
const minHeight = computed(() => (widgetData.value.props?.minHeight as number) ?? 100);
</script>

<template>
  <div
    :style="{
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
