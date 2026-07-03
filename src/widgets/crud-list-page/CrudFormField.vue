<script setup lang="ts">
import { computed } from 'vue'
import type { CrudFormFieldSchema } from './config'

const props = defineProps<{
  field: CrudFormFieldSchema
  modelValue: unknown
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <el-input
    v-if="!field.type || field.type === 'input'"
    v-model="value as string"
    :placeholder="field.placeholder || `请输入${field.label}`"
    clearable
  />
  <el-input
    v-else-if="field.type === 'textarea'"
    v-model="value as string"
    type="textarea"
    :rows="3"
    :placeholder="field.placeholder || `请输入${field.label}`"
  />
  <el-input-number
    v-else-if="field.type === 'number'"
    v-model="value as number"
    controls-position="right"
    style="width: 100%"
  />
  <el-select
    v-else-if="field.type === 'select'"
    v-model="value"
    :placeholder="field.placeholder || `请选择${field.label}`"
    clearable
    style="width: 100%"
  >
    <el-option
      v-for="opt in field.options ?? []"
      :key="String(opt.value)"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
  <el-radio-group
    v-else-if="field.type === 'radio'"
    v-model="value"
  >
    <el-radio
      v-for="opt in field.options ?? []"
      :key="String(opt.value)"
      :value="opt.value"
    >
      {{ opt.label }}
    </el-radio>
  </el-radio-group>
  <el-switch
    v-else-if="field.type === 'switch'"
    v-model="value as boolean"
  />
  <el-date-picker
    v-else-if="field.type === 'date'"
    v-model="value as string"
    type="date"
    value-format="YYYY-MM-DD"
    :placeholder="field.placeholder || `请选择${field.label}`"
    style="width: 100%"
    clearable
  />
</template>
