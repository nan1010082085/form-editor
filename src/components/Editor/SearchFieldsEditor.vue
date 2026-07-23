<script setup lang="ts">
/**
 * SearchFieldsEditor -- CRUD editor for SearchFieldSchema[].
 *
 * List-based editor for search-list inline search form fields.
 * Each field has add/remove/reorder with conditional options display
 * and full API configuration (url, method, params, dataPath, labelKey, valueKey).
 */
import { computed } from 'vue'
import type { SearchFieldSchema, DictItem, SchemaApiConfig } from '@/components/WidgetRenderer/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './SearchFieldsEditor.module.scss'

const { t } = useI18n()

const props = defineProps<{
  searchFields: SearchFieldSchema[]
}>()

const emit = defineEmits<{
  'update:searchFields': [fields: SearchFieldSchema[]]
}>()

const typeOptions = computed(() => [
  { label: t('editor.searchFieldsEditor.typeInput'), value: 'input' as const },
  { label: t('editor.searchFieldsEditor.typeNumber'), value: 'number' as const },
  { label: t('editor.searchFieldsEditor.typeSelect'), value: 'select' as const },
  { label: t('editor.searchFieldsEditor.typeRadio'), value: 'radio' as const },
  { label: t('editor.searchFieldsEditor.typeCheckbox'), value: 'checkbox' as const },
  { label: t('editor.searchFieldsEditor.typeDate'), value: 'date' as const },
  { label: t('editor.searchFieldsEditor.typeDateRange'), value: 'date-range' as const },
])

/** Types that support static options */
const OPTION_TYPES = ['select', 'radio', 'checkbox'] as const

function needsOptions(type: string): boolean {
  return (OPTION_TYPES as readonly string[]).includes(type)
}

function addField() {
  const field: SearchFieldSchema = {
    type: 'input',
    field: '',
    label: '',
    span: 8,
    placeholder: '',
  }
  emit('update:searchFields', [...props.searchFields, field])
}

function removeField(index: number) {
  emit('update:searchFields', props.searchFields.filter((_, i) => i !== index))
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.searchFields]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:searchFields', updated)
}

function moveDown(index: number) {
  if (index >= props.searchFields.length - 1) return
  const updated = [...props.searchFields]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:searchFields', updated)
}

function updateField<K extends keyof SearchFieldSchema>(index: number, field: K, value: SearchFieldSchema[K]) {
  const updated = props.searchFields.map((f, i) =>
    i === index ? { ...f, [field]: value } : f,
  )
  emit('update:searchFields', updated)
}

/** Parse options text (one per line: label=value) into DictItem[] */
function parseOptionsText(text: string): DictItem[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) return { label: line, value: line }
      return { label: line.slice(0, eqIdx).trim(), value: line.slice(eqIdx + 1).trim() }
    })
}

function optionsToText(options?: DictItem[]): string {
  if (!options?.length) return ''
  return options.map((o) => `${o.label}=${o.value}`).join('\n')
}

function updateApiField(index: number, patch: Partial<SchemaApiConfig>) {
  const current: SchemaApiConfig | undefined = props.searchFields[index]?.api
  if (current) {
    updateField(index, 'api', { ...current, ...patch })
  } else {
    updateField(index, 'api', { url: '', ...patch } as SchemaApiConfig)
  }
}

function removeApi(index: number) {
  updateField(index, 'api', undefined)
}

/** Params text buffer per field index -- avoid mutating props directly during editing */
const paramsTextCache: Record<number, string> = {}

function getParamsText(idx: number, field: SearchFieldSchema): string {
  if (idx in paramsTextCache) return paramsTextCache[idx]
  const p = field.api?.params
  return p ? JSON.stringify(p, null, 2) : ''
}

function handleParamsChange(idx: number, text: string) {
  paramsTextCache[idx] = text
  if (!text.trim()) {
    updateApiField(idx, { params: undefined })
    return
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    updateApiField(idx, { params: parsed })
  } catch { /* invalid JSON -- don't update until valid */ }
}
</script>

<template>
  <div :class="styles['search-fields-editor']">
    <div v-if="searchFields.length === 0" :class="styles['search-fields-editor__empty']">
      {{ t('editor.searchFieldsEditor.emptyHint') }}
    </div>

    <div
      v-for="(field, idx) in searchFields"
      :key="idx"
      :class="styles['search-fields-editor__item']"
    >
      <div :class="styles['search-fields-editor__item-header']">
        <span :class="styles['search-fields-editor__item-title']">{{ t('editor.searchFieldsEditor.fieldTitle', { index: idx + 1 }) }}</span>
        <div :class="styles['search-fields-editor__item-actions']">
          <el-button
            size="small"
            :icon="ArrowUp"
            text
            :disabled="idx === 0"
            @click="moveUp(idx)"
          />
          <el-button
            size="small"
            :icon="ArrowDown"
            text
            :disabled="idx === searchFields.length - 1"
            @click="moveDown(idx)"
          />
          <el-button
            size="small"
            :icon="Delete"
            type="danger"
            text
            @click="removeField(idx)"
          />
        </div>
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.type') }}</label>
        <el-select
          :model-value="field.type"
          size="small"
          style="width: 100%"
          @update:model-value="updateField(idx, 'type', $event)"
        >
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.field') }}</label>
        <el-input
          :model-value="field.field"
          size="small"
          :placeholder="t('editor.searchFieldsEditor.fieldPlaceholder')"
          @update:model-value="updateField(idx, 'field', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.label') }}</label>
        <el-input
          :model-value="field.label"
          size="small"
          :placeholder="t('editor.searchFieldsEditor.labelPlaceholder')"
          @update:model-value="updateField(idx, 'label', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.span') }}</label>
        <el-input-number
          :model-value="field.span ?? 8"
          :min="1"
          controls-position="right"
          :max="24"
          size="small"
          style="width: 100%"
          @update:model-value="updateField(idx, 'span', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.placeholder') }}</label>
        <el-input
          :model-value="field.placeholder ?? ''"
          size="small"
          :placeholder="t('editor.searchFieldsEditor.placeholderPlaceholder')"
          @update:model-value="updateField(idx, 'placeholder', $event || undefined)"
        />
      </div>

      <template v-if="needsOptions(field.type)">
        <div :class="styles['search-fields-editor__field']">
          <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.options') }}</label>
          <el-input
            type="textarea"
            :model-value="optionsToText(field.options)"
            :rows="3"
            :placeholder="t('editor.searchFieldsEditor.optionsPlaceholder')"
            @update:model-value="updateField(idx, 'options', parseOptionsText($event))"
          />
        </div>

        <div :class="styles['search-fields-editor__api-section']">
          <div :class="styles['search-fields-editor__field']">
            <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.apiUrl') }}</label>
            <el-input
              :model-value="field.api?.url ?? ''"
              size="small"
              placeholder="/api/options"
              @update:model-value="updateApiField(idx, { url: $event || '' })"
            />
          </div>

          <template v-if="field.api?.url">
            <div :class="styles['search-fields-editor__field']">
              <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.apiMethod') }}</label>
              <el-select
                :model-value="field.api?.method ?? 'get'"
                size="small"
                style="width: 100%"
                @update:model-value="updateApiField(idx, { method: $event as 'get' | 'post' })"
              >
                <el-option label="GET" value="get" />
                <el-option label="POST" value="post" />
              </el-select>
            </div>

            <div :class="styles['search-fields-editor__field']">
              <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.apiParams') }}</label>
              <el-input
                type="textarea"
                :model-value="getParamsText(idx, field)"
                :rows="2"
                placeholder='{"key": "value"}'
                @update:model-value="handleParamsChange(idx, $event)"
              />
            </div>

            <div :class="styles['search-fields-editor__field']">
              <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.dataPath') }}</label>
              <el-input
                :model-value="field.api?.dataPath ?? ''"
                size="small"
                placeholder="data"
                @update:model-value="updateApiField(idx, { dataPath: $event || undefined })"
              />
            </div>

            <div :class="[styles['search-fields-editor__field'], styles['api-config__field--row']]">
              <div style="flex: 1">
                <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.labelKey') }}</label>
                <el-input
                  :model-value="field.api?.labelKey ?? 'label'"
                  size="small"
                  placeholder="label"
                  @update:model-value="updateApiField(idx, { labelKey: $event || undefined })"
                />
              </div>
              <div style="flex: 1">
                <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.valueKey') }}</label>
                <el-input
                  :model-value="field.api?.valueKey ?? 'value'"
                  size="small"
                  placeholder="value"
                  @update:model-value="updateApiField(idx, { valueKey: $event || undefined })"
                />
              </div>
            </div>

            <el-button size="small" type="danger" style="width:100%;margin-top:4px" @click="removeApi(idx)">
              {{ t('editor.searchFieldsEditor.removeApi') }}
            </el-button>
          </template>
        </div>
      </template>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">{{ t('editor.searchFieldsEditor.defaultValue') }}</label>
        <el-input
          :model-value="String(field.defaultValue ?? '')"
          size="small"
          :placeholder="t('editor.searchFieldsEditor.defaultValuePlaceholder')"
          @update:model-value="updateField(idx, 'defaultValue', $event)"
        />
      </div>
    </div>

    <el-button
      type="primary"
      size="small"
      style="width: 100%; margin-top: 8px"
      :icon="Plus"
      @click="addField"
    >
      {{ t('editor.searchFieldsEditor.addFieldText') }}
    </el-button>
  </div>
</template>

