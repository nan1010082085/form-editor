<script setup lang="ts">
/**
 * ButtonEditor -- Structured CRUD editor for SchemaButtonConfig[].
 *
 * Sprint 18: Replaces JSON textarea with per-action structured form.
 * Each action type shows conditional fields for its specific properties.
 */
import { computed } from 'vue'
import type { SchemaButtonConfig, SchemaAction, ActionType } from '@/components/WidgetRenderer/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './ButtonEditor.module.scss'

const { t } = useI18n()

const props = defineProps<{
  buttons: SchemaButtonConfig[]
}>()

const emit = defineEmits<{
  'update:buttons': [buttons: SchemaButtonConfig[]]
}>()

const buttonTypeOptions = computed(() => [
  { label: t('editor.columnsEditor.buttonTypeDefault'), value: '' as const },
  { label: t('editor.columnsEditor.buttonTypePrimary'), value: 'primary' as const },
  { label: t('editor.columnsEditor.buttonTypeSuccess'), value: 'success' as const },
  { label: t('editor.columnsEditor.buttonTypeWarning'), value: 'warning' as const },
  { label: t('editor.columnsEditor.buttonTypeDanger'), value: 'danger' as const },
  { label: t('editor.columnsEditor.buttonTypeInfo'), value: 'info' as const },
])

const actionTypeOptions = computed<{ label: string; value: ActionType }[]>(() => [
  { label: t('editor.buttonEditor.actionEmit'), value: 'emit' },
  { label: t('editor.buttonEditor.actionDialog'), value: 'dialog' },
  { label: t('editor.buttonEditor.actionApi'), value: 'api' },
  { label: t('editor.buttonEditor.actionNavigate'), value: 'navigate' },
  { label: t('editor.buttonEditor.actionSubmit'), value: 'submit' },
  { label: t('editor.buttonEditor.actionReset'), value: 'reset' },
  { label: t('editor.buttonEditor.actionUpload'), value: 'upload' },
  { label: t('editor.buttonEditor.actionValidate'), value: 'validate' },
])

const apiMethodOptions = [
  { label: 'GET', value: 'get' as const },
  { label: 'POST', value: 'post' as const },
]

// ---- Button CRUD ----

function addButton() {
  emit('update:buttons', [...props.buttons, { text: '', buttonType: '' as SchemaButtonConfig['buttonType'] }])
}

function removeButton(index: number) {
  emit('update:buttons', props.buttons.filter((_, i) => i !== index))
}

function moveUp(index: number) {
  if (index === 0) return
  const updated = [...props.buttons]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  emit('update:buttons', updated)
}

function moveDown(index: number) {
  if (index >= props.buttons.length - 1) return
  const updated = [...props.buttons]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  emit('update:buttons', updated)
}

function updateButton<K extends keyof SchemaButtonConfig>(index: number, field: K, value: SchemaButtonConfig[K]) {
  const updated = props.buttons.map((b, i) => i === index ? { ...b, [field]: value } : b)
  emit('update:buttons', updated)
}

// ---- Action CRUD within a button ----

function addAction(btnIdx: number) {
  const btn = props.buttons[btnIdx]
  const action: SchemaAction = { type: 'emit' as ActionType }
  const actions = [...(btn.actions ?? []), action]
  updateButton(btnIdx, 'actions', actions)
}

function removeAction(btnIdx: number, actionIdx: number) {
  const btn = props.buttons[btnIdx]
  const actions = (btn.actions ?? []).filter((_, i) => i !== actionIdx)
  updateButton(btnIdx, 'actions', actions.length ? actions : undefined)
}

function updateAction(btnIdx: number, actionIdx: number, patch: Partial<SchemaAction>) {
  const btn = props.buttons[btnIdx]
  const actions = (btn.actions ?? []).map((a, i) => i === actionIdx ? { ...a, ...patch } : a)
  updateButton(btnIdx, 'actions', actions)
}

function moveActionUp(btnIdx: number, actionIdx: number) {
  if (actionIdx === 0) return
  const btn = props.buttons[btnIdx]
  const actions = [...(btn.actions ?? [])]
  ;[actions[actionIdx - 1], actions[actionIdx]] = [actions[actionIdx], actions[actionIdx - 1]]
  updateButton(btnIdx, 'actions', actions)
}

function moveActionDown(btnIdx: number, actionIdx: number) {
  const btn = props.buttons[btnIdx]
  const actions = btn.actions ?? []
  if (actionIdx >= actions.length - 1) return
  const updated = [...actions]
  ;[updated[actionIdx], updated[actionIdx + 1]] = [updated[actionIdx + 1], updated[actionIdx]]
  updateButton(btnIdx, 'actions', updated)
}

// ---- JSON helpers for nested fields ----

function parseJson(text: string): unknown | undefined {
  if (!text.trim()) return undefined
  try { return JSON.parse(text) } catch { return undefined }
}

function jsonText(val: unknown): string {
  if (!val) return ''
  return JSON.stringify(val, null, 2)
}

// State cache for textarea buffers
const eventPayloadCache: Record<string, string> = {}
const dialogSchemaCache: Record<string, string> = {}
const apiParamsCache: Record<string, string> = {}
const navigateQueryCache: Record<string, string> = {}
function cacheKey(btnIdx: number, actionIdx: number, field: string) { return `${btnIdx}:${actionIdx}:${field}` }
</script>

<template>
  <div :class="styles['button-editor']">
    <div v-if="buttons.length === 0" :class="styles['button-editor__empty']">{{ t('editor.buttonEditor.emptyHint') }}</div>

    <div v-for="(btn, btnIdx) in buttons" :key="btnIdx" :class="styles['button-editor__item']">
      <div :class="styles['button-editor__item-header']">
        <span :class="styles['button-editor__item-title']">{{ t('editor.buttonEditor.buttonTitle', { index: btnIdx + 1 }) }}</span>
        <div :class="styles['button-editor__item-actions']">
          <el-button size="small" text :disabled="btnIdx === 0" @click="moveUp(btnIdx)">
            <AppIcon name="arrow-up" />
          </el-button>
          <el-button size="small" text :disabled="btnIdx === buttons.length - 1" @click="moveDown(btnIdx)">
            <AppIcon name="arrow-down" />
          </el-button>
          <el-button type="danger" size="small" text @click="removeButton(btnIdx)">
            <AppIcon name="delete" />
          </el-button>
        </div>
      </div>

      <div :class="styles['button-editor__field']">
        <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.text') }}</label>
        <el-input :model-value="btn.text" size="small" :placeholder="t('editor.buttonEditor.buttonTextPlaceholder')" @update:model-value="(v: string) => updateButton(btnIdx, 'text', v)" />
      </div>

      <div :class="styles['button-editor__field']">
        <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.buttonType') }}</label>
        <el-select :model-value="btn.buttonType ?? ''" size="small" style="width: 100%" @update:model-value="(v: string) => updateButton(btnIdx, 'buttonType', v)">
          <el-option v-for="opt in buttonTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>

      <!-- Actions list -->
      <div :class="styles['button-editor__actions-section']">
        <div :class="styles['button-editor__actions-header']">
          <span :class="styles['button-editor__label']">{{ t('editor.buttonEditor.actions') }}</span>
          <el-button size="small" text @click="addAction(btnIdx)">
            <AppIcon name="plus" />
            {{ t('editor.buttonEditor.addAction') }}
          </el-button>
        </div>

        <div v-if="!btn.actions?.length" :class="styles['button-editor__help']" style="margin-bottom:4px">{{ t('editor.buttonEditor.noActionsHint') }}</div>

        <div v-for="(action, aIdx) in (btn.actions ?? [])" :key="aIdx" :class="styles['button-editor__action-item']">
          <div :class="styles['button-editor__action-header']">
            <span :class="styles['button-editor__action-title']">{{ t('editor.buttonEditor.actionTitle', { index: aIdx + 1 }) }}</span>
            <div style="display:flex;gap:2px">
              <el-button :disabled="aIdx === 0" size="small" text @click="moveActionUp(btnIdx, aIdx)">
                <AppIcon name="arrow-up" />
              </el-button>
              <el-button :disabled="aIdx === (btn.actions?.length ?? 1) - 1" size="small" text @click="moveActionDown(btnIdx, aIdx)">
                <AppIcon name="arrow-down" />
              </el-button>
              <el-button type="danger" size="small" text @click="removeAction(btnIdx, aIdx)">
                <AppIcon name="delete" />
              </el-button>
            </div>
          </div>

          <!-- Type -->
          <div :class="styles['button-editor__field']">
            <label :class="styles['button-editor__label']">{{ t('editor.common.type') }}</label>
            <el-select :model-value="action.type" size="small" style="width:100%" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { type: v as ActionType })">
              <el-option v-for="opt in actionTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>

          <!-- Common: Label -->
          <div :class="styles['button-editor__field']">
            <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.label') }}</label>
            <el-input :model-value="action.label ?? ''" size="small" :placeholder="t('editor.buttonEditor.labelPlaceholder')" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { label: v || undefined })" />
          </div>

          <!-- Common: Confirm -->
          <div :class="styles['button-editor__field']">
            <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.confirmPrompt') }}</label>
            <el-input :model-value="action.confirm ?? ''" size="small" :placeholder="t('editor.buttonEditor.confirmPlaceholder')" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { confirm: v || undefined })" />
          </div>

          <!-- emit: eventName + eventPayload -->
          <template v-if="action.type === 'emit'">
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.eventName') }}</label>
              <el-input :model-value="action.eventName ?? ''" size="small" :placeholder="t('editor.buttonEditor.eventNamePlaceholder')" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { eventName: v || undefined })" />
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.eventPayload') }}</label>
              <el-input
                type="textarea"
                :model-value="eventPayloadCache[cacheKey(btnIdx, aIdx, 'payload')] ?? jsonText(action.eventPayload)"
                :rows="2" placeholder='{"key":"value"}'
                @update:model-value="(v: string) => { eventPayloadCache[cacheKey(btnIdx, aIdx, 'payload')] = v; updateAction(btnIdx, aIdx, { eventPayload: parseJson(v) as SchemaAction['eventPayload'] }) }"
              />
            </div>
          </template>

          <!-- dialog: dialogTitle + dialogWidth + dialogSchema -->
          <template v-if="action.type === 'dialog'">
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.dialogTitle') }}</label>
              <el-input :model-value="action.dialogTitle ?? ''" size="small" :placeholder="t('editor.buttonEditor.dialogTitlePlaceholder')" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { dialogTitle: v || undefined })" />
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.dialogWidth') }}</label>
              <el-input :model-value="action.dialogWidth ?? ''" size="small" placeholder="600px" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { dialogWidth: v || undefined })" />
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.dialogSchema') }}</label>
              <el-input
                type="textarea"
                :model-value="dialogSchemaCache[cacheKey(btnIdx, aIdx, 'schema')] ?? jsonText(action.dialogSchema)"
                :rows="4" placeholder='[{"type":"input","field":"name","label":"Name"}]'
                @update:model-value="(v: string) => { dialogSchemaCache[cacheKey(btnIdx, aIdx, 'schema')] = v; updateAction(btnIdx, aIdx, { dialogSchema: parseJson(v) as SchemaAction['dialogSchema'] }) }"
              />
            </div>
          </template>

          <!-- api: apiUrl + apiMethod + apiParams -->
          <template v-if="action.type === 'api'">
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.apiUrl') }}</label>
              <el-input :model-value="action.apiUrl ?? ''" size="small" placeholder="/api/endpoint" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { apiUrl: v || undefined })" />
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.apiMethod') }}</label>
              <el-select :model-value="action.apiMethod ?? 'post'" size="small" style="width:100%" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { apiMethod: v as 'get' | 'post' })">
                <el-option v-for="opt in apiMethodOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.apiParams') }}</label>
              <el-input
                type="textarea"
                :model-value="apiParamsCache[cacheKey(btnIdx, aIdx, 'params')] ?? (typeof action.apiParams === 'string' ? action.apiParams : jsonText(action.apiParams))"
                :rows="2" :placeholder="t('editor.buttonEditor.apiParamsPlaceholder')"
                @update:model-value="(v: string) => { apiParamsCache[cacheKey(btnIdx, aIdx, 'params')] = v; updateAction(btnIdx, aIdx, { apiParams: v === 'formData' ? 'formData' : (parseJson(v) as Record<string, unknown> | undefined) }) }"
              />
            </div>
          </template>

          <!-- navigate: navigatePath + navigateQuery -->
          <template v-if="action.type === 'navigate'">
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.navigatePath') }}</label>
              <el-input :model-value="action.navigatePath ?? ''" size="small" placeholder="/detail/:id" @update:model-value="(v: string) => updateAction(btnIdx, aIdx, { navigatePath: v || undefined })" />
            </div>
            <div :class="styles['button-editor__field']">
              <label :class="styles['button-editor__label']">{{ t('editor.buttonEditor.navigateQuery') }}</label>
              <el-input
                type="textarea"
                :model-value="navigateQueryCache[cacheKey(btnIdx, aIdx, 'query')] ?? jsonText(action.navigateQuery)"
                :rows="2" placeholder='{"from":"list"}'
                @update:model-value="(v: string) => { navigateQueryCache[cacheKey(btnIdx, aIdx, 'query')] = v; updateAction(btnIdx, aIdx, { navigateQuery: parseJson(v) as Record<string, string> | undefined }) }"
              />
            </div>
          </template>

          <!-- submit/reset/upload/validate: no extra fields beyond label+confirm -->
        </div>
      </div>
    </div>

    <el-button type="primary" size="small" plain style="width:100%;margin-top:8px" @click="addButton">
      <AppIcon name="plus" />
      {{ t('editor.buttonEditor.addButtonText') }}
    </el-button>
  </div>
</template>
