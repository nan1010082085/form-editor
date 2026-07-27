<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import type { CrudFormFieldSchema } from '@/widgets/crud-list-page/config'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './SearchFieldsEditor.module.scss'

const { t } = useI18n()

const props = defineProps<{
  fields: CrudFormFieldSchema[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: CrudFormFieldSchema[]]
}>()

const typeOptions = computed(() => [
  { label: t('editor.crudFormFieldsEditor.typeInput'), value: 'input' as const },
  { label: t('editor.crudFormFieldsEditor.typeTextarea'), value: 'textarea' as const },
  { label: t('editor.crudFormFieldsEditor.typeNumber'), value: 'number' as const },
  { label: t('editor.crudFormFieldsEditor.typeSelect'), value: 'select' as const },
  { label: t('editor.crudFormFieldsEditor.typeRadio'), value: 'radio' as const },
  { label: t('editor.crudFormFieldsEditor.typeSwitch'), value: 'switch' as const },
  { label: t('editor.crudFormFieldsEditor.typeDate'), value: 'date' as const },
])

const OPTION_TYPES = ['select', 'radio'] as const

function needsOptions(type?: string): boolean {
  return (OPTION_TYPES as readonly string[]).includes(type ?? '')
}

function addField() {
  const field: CrudFormFieldSchema = {
    type: 'input',
    field: '',
    label: '',
    span: 24,
    placeholder: '',
  }
  emit('update:fields', [...props.fields, field])
}

function removeField(index: number) {
  emit('update:fields', props.fields.filter((_, i) => i !== index))
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.fields]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:fields', updated)
}

function moveDown(index: number) {
  if (index >= props.fields.length - 1) return
  const updated = [...props.fields]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:fields', updated)
}

function updateField<K extends keyof CrudFormFieldSchema>(
  index: number,
  key: K,
  value: CrudFormFieldSchema[K],
) {
  emit(
    'update:fields',
    props.fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
  )
}

function parseOptionsText(text: string): Array<{ label: string; value: string | number }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) return { label: line, value: line }
      const value = line.slice(eqIdx + 1).trim()
      const num = Number(value)
      return { label: line.slice(0, eqIdx).trim(), value: Number.isNaN(num) ? value : num }
    })
}

function optionsToText(options?: Array<{ label: string; value: string | number }>): string {
  if (!options?.length) return ''
  return options.map((o) => `${o.label}=${o.value}`).join('\n')
}
</script>

<template>
  <div :class="styles['search-fields-editor']">
    <div v-if="fields.length === 0" :class="styles['search-fields-editor__empty']">
      {{ t('editor.crudFormFieldsEditor.emptyHint') }}
    </div>

    <div
      v-for="(field, idx) in fields"
      :key="idx"
      :class="styles['search-fields-editor__item']"
    >
      <div :class="styles['search-fields-editor__item-header']">
        <span :class="styles['search-fields-editor__item-title']">{{ t('editor.crudFormFieldsEditor.fieldTitle', { index: idx + 1 }) }}</span>
        <div :class="styles['search-fields-editor__item-actions']">
          <el-button size="small" text :disabled="idx === 0" @click="moveUp(idx)">
            <AppIcon name="arrow-up" />
          </el-button>
          <el-button size="small" text :disabled="idx === fields.length - 1" @click="moveDown(idx)">
            <AppIcon name="arrow-down" />
          </el-button>
          <el-button size="small" type="danger" text @click="removeField(idx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.type') }}</label>
        <el-select
          :model-value="field.type ?? 'input'"
          size="small"
          style="width: 100%"
          @update:model-value="updateField(idx, 'type', $event)"
        >
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.field') }}</label>
        <el-input
          :model-value="field.field"
          size="small"
          :placeholder="t('editor.crudFormFieldsEditor.fieldPlaceholder')"
          @update:model-value="updateField(idx, 'field', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.label') }}</label>
        <el-input
          :model-value="field.label"
          size="small"
          :placeholder="t('editor.crudFormFieldsEditor.labelPlaceholder')"
          @update:model-value="updateField(idx, 'label', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.span') }}</label>
        <el-input-number
          :model-value="field.span ?? 24"
          :min="1"
          :max="24"
          controls-position="right"
          size="small"
          style="width: 100%"
          @update:model-value="updateField(idx, 'span', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.placeholder') }}</label>
        <el-input
          :model-value="field.placeholder ?? ''"
          size="small"
          :placeholder="t('editor.crudFormFieldsEditor.placeholderPlaceholder')"
          @update:model-value="updateField(idx, 'placeholder', $event || undefined)"
        />
      </div>

      <template v-if="needsOptions(field.type)">
        <div :class="styles['search-fields-editor__field']">
          <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.options') }}</label>
          <el-input
            type="textarea"
            :model-value="optionsToText(field.options)"
            :rows="3"
            :placeholder="t('editor.crudFormFieldsEditor.optionsPlaceholder')"
            @update:model-value="updateField(idx, 'options', parseOptionsText($event))"
          />
        </div>
      </template>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.crudFormFieldsEditor.defaultValue') }}</label>
        <el-input
          v-if="field.type !== 'switch'"
          :model-value="String(field.defaultValue ?? '')"
          size="small"
          :placeholder="t('editor.crudFormFieldsEditor.defaultValuePlaceholder')"
          @update:model-value="updateField(idx, 'defaultValue', $event)"
        />
        <el-switch
          v-else
          :model-value="Boolean(field.defaultValue)"
          @update:model-value="updateField(idx, 'defaultValue', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <el-checkbox
          :model-value="field.required ?? false"
          @update:model-value="updateField(idx, 'required', $event)"
        >
          {{ t('editor.crudFormFieldsEditor.required') }}
        </el-checkbox>
        <el-checkbox
          :model-value="field.hiddenOnCreate ?? false"
          @update:model-value="updateField(idx, 'hiddenOnCreate', $event)"
        >
          {{ t('editor.crudFormFieldsEditor.hiddenOnCreate') }}
        </el-checkbox>
        <el-checkbox
          :model-value="field.hiddenOnEdit ?? false"
          @update:model-value="updateField(idx, 'hiddenOnEdit', $event)"
        >
          {{ t('editor.crudFormFieldsEditor.hiddenOnEdit') }}
        </el-checkbox>
      </div>
    </div>

    <el-button type="primary" size="small" style="width: 100%; margin-top: 8px" @click="addField">
      <AppIcon name="plus" style="margin-right: 4px" />
      {{ t('editor.crudFormFieldsEditor.addFieldText') }}
    </el-button>
  </div>
</template>
