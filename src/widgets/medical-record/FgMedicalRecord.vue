<script setup lang="ts">
import { computed, inject } from "vue";
import { widgetDataKey } from "../base/types";
import { useWidgetRenderState } from "../../composables/useWidgetRenderState";
import { useExposeWidget } from "../../composables/useExposeWidget";

const widgetData = inject(widgetDataKey)!;
const { isDisabled } = useWidgetRenderState();

const showLabels = computed(() => (widgetData.value.props?.showLabels as boolean) ?? true);
const formData = computed(() => (widgetData.value.props?.formData as Record<string, unknown>) ?? {});

const FIELDS = [
  { key: "chiefComplaint", label: "Chief Complaint", placeholder: "Describe the main complaint" },
  { key: "diagnosis", label: "Diagnosis", placeholder: "Diagnosis details" },
  { key: "medications", label: "Medications", placeholder: "Prescribed medications and dosage" },
  { key: "examinations", label: "Examinations", placeholder: "Required examinations" },
  { key: "notes", label: "Doctor Notes", placeholder: "Additional notes" },
];

function updateField(key: string, value: string) {
  const current = widgetData.value.props as Record<string, unknown> | undefined;
  const currentFormData = (current?.formData as Record<string, unknown>) ?? {};
  widgetData.value.props = {
    ...current,
    formData: { ...currentFormData, [key]: value },
  };
}

useExposeWidget(() => ({
  get value() { return formData.value; },
}));
</script>

<template>
  <el-form :class="$style.form">
    <el-form-item
      v-for="field in FIELDS"
      :key="field.key"
      :label="showLabels ? field.label : undefined"
    >
      <el-input
        type="textarea"
        :model-value="(formData as Record<string, unknown>)[field.key] as string"
        :placeholder="field.placeholder"
        :disabled="isDisabled"
        :rows="3"
        @update:model-value="(v: string) => updateField(field.key, v)"
      />
    </el-form-item>
  </el-form>
</template>

<style module lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 6px;
}
</style>
