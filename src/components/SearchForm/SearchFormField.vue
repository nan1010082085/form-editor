<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import type {
  FormFieldValue,
  SearchFieldSchema,
} from "@/components/WidgetRenderer/types";
import { useDynamicOptions } from "@/composables/useDynamicOptions";

const props = defineProps<{
  field: SearchFieldSchema;
  modelValue: FormFieldValue;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: FormFieldValue];
}>();

const { t } = useI18n();

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const { options: dynamicOptions } = useDynamicOptions(() => props.field.api);

const selectOptions = computed(() => {
  if (props.field.api) return dynamicOptions.value;
  return props.field.options ?? [];
});

const fieldProps = computed(() => props.field.props ?? {});

const fieldDisplayName = computed(
  () => props.field.label ?? props.field.field ?? "",
);

const inputPlaceholder = computed(
  () =>
    props.field.placeholder ||
    t("editor.searchForm.inputField", { field: fieldDisplayName.value }),
);

const selectPlaceholder = computed(
  () =>
    props.field.placeholder ||
    t("editor.searchForm.selectField", { field: fieldDisplayName.value }),
);
</script>

<template>
  <el-input
    v-if="!field.type || field.type === 'input'"
    v-model="value as string"
    :placeholder="inputPlaceholder"
    clearable
    v-bind="fieldProps"
  />
  <el-input-number
    v-else-if="field.type === 'number'"
    v-model="value as number"
    :placeholder="field.placeholder"
    controls-position="right"
    style="width: 100%"
    v-bind="fieldProps"
  />
  <el-select
    v-else-if="field.type === 'select'"
    v-model="value"
    :placeholder="selectPlaceholder"
    clearable
    style="width: 100%"
    v-bind="fieldProps"
  >
    <el-option
      v-for="opt in selectOptions"
      :key="String(opt.value)"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
  <el-radio-group
    v-else-if="field.type === 'radio'"
    v-model="value"
    v-bind="fieldProps"
  >
    <el-radio
      v-for="opt in selectOptions"
      :key="String(opt.value)"
      :value="opt.value"
    >
      {{ opt.label }}
    </el-radio>
  </el-radio-group>
  <el-checkbox
    v-else-if="field.type === 'checkbox'"
    v-model="value as boolean"
    v-bind="fieldProps"
  >
    {{ field.label }}
  </el-checkbox>
  <el-date-picker
    v-else-if="field.type === 'date'"
    v-model="value as string"
    type="date"
    value-format="YYYY-MM-DD"
    :placeholder="selectPlaceholder"
    style="width: 100%"
    clearable
    v-bind="fieldProps"
  />
  <el-date-picker
    v-else-if="field.type === 'date-range'"
    v-model="value as string[]"
    type="daterange"
    value-format="YYYY-MM-DD"
    :range-separator="t('editor.searchForm.dateRangeSeparator')"
    :start-placeholder="t('editor.searchForm.startDate')"
    :end-placeholder="t('editor.searchForm.endDate')"
    style="width: 100%"
    clearable
    v-bind="fieldProps"
  />
</template>
