<script setup lang="ts">
/**
 * ActionButtonsEditor -- 工具栏按钮编辑器
 *
 * 配置按钮列表，每个按钮可独立设置事件链（包含 API 调用、设置变量、路由跳转等 18 种动作）
 * 按钮支持 visibleCondition 控制显示时机（如 selectedRows.length > 0）
 */
import { ref, computed } from 'vue'
import type { ActionButton, ButtonEventConfig } from '@/widgets/advanced-table/config'
import type { SchemaEventAction } from '@/widgets/base/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import ActionListEditor from '@/components/Editor/ActionListEditor.vue'
import type { ActionTypeOption } from '@/components/Editor/ActionListEditor.vue'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './ActionButtonsEditor.module.scss'

const { t } = useI18n()

const props = defineProps<{
  buttons: ActionButton[]
}>()

const emit = defineEmits<{
  'update:buttons': [buttons: ActionButton[]]
}>()

const buttonTypeOptions = computed(() => [
  { label: t('editor.columnsEditor.buttonTypeDefault'), value: '' },
  { label: t('editor.columnsEditor.buttonTypePrimary'), value: 'primary' },
  { label: t('editor.columnsEditor.buttonTypeSuccess'), value: 'success' },
  { label: t('editor.columnsEditor.buttonTypeWarning'), value: 'warning' },
  { label: t('editor.columnsEditor.buttonTypeDanger'), value: 'danger' },
  { label: t('editor.columnsEditor.buttonTypeInfo'), value: 'info' },
  { label: t('editor.columnsEditor.buttonTypeText'), value: 'text' },
])

const actionTypeOptions = computed<ActionTypeOption[]>(() => [
  { label: t('editor.actionButtonsEditor.actionShow'), value: 'show' },
  { label: t('editor.actionButtonsEditor.actionHide'), value: 'hide' },
  { label: t('editor.actionButtonsEditor.actionOpenDialog'), value: 'open-dialog' },
  { label: t('editor.actionButtonsEditor.actionCloseDialog'), value: 'close-dialog' },
  { label: t('editor.actionButtonsEditor.actionSwitchTab'), value: 'switch-tab' },
  { label: t('editor.actionButtonsEditor.actionSetValue'), value: 'set-value' },
  { label: t('editor.actionButtonsEditor.actionSubmit'), value: 'submit' },
  { label: t('editor.actionButtonsEditor.actionReset'), value: 'reset' },
  { label: t('editor.actionButtonsEditor.actionEmit'), value: 'emit' },
  { label: t('editor.actionButtonsEditor.actionTriggerEvent'), value: 'trigger-event' },
  { label: t('editor.actionButtonsEditor.actionSetVariable'), value: 'set-variable' },
  { label: t('editor.actionButtonsEditor.actionCallApi'), value: 'api' },
  { label: t('editor.actionButtonsEditor.actionNavigate'), value: 'navigate' },
  { label: t('editor.actionButtonsEditor.actionPostMessage'), value: 'post-message' },
  { label: t('editor.actionButtonsEditor.actionCopy'), value: 'copy' },
  { label: t('editor.actionButtonsEditor.actionRefresh'), value: 'refresh' },
  { label: t('editor.actionButtonsEditor.actionCloseTab'), value: 'close-tab' },
  { label: t('editor.actionButtonsEditor.actionStartFlow'), value: 'startFlow' },
  { label: t('editor.actionButtonsEditor.actionEndFlow'), value: 'endFlow' },
])

// ---- CRUD ----

function addButton() {
  const btn: ActionButton = {
    key: `btn${props.buttons.length + 1}`,
    label: t('editor.actionButtonsEditor.defaultLabel'),
    type: 'default',
  }
  emit('update:buttons', [...props.buttons, btn])
}

function removeButton(index: number) {
  emit('update:buttons', props.buttons.filter((_, i) => i !== index))
}

function updateButton<K extends keyof ActionButton>(index: number, field: K, value: ActionButton[K]) {
  const updated = props.buttons.map((btn, i) =>
    i === index ? { ...btn, [field]: value } : btn,
  )
  emit('update:buttons', updated)
}

// ---- Events ----

function updateButtonEvents(index: number, actions: SchemaEventAction[]) {
  const events: ButtonEventConfig[] = actions.length
    ? [{ trigger: 'click', actions }]
    : []
  updateButton(index, 'events', events)
}

// ---- Expand state ----

const expandedEvents = ref<number>(-1)

function toggleEvents(index: number) {
  expandedEvents.value = expandedEvents.value === index ? -1 : index
}
</script>

<template>
  <div :class="styles['action-buttons-editor']">
    <div v-if="buttons.length === 0" :class="styles['action-buttons-editor__empty']">
      {{ t('editor.actionButtonsEditor.emptyHint') }}
    </div>

    <div
      v-for="(btn, idx) in buttons"
      :key="idx"
      :class="styles['action-buttons-editor__item']"
    >
      <!-- Header -->
      <div :class="styles['action-buttons-editor__item-header']">
        <span :class="styles['action-buttons-editor__item-title']">{{ btn.label || btn.key }}</span>
        <el-button type="danger" size="small" text @click="removeButton(idx)">
          <AppIcon name="delete" />
        </el-button>
      </div>

      <!-- Basic fields -->
      <div :class="styles['action-buttons-editor__row']">
        <div :class="styles['action-buttons-editor__field']">
          <label :class="styles['action-buttons-editor__label']">key</label>
          <el-input :model-value="btn.key" size="small" @update:model-value="(v: string) => updateButton(idx, 'key', v)" />
        </div>
        <div :class="styles['action-buttons-editor__field']">
          <label :class="styles['action-buttons-editor__label']">{{ t('editor.actionButtonsEditor.text') }}</label>
          <el-input :model-value="btn.label" size="small" @update:model-value="(v: string) => updateButton(idx, 'label', v)" />
        </div>
      </div>

      <div :class="styles['action-buttons-editor__row']">
        <div :class="styles['action-buttons-editor__field']">
          <label :class="styles['action-buttons-editor__label']">{{ t('editor.common.type') }}</label>
          <el-select :model-value="btn.type || ''" size="small" style="width:100%" @update:model-value="(v: string) => updateButton(idx, 'type', v)">
            <el-option v-for="opt in buttonTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div :class="styles['action-buttons-editor__field']">
          <label :class="styles['action-buttons-editor__label']">{{ t('editor.actionButtonsEditor.icon') }}</label>
          <el-input :model-value="btn.icon ?? ''" size="small" :placeholder="t('editor.actionButtonsEditor.iconPlaceholder')" @update:model-value="(v: string) => updateButton(idx, 'icon', v || undefined)" />
        </div>
      </div>

      <div :class="styles['action-buttons-editor__field']">
        <label :class="styles['action-buttons-editor__label']">{{ t('editor.actionButtonsEditor.visibleCondition') }}</label>
        <el-input
          :model-value="btn.visibleCondition ?? ''"
          size="small"
          :placeholder="t('editor.actionButtonsEditor.visibleConditionPlaceholder')"
          @update:model-value="(v: string) => updateButton(idx, 'visibleCondition', v || undefined)"
        />
      </div>

      <div :class="styles['action-buttons-editor__field']">
        <label :class="styles['action-buttons-editor__label']">{{ t('editor.actionButtonsEditor.confirmPrompt') }}</label>
        <el-input
          :model-value="btn.confirm ?? ''"
          size="small"
          :placeholder="t('editor.actionButtonsEditor.confirmPlaceholder')"
          @update:model-value="(v: string) => updateButton(idx, 'confirm', v || undefined)"
        />
      </div>

      <!-- Events toggle -->
      <div :class="styles['action-buttons-editor__events-toggle']" @click="toggleEvents(idx)">
        <AppIcon :name="expandedEvents === idx ? 'arrow-down' : 'arrow-right'" />
        <span>{{ t('editor.actionButtonsEditor.eventsConfig', { count: btn.events?.length || 0 }) }}</span>
      </div>

      <!-- Events editor -->
      <div v-if="expandedEvents === idx" :class="styles['action-buttons-editor__events']">
        <div v-if="!btn.events?.length" :class="styles['action-buttons-editor__events-hint']">
          {{ t('editor.actionButtonsEditor.noEventsHint') }}
        </div>
        <ActionListEditor
          :actions="btn.events?.[0]?.actions ?? []"
          :action-types="actionTypeOptions"
          @update:actions="(actions) => updateButtonEvents(idx, actions)"
        />
      </div>
    </div>

    <el-button type="primary" size="small" plain style="width:100%;margin-top:8px" @click="addButton">
      <AppIcon name="plus" /> {{ t('editor.actionButtonsEditor.addButtonText') }}
    </el-button>
  </div>
</template>

