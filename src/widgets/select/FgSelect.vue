<script setup lang="ts">
import { inject, computed, ref } from "vue";
import { widgetDataKey } from "../base/types";
import "./FgSelect.module.scss";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useDynamicOptions } from "../../composables/useDynamicOptions";
import { useExposeWidget } from "../../composables/useExposeWidget";
import { useWidgetControlSize } from "../../composables/useWidgetControlSize";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();
const { controlStyle: dynamicStyle } = useWidgetControlSize(32);

useExposeWidget((wd) => ({
  get value() {
    return wd.value.defaultValue;
  },
}));

// 动态Options加载（api Config存在Hrs生效）
const { options: dynamicOptions, loading } = useDynamicOptions(
  computed(() => widgetData.value.api),
);

// 合并：动态Options优先, 降级到静态 options
const resolvedOptions = computed(() =>
  dynamicOptions.value.length
    ? dynamicOptions.value
    : (widgetData.value.options ?? []),
);

const selectRef = ref<{ $el?: HTMLElement }>();

/**
 * 可访问名称：优先 label / field，避免 el-select 内部 combobox 无 label（axe critical）
 */
const accessibleName = computed(() => {
  const label = widgetData.value.label;
  const field = widgetData.value.field;
  if (typeof label === "string" && label.trim()) return label.trim();
  if (typeof field === "string" && field.trim()) return field.trim();
  return (
    (widgetData.value.props?.placeholder as string) ||
    t("editor.select.placeholder")
  );
});

function forwardNativeChange() {
  selectRef.value?.$el?.dispatchEvent(new Event("change", { bubbles: true }));
}
</script>

<template>
  <el-select
    ref="selectRef"
    v-model="widgetData.defaultValue"
    :style="dynamicStyle"
    :aria-label="accessibleName"
    :placeholder="
      (widgetData.props?.placeholder as string) ||
      t('editor.select.placeholder')
    "
    :disabled="isDisabled"
    :clearable="(widgetData.props?.clearable as boolean) ?? true"
    :multiple="(widgetData.props?.multiple as boolean) || false"
    :filterable="(widgetData.props?.filterable as boolean) || false"
    :loading="loading"
    @change="forwardNativeChange"
  >
    <el-option
      v-for="opt in resolvedOptions"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
