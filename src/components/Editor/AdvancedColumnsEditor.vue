<script setup lang="ts">
/**
 * AdvancedColumnsEditor -- 高级表格列配置编辑器
 *
 * 支持：render 模式、tooltip、filterable、buttons 行内按钮、linkEvent、colorMap、api、align、fixed 等
 */
import { ref } from 'vue'
import type { AdvancedTableColumn, ActionButton } from '@/widgets/advanced-table/config'
import { COLUMN_PRESETS } from '@/widgets/advanced-table/columnPresets'
import type { SchemaApiConfig } from '@/components/WidgetRenderer/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import ActionListEditor from '@/components/Editor/ActionListEditor.vue'
import type { ActionTypeOption } from '@/components/Editor/ActionListEditor.vue'
import styles from './AdvancedColumnsEditor.module.scss'

const { t } = useI18n()

const props = defineProps<{
  columns: AdvancedTableColumn[]
}>()

const emit = defineEmits<{
  'update:columns': [columns: AdvancedTableColumn[]]
}>()

const selectedPresetId = ref('')

function applyColumnPreset() {
  const preset = COLUMN_PRESETS.find((p) => p.id === selectedPresetId.value)
  if (!preset) return
  emit('update:columns', preset.columns.map((col) => ({ ...col })))
}

// ---- Options ----

const renderOptions = [
  { label: t('editor.columnsEditor.renderText'), value: 'text' },
  { label: t('editor.columnsEditor.renderLink'), value: 'link' },
  { label: t('editor.columnsEditor.renderTag'), value: 'tag' },
  { label: t('editor.columnsEditor.renderBadge'), value: 'badge' },
  { label: t('editor.columnsEditor.renderImage'), value: 'image' },
  { label: t('editor.columnsEditor.renderButtons'), value: 'buttons' },
  { label: t('editor.columnsEditor.renderTooltip'), value: 'tooltip' },
  { label: t('editor.columnsEditor.renderCustom'), value: 'custom' },
]

const fixedOptions = [
  { label: t('editor.columnsEditor.fixedNone'), value: undefined as 'left' | 'right' | undefined },
  { label: t('editor.columnsEditor.fixedLeft'), value: 'left' as const },
  { label: t('editor.columnsEditor.fixedRight'), value: 'right' as const },
]

const alignOptions = [
  { label: t('editor.columnsEditor.alignLeft'), value: 'left' },
  { label: t('editor.columnsEditor.alignCenter'), value: 'center' },
  { label: t('editor.columnsEditor.alignRight'), value: 'right' },
]

const buttonTypeOptions = [
  { label: t('editor.columnsEditor.buttonTypeDefault'), value: '' },
  { label: t('editor.columnsEditor.buttonTypePrimary'), value: 'primary' },
  { label: t('editor.columnsEditor.buttonTypeSuccess'), value: 'success' },
  { label: t('editor.columnsEditor.buttonTypeWarning'), value: 'warning' },
  { label: t('editor.columnsEditor.buttonTypeDanger'), value: 'danger' },
  { label: t('editor.columnsEditor.buttonTypeInfo'), value: 'info' },
  { label: t('editor.columnsEditor.buttonTypeText'), value: 'text' },
]

const actionTypeOptions: ActionTypeOption[] = [
  { label: t('editor.columnsEditor.actionShow'), value: 'show' },
  { label: t('editor.columnsEditor.actionHide'), value: 'hide' },
  { label: t('editor.columnsEditor.actionOpenDialog'), value: 'open-dialog' },
  { label: t('editor.columnsEditor.actionCloseDialog'), value: 'close-dialog' },
  { label: t('editor.columnsEditor.actionSwitchTab'), value: 'switch-tab' },
  { label: t('editor.columnsEditor.actionSetValue'), value: 'set-value' },
  { label: t('editor.columnsEditor.actionSubmit'), value: 'submit' },
  { label: t('editor.columnsEditor.actionReset'), value: 'reset' },
  { label: t('editor.columnsEditor.actionEmit'), value: 'emit' },
  { label: t('editor.columnsEditor.actionTriggerEvent'), value: 'trigger-event' },
  { label: t('editor.columnsEditor.actionSetVariable'), value: 'set-variable' },
  { label: t('editor.columnsEditor.actionCallApi'), value: 'api' },
  { label: t('editor.columnsEditor.actionNavigate'), value: 'navigate' },
  { label: t('editor.columnsEditor.actionPostMessage'), value: 'post-message' },
  { label: t('editor.columnsEditor.actionCopy'), value: 'copy' },
  { label: t('editor.columnsEditor.actionRefresh'), value: 'refresh' },
  { label: t('editor.columnsEditor.actionCloseTab'), value: 'close-tab' },
  { label: t('editor.columnsEditor.actionStartFlow'), value: 'startFlow' },
  { label: t('editor.columnsEditor.actionEndFlow'), value: 'endFlow' },
]

// ---- Column CRUD ----

function addColumn() {
  const col: AdvancedTableColumn = {
    prop: '',
    label: '',
    render: 'text',
    sortable: false,
    align: 'left',
    fixed: undefined,
  }
  emit('update:columns', [...props.columns, col])
}

function removeColumn(index: number) {
  emit('update:columns', props.columns.filter((_, i) => i !== index))
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.columns]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:columns', updated)
}

function moveDown(index: number) {
  if (index >= props.columns.length - 1) return
  const updated = [...props.columns]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:columns', updated)
}

function updateColumn<K extends keyof AdvancedTableColumn>(index: number, field: K, value: AdvancedTableColumn[K]) {
  const updated = props.columns.map((col, i) =>
    i === index ? { ...col, [field]: value } : col,
  )
  emit('update:columns', updated)
}

// ---- ColorMap helpers ----

function updateColorMap(index: number, text: string) {
  if (!text.trim()) {
    updateColumn(index, 'colorMap', undefined)
    return
  }
  try {
    updateColumn(index, 'colorMap', JSON.parse(text))
  } catch { /* keep until valid */ }
}

function colorMapToText(cm?: Record<string, string>): string {
  return cm ? JSON.stringify(cm, null, 2) : ''
}

// ---- Options helpers (for tag/badge) ----

function updateOptions(index: number, text: string) {
  if (!text.trim()) {
    updateColumn(index, 'options', undefined)
    return
  }
  try {
    updateColumn(index, 'options', JSON.parse(text))
  } catch { /* keep until valid */ }
}

function optionsToText(opts?: Array<{ label: string; value: unknown }>): string {
  return opts ? JSON.stringify(opts, null, 2) : ''
}

// ---- Filters helpers ----

function addFilter(colIndex: number) {
  const filters = [...(props.columns[colIndex].filters || [])]
  filters.push({ text: '', value: '' })
  updateColumn(colIndex, 'filters', filters)
}

function removeFilter(colIndex: number, filterIndex: number) {
  const filters = (props.columns[colIndex].filters || []).filter((_, i) => i !== filterIndex)
  updateColumn(colIndex, 'filters', filters.length ? filters : undefined)
}

function updateFilter(colIndex: number, filterIndex: number, field: 'text' | 'value', value: string) {
  const filters = (props.columns[colIndex].filters || []).map((f, i) =>
    i === filterIndex ? { ...f, [field]: value } : f,
  )
  updateColumn(colIndex, 'filters', filters)
}

// ---- Column API helpers ----

function updateColumnApi(index: number, patch: Partial<SchemaApiConfig>) {
  const current = props.columns[index]?.api
  if (current) {
    updateColumn(index, 'api', { ...current, ...patch })
  } else {
    updateColumn(index, 'api', { url: '', ...patch } as SchemaApiConfig)
  }
}

function removeColumnApi(index: number) {
  updateColumn(index, 'api', undefined)
}

const apiParamsCache: Record<number, string> = {}

function getApiParamsText(idx: number): string {
  if (idx in apiParamsCache) return apiParamsCache[idx]
  const p = props.columns[idx]?.api?.params
  return p ? JSON.stringify(p, null, 2) : ''
}

function handleApiParamsChange(idx: number, text: string) {
  apiParamsCache[idx] = text
  if (!text.trim()) {
    updateColumnApi(idx, { params: undefined })
    return
  }
  try {
    updateColumnApi(idx, { params: JSON.parse(text) })
  } catch { /* invalid JSON */ }
}

// ---- Buttons (row actions) ----

function addRowButton(colIndex: number) {
  const col = props.columns[colIndex]
  const buttons = [...(col.buttons || [])]
  buttons.push({
    key: `btn${buttons.length + 1}`,
    label: '按钮',
    type: 'primary',
    size: 'small',
  })
  updateColumn(colIndex, 'buttons', buttons)
}

function removeRowButton(colIndex: number, btnIndex: number) {
  const buttons = (props.columns[colIndex].buttons || []).filter((_, i) => i !== btnIndex)
  updateColumn(colIndex, 'buttons', buttons)
}

function updateRowButton(colIndex: number, btnIndex: number, field: keyof ActionButton, value: unknown) {
  const buttons = (props.columns[colIndex].buttons || []).map((btn, i) =>
    i === btnIndex ? { ...btn, [field]: value } : btn,
  )
  updateColumn(colIndex, 'buttons', buttons)
}

function updateRowButtonEvents(colIndex: number, btnIndex: number, events: ActionButton['events']) {
  updateRowButton(colIndex, btnIndex, 'events', events)
}

// ---- Expand state for button events ----

const expandedButtonEvents = ref<string>('')

function toggleButtonEvents(key: string) {
  expandedButtonEvents.value = expandedButtonEvents.value === key ? '' : key
}
</script>

<template>
  <div :class="styles['adv-columns-editor']">
    <div :class="styles['adv-columns-editor__preset-bar']">
      <span>{{ t('editor.columnsEditor.presetTitle') }}</span>
      <el-select v-model="selectedPresetId" :placeholder="t('editor.columnsEditor.selectPreset')" clearable size="small" style="width: 180px">
        <el-option
          v-for="preset in COLUMN_PRESETS"
          :key="preset.id"
          :label="preset.label"
          :value="preset.id"
        />
      </el-select>
      <el-button size="small" type="primary" :disabled="!selectedPresetId" @click="applyColumnPreset">
        {{ t('editor.columnsEditor.applyPreset') }}
      </el-button>
    </div>
    <div v-if="columns.length === 0" :class="styles['adv-columns-editor__empty']">
      {{ t('editor.columnsEditor.emptyHint') }}
    </div>

    <div
      v-for="(col, idx) in columns"
      :key="idx"
      :class="styles['adv-columns-editor__item']"
    >
      <!-- Header -->
      <div :class="styles['adv-columns-editor__item-header']">
        <span :class="styles['adv-columns-editor__item-title']">{{ t('editor.columnsEditor.columnTitle', { index: idx + 1 }) }}{{ col.label ? ` — ${col.label}` : '' }}</span>
        <div :class="styles['adv-columns-editor__item-actions']">
          <el-button size="small" text :disabled="idx === 0" @click="moveUp(idx)">
            <AppIcon name="arrow-up" />
          </el-button>
          <el-button size="small" text :disabled="idx === columns.length - 1" @click="moveDown(idx)">
            <AppIcon name="arrow-down" />
          </el-button>
          <el-button type="danger" size="small" text @click="removeColumn(idx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <!-- Basic fields -->
      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.fieldName') }}</label>
          <el-input :model-value="col.prop" size="small" placeholder="prop" @update:model-value="(v: string) => updateColumn(idx, 'prop', v)" />
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.label') }}</label>
          <el-input :model-value="col.label" size="small" placeholder="label" @update:model-value="(v: string) => updateColumn(idx, 'label', v)" />
        </div>
      </div>

      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.widthMode') }}</label>
          <el-switch
            :model-value="col.width === 'auto'"
            :active-text="t('editor.columnsEditor.widthAuto')"
            :inactive-text="t('editor.columnsEditor.widthFixed')"
            @update:model-value="(v: boolean) => updateColumn(idx, 'width', v ? 'auto' : undefined)"
          />
        </div>
        <div v-if="col.width !== 'auto'" :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.width') }}</label>
          <el-input :model-value="col.width ?? ''" size="small" placeholder="120" @update:model-value="(v: string) => updateColumn(idx, 'width', v ? Number(v) : undefined)" />
        </div>
      </div>

      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.minWidth') }}</label>
          <el-input :model-value="col.minWidth ?? ''" size="small" placeholder="80" @update:model-value="(v: string) => updateColumn(idx, 'minWidth', v ? Number(v) : undefined)" />
        </div>
      </div>

      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.renderMode') }}</label>
          <el-select :model-value="col.render ?? 'text'" size="small" style="width:100%" @update:model-value="(v: string) => updateColumn(idx, 'render', v)">
            <el-option v-for="opt in renderOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.align') }}</label>
          <el-select :model-value="col.align ?? 'left'" size="small" style="width:100%" @update:model-value="(v: string) => updateColumn(idx, 'align', v)">
            <el-option v-for="opt in alignOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
      </div>

      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.fixedColumn') }}</label>
          <el-select :model-value="col.fixed" size="small" style="width:100%" clearable @update:model-value="(v: string) => updateColumn(idx, 'fixed', v)">
            <el-option v-for="opt in fixedOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.sorting') }}</label>
          <el-switch :model-value="col.sortable ?? false" @update:model-value="(v: boolean) => updateColumn(idx, 'sortable', v)" />
        </div>
      </div>

      <!-- Tooltip -->
      <div :class="styles['adv-columns-editor__row']">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.overflowTooltip') }}</label>
          <el-switch :model-value="col.showTooltip ?? false" @update:model-value="(v: boolean) => updateColumn(idx, 'showTooltip', v)" />
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.tooltipField') }}</label>
          <el-input :model-value="col.tooltipField ?? ''" size="small" placeholder="tooltipField" @update:model-value="(v: string) => updateColumn(idx, 'tooltipField', v || undefined)" />
        </div>
      </div>

      <!-- Filterable -->
      <div :class="styles['adv-columns-editor__field']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.columnFilter') }}</label>
        <el-switch :model-value="col.filterable ?? false" @update:model-value="(v: boolean) => updateColumn(idx, 'filterable', v)" />
      </div>

      <div v-if="col.filterable" :class="styles['adv-columns-editor__filters-section']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.filterItems') }}</label>
        <div :class="styles['adv-columns-editor__empty-hint']">
          {{ t('editor.columnsEditor.filterAutoHint') }}
        </div>
        <div v-if="!col.filters?.length" :class="styles['adv-columns-editor__empty-hint']">{{ t('editor.columnsEditor.noCustomFilters') }}</div>
        <div
          v-for="(filter, fi) in col.filters"
          :key="fi"
          :class="styles['adv-columns-editor__filter-item']"
        >
          <div :class="styles['adv-columns-editor__row']">
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.filterDisplayText') }}</label>
              <el-input :model-value="filter.text" size="small" placeholder="审批中" @update:model-value="(v: string) => updateFilter(idx, fi, 'text', v)" />
            </div>
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.filterMatchValue') }}</label>
              <el-input :model-value="String(filter.value ?? '')" size="small" placeholder="submitted" @update:model-value="(v: string) => updateFilter(idx, fi, 'value', v)" />
            </div>
          </div>
          <el-button type="danger" size="small" text @click="removeFilter(idx, fi)">
            <AppIcon name="delete" /> {{ t('editor.columnsEditor.remove') }}
          </el-button>
        </div>
        <el-button type="primary" size="small" plain style="width:100%;margin-top:6px" @click="addFilter(idx)">
          <AppIcon name="plus" /> {{ t('editor.columnsEditor.addFilter') }}
        </el-button>
      </div>

      <!-- link render fields -->
      <div v-if="col.render === 'link'" :class="styles['adv-columns-editor__field']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.linkEventName') }}</label>
        <el-input :model-value="col.linkEvent ?? ''" size="small" placeholder="如: view" @update:model-value="(v: string) => updateColumn(idx, 'linkEvent', v || undefined)" />
      </div>

      <!-- tag/badge render fields -->
      <template v-if="col.render === 'tag' || col.render === 'badge'">
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.dictCode') }}</label>
          <el-input :model-value="col.dictCode ?? ''" size="small" placeholder="leave_type" @update:model-value="(v: string) => updateColumn(idx, 'dictCode', v || undefined)" />
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.colorMap') }}</label>
          <el-input :model-value="colorMapToText(col.colorMap)" :rows="2" type="textarea" placeholder='{"启用":"success","停用":"danger"}' @update:model-value="(v: string) => updateColorMap(idx, v)" />
        </div>
        <div :class="styles['adv-columns-editor__field']">
          <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.staticOptions') }}</label>
          <el-input :model-value="optionsToText(col.options)" :rows="2" type="textarea" placeholder='[{"label":"启用","value":"启用"}]' @update:model-value="(v: string) => updateOptions(idx, v)" />
        </div>
        <div :class="styles['adv-columns-editor__api-section']">
          <div :class="styles['adv-columns-editor__field']">
            <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.dynamicOptionsApi') }}</label>
            <el-input :model-value="col.api?.url ?? ''" size="small" placeholder="/api/options" @update:model-value="(v: string) => updateColumnApi(idx, { url: v || '' })" />
          </div>
          <template v-if="col.api?.url">
            <div :class="styles['adv-columns-editor__row']">
              <div :class="styles['adv-columns-editor__field']" style="flex:1">
                <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.method') }}</label>
                <el-select :model-value="col.api?.method ?? 'get'" size="small" style="width:100%" @update:model-value="(v: string) => updateColumnApi(idx, { method: v as 'get' | 'post' })">
                  <el-option label="GET" value="get" />
                  <el-option label="POST" value="post" />
                </el-select>
              </div>
              <div :class="styles['adv-columns-editor__field']" style="flex:1">
                <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.dataPath') }}</label>
                <el-input :model-value="col.api?.dataPath ?? ''" size="small" placeholder="data" @update:model-value="(v: string) => updateColumnApi(idx, { dataPath: v || undefined })" />
              </div>
            </div>
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.paramsJson') }}</label>
              <el-input :model-value="getApiParamsText(idx)" :rows="2" type="textarea" placeholder='{"key":"value"}' @update:model-value="(v: string) => handleApiParamsChange(idx, v)" />
            </div>
            <el-button size="small" type="danger" plain style="width:100%" @click="removeColumnApi(idx)">{{ t('editor.columnsEditor.removeApi') }}</el-button>
          </template>
        </div>
      </template>

      <!-- image render fields -->
      <div v-if="col.render === 'image'" :class="styles['adv-columns-editor__field']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.imageWidth') }}</label>
        <el-input-number :model-value="col.imageWidth ?? 40" :min="20" :max="400" size="small" style="width:100%" @update:model-value="(v: number) => updateColumn(idx, 'imageWidth', v)" />
      </div>

      <!-- custom render fields -->
      <div v-if="col.render === 'custom'" :class="styles['adv-columns-editor__field']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.renderFn') }}</label>
        <el-input :model-value="col.renderFn ?? ''" size="small" placeholder="renderFn" @update:model-value="(v: string) => updateColumn(idx, 'renderFn', v || undefined)" />
      </div>

      <!-- buttons render: row action buttons editor -->
      <div v-if="col.render === 'buttons'" :class="styles['adv-columns-editor__buttons-section']">
        <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.inlineButtons') }}</label>
        <div v-if="!col.buttons?.length" :class="styles['adv-columns-editor__empty-hint']">{{ t('editor.columnsEditor.noButtons') }}</div>
        <div
          v-for="(btn, bi) in col.buttons"
          :key="bi"
          :class="styles['adv-columns-editor__btn-item']"
        >
          <div :class="styles['adv-columns-editor__btn-header']">
            <span :class="styles['adv-columns-editor__btn-title']">{{ btn.label || btn.key }}</span>
            <el-button type="danger" size="small" text @click="removeRowButton(idx, bi)">
              <AppIcon name="delete" />
            </el-button>
          </div>
          <div :class="styles['adv-columns-editor__row']">
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">key</label>
              <el-input :model-value="btn.key" size="small" @update:model-value="(v: string) => updateRowButton(idx, bi, 'key', v)" />
            </div>
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.buttonText') }}</label>
              <el-input :model-value="btn.label" size="small" @update:model-value="(v: string) => updateRowButton(idx, bi, 'label', v)" />
            </div>
          </div>
          <div :class="styles['adv-columns-editor__row']">
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.type') }}</label>
              <el-select :model-value="btn.type || ''" size="small" style="width:100%" @update:model-value="(v: string) => updateRowButton(idx, bi, 'type', v)">
                <el-option v-for="opt in buttonTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div :class="styles['adv-columns-editor__field']">
              <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.confirmPrompt') }}</label>
              <el-input :model-value="btn.confirm ?? ''" size="small" placeholder="可选" @update:model-value="(v: string) => updateRowButton(idx, bi, 'confirm', v || undefined)" />
            </div>
          </div>
          <div :class="styles['adv-columns-editor__field']">
            <label :class="styles['adv-columns-editor__label']">{{ t('editor.columnsEditor.visibleCondition') }}</label>
            <el-input :model-value="btn.visibleCondition ?? ''" size="small" placeholder="如: row.status === 'draft'" @update:model-value="(v: string) => updateRowButton(idx, bi, 'visibleCondition', v || undefined)" />
          </div>

          <!-- Button events -->
          <div :class="styles['adv-columns-editor__btn-events-toggle']" @click="toggleButtonEvents(`${idx}-${bi}`)">
            <AppIcon :name="expandedButtonEvents === `${idx}-${bi}` ? 'arrow-down' : 'arrow-right'" />
            <span>{{ t('editor.columnsEditor.eventConfig') }} ({{ btn.events?.length || 0 }})</span>
          </div>
          <div v-if="expandedButtonEvents === `${idx}-${bi}`" :class="styles['adv-columns-editor__btn-events']">
            <ActionListEditor
              :actions="btn.events?.[0]?.actions ?? []"
              :action-types="actionTypeOptions"
              @update:actions="(actions) => {
                const events = actions.length ? [{ trigger: 'click', actions }] : []
                updateRowButtonEvents(idx, bi, events)
              }"
            />
          </div>
        </div>
        <el-button type="primary" size="small" plain style="width:100%;margin-top:6px" @click="addRowButton(idx)">
          <AppIcon name="plus" /> {{ t('editor.columnsEditor.addButton') }}
        </el-button>
      </div>
    </div>

    <el-button type="primary" size="small" plain style="width:100%;margin-top:8px" @click="addColumn">
      <AppIcon name="plus" /> {{ t('editor.columnsEditor.addColumn') }}
    </el-button>
  </div>
</template>
