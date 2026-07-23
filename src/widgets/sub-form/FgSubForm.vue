<script setup lang="ts">
/**
 * FgSubForm — 子表单/明细表单
 *
 * 支持动态增删行，每行包含一组子字段。
 * 比 dynamic-detail-table 更通用，不依赖表格布局。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey, type FormFieldValue } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useI18n } from '@schema-platform/platform-shared'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const fields = computed(() => (widgetData.value.props?.fields as Array<{ key: string; label: string; type: string; placeholder?: string }>) ?? [])
const minRows = computed(() => (widgetData.value.props?.minRows as number) ?? 0)
const maxRows = computed(() => (widgetData.value.props?.maxRows as number) ?? 100)
const addButtonText = computed(() => (widgetData.value.props?.addButtonText as string) ?? t('editor.subForm.addRow'))

interface SubFormRow {
  _id: string
  [key: string]: FormFieldValue
}

const rows = ref<SubFormRow[]>([])

function createRow(): SubFormRow {
  const row: SubFormRow = { _id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
  for (const field of fields.value) {
    row[field.key] = field.type === 'number' ? 0 : ''
  }
  return row
}

function addRow() {
  if (rows.value.length >= maxRows.value) return
  rows.value.push(createRow())
}

function removeRow(index: number) {
  if (rows.value.length <= minRows.value) return
  rows.value.splice(index, 1)
}

function updateCell(index: number, key: string, value: FormFieldValue) {
  if (rows.value[index]) {
    rows.value[index] = { ...rows.value[index], [key]: value }
  }
}

// 初始化至少 minRows 行
if (rows.value.length === 0 && minRows.value > 0) {
  for (let i = 0; i < minRows.value; i++) {
    rows.value.push(createRow())
  }
}

useExposeWidget(() => ({
  get rows() { return rows.value.map(({ _id, ...rest }) => rest) },
  addRow,
  removeRow,
  resetRows() {
    rows.value = []
    for (let i = 0; i < minRows.value; i++) {
      rows.value.push(createRow())
    }
  },
}))
</script>

<template>
  <div :class="styles.subForm" :style="widgetStyle">
    <div v-if="fields.length === 0" :class="styles.empty">
      {{ t('editor.subForm.emptyHint') }}
    </div>
    <template v-else>
      <div :class="styles.header">
        <div v-for="field in fields" :key="field.key" :class="styles.headerCell">
          {{ field.label }}
        </div>
        <div :class="styles.headerAction">{{ t('editor.subForm.actionHeader') }}</div>
      </div>
      <div :class="styles.body">
        <div v-for="(row, index) in rows" :key="row._id" :class="styles.row">
          <div v-for="field in fields" :key="field.key" :class="styles.cell">
            <el-input
              v-if="field.type === 'text' || field.type === 'string'"
              :model-value="(row[field.key] as string)"
              :placeholder="field.placeholder ?? ''"
              size="small"
              @update:model-value="updateCell(index, field.key, $event)"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              :model-value="(row[field.key] as number)"
              size="small"
              controls-position="right"
              @update:model-value="updateCell(index, field.key, $event ?? 0)"
            />
            <el-select
              v-else-if="field.type === 'select'"
              :model-value="row[field.key]"
              size="small"
              @update:model-value="updateCell(index, field.key, $event)"
            >
              <!-- options from field config -->
            </el-select>
            <el-input
              v-else
              :model-value="String(row[field.key] ?? '')"
              :placeholder="field.placeholder ?? ''"
              size="small"
              @update:model-value="updateCell(index, field.key, $event)"
            />
          </div>
          <div :class="styles.cellAction">
            <button
              :class="styles.removeBtn"
              :disabled="rows.length <= minRows"
              :title="t('editor.subForm.deleteRow')"
              @click="removeRow(index)"
            >
              <AppIcon name="delete" :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div :class="styles.footer">
        <button :class="styles.addBtn" :disabled="rows.length >= maxRows" @click="addRow">
          <AppIcon name="plus" :size="14" />
          <span>{{ addButtonText }}</span>
        </button>
        <span :class="styles.rowCount">{{ rows.length }} / {{ maxRows }}</span>
      </div>
    </template>
  </div>
</template>
