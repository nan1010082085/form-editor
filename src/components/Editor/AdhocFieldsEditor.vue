<script setup lang="ts">
import type { AdhocQueryField } from '@/widgets/adhoc-query/config'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './SearchFieldsEditor.module.scss'

const props = defineProps<{
  fields: AdhocQueryField[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: AdhocQueryField[]]
}>()

const typeOptions = [
  { label: '输入框', value: 'input' as const },
  { label: '下拉选择', value: 'select' as const },
]

function addField() {
  emit('update:fields', [...props.fields, { field: '', label: '', type: 'input' }])
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

function updateField<K extends keyof AdhocQueryField>(
  index: number,
  key: K,
  value: AdhocQueryField[K],
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
      未配置可选字段。
    </div>

    <div
      v-for="(field, idx) in fields"
      :key="idx"
      :class="styles['search-fields-editor__item']"
    >
      <div :class="styles['search-fields-editor__item-header']">
        <span :class="styles['search-fields-editor__item-title']">字段 {{ idx + 1 }}</span>
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
        <label :class="styles['search-fields-editor__label']">类型</label>
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
        <label :class="styles['search-fields-editor__label']">字段</label>
        <el-input
          :model-value="field.field"
          size="small"
          placeholder="字段名"
          @update:model-value="updateField(idx, 'field', $event)"
        />
      </div>

      <div :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">标签</label>
        <el-input
          :model-value="field.label"
          size="small"
          placeholder="显示标签"
          @update:model-value="updateField(idx, 'label', $event)"
        />
      </div>

      <div v-if="field.type === 'select'" :class="styles['search-fields-editor__field']">
        <label :class="styles['search-fields-editor__label']">选项 (label=value, 每行一个)</label>
        <el-input
          type="textarea"
          :model-value="optionsToText(field.options)"
          :rows="3"
          placeholder="选项A=opt_a"
          @update:model-value="updateField(idx, 'options', parseOptionsText($event))"
        />
      </div>
    </div>

    <el-button type="primary" size="small" style="width: 100%; margin-top: 8px" @click="addField">
      <AppIcon name="plus" style="margin-right: 4px" />
      添加字段
    </el-button>
  </div>
</template>
