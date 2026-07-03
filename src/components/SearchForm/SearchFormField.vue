<script setup lang="ts">
import { computed } from 'vue'
import type { FormFieldValue, SearchFieldSchema } from '@/components/WidgetRenderer/types'
import { useDynamicOptions } from '@/composables/useDynamicOptions'

const props = defineProps<{
  field: SearchFieldSchema
  modelValue: FormFieldValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FormFieldValue]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { options: dynamicOptions } = useDynamicOptions(() => props.field.api)

const selectOptions = computed(() => {
  if (props.field.api) return dynamicOptions.value
  return props.field.options ?? []
})

const fieldProps = computed(() => props.field.props ?? {})
</script>

<template>
  <el-input
    v-if="!field.type || field.type === 'input'"
    v-model="value as string"
    :placeholder="field.placeholder || `请输入${field.label ?? field.field}`"
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
    :placeholder="field.placeholder || `请选择${field.label ?? field.field}`"
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
    :placeholder="field.placeholder || `请选择${field.label ?? field.field}`"
    style="width: 100%"
    clearable
    v-bind="fieldProps"
  />
  <el-date-picker
    v-else-if="field.type === 'date-range'"
    v-model="value as string[]"
    type="daterange"
    value-format="YYYY-MM-DD"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    style="width: 100%"
    clearable
    v-bind="fieldProps"
  />
</template>
