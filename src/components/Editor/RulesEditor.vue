<script setup lang="ts">
/**
 * RulesEditor -- Visual editor for Element Plus FormItemRule[].
 *
 * Sprint 18: Replaces "configured in JSON view" with structured form.
 * Each rule row: required switch -> type -> min/max -> pattern -> message -> trigger.
 */
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './RulesEditor.module.scss'

const { t } = useI18n()

interface FormRule {
  required?: boolean
  type?: string
  min?: number
  max?: number
  pattern?: string | RegExp
  message?: string
  trigger?: string
}

const props = defineProps<{
  rules: FormRule[] | undefined
}>()

const emit = defineEmits<{
  'update:rules': [rules: FormRule[] | undefined]
}>()

const ruleTypeOptions = [
  { label: t('editor.rulesEditor.typeString'), value: 'string' },
  { label: t('editor.rulesEditor.typeNumber'), value: 'number' },
  { label: t('editor.rulesEditor.typeBoolean'), value: 'boolean' },
  { label: t('editor.rulesEditor.typeDate'), value: 'date' },
  { label: t('editor.rulesEditor.typeArray'), value: 'array' },
  { label: t('editor.rulesEditor.typeObject'), value: 'object' },
  { label: t('editor.rulesEditor.typeEmail'), value: 'email' },
  { label: t('editor.rulesEditor.typeUrl'), value: 'url' },
  { label: t('editor.rulesEditor.typeInteger'), value: 'integer' },
  { label: t('editor.rulesEditor.typeFloat'), value: 'float' },
]

const triggerOptions = [
  { label: t('editor.rulesEditor.triggerBlur'), value: 'blur' },
  { label: t('editor.rulesEditor.triggerChange'), value: 'change' },
  { label: t('editor.rulesEditor.triggerBoth'), value: 'blur,change' },
]

function addRule() {
  const newRule: FormRule = { required: true, message: '', trigger: 'blur' }
  emit('update:rules', [...(props.rules ?? []), newRule])
}

function removeRule(index: number) {
  const updated = (props.rules ?? []).filter((_, i) => i !== index)
  emit('update:rules', updated.length ? updated : undefined)
}

function updateRule(index: number, patch: Partial<FormRule>) {
  const updated = (props.rules ?? []).map((r, i) => i === index ? { ...r, ...patch } : r)
  emit('update:rules', updated)
}

function setRequired(index: number, val: boolean) {
  if (val) {
    updateRule(index, { required: true })
  } else {
    const { required: _, ...rest } = props.rules![index]
    emit('update:rules', (props.rules ?? []).map((r, i) => i === index ? rest : r))
  }
}
</script>

<template>
  <div :class="styles['rules-editor']">
    <div v-if="!rules?.length" :class="styles['rules-editor__empty']">{{ t('editor.rulesEditor.emptyHint') }}</div>

    <div v-for="(rule, idx) in (rules ?? [])" :key="idx" :class="styles['rules-editor__item']">
      <div :class="styles['rules-editor__item-header']">
        <span :class="styles['rules-editor__item-title']">{{ t('editor.rulesEditor.ruleTitle', { index: idx + 1 }) }}</span>
        <el-button type="danger" size="small" text @click="removeRule(idx)">
          <AppIcon name="delete" />
        </el-button>
      </div>

      <!-- Required -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.required') }}</label>
        <el-switch :model-value="rule.required === true" @update:model-value="setRequired(idx, $event)" />
      </div>

      <!-- Type -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.type') }}</label>
        <el-select
          :model-value="rule.type ?? ''"
          size="small"
          style="width:100%"
          clearable
          @update:model-value="updateRule(idx, { type: $event || undefined })"
        >
          <el-option v-for="opt in ruleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>

      <!-- Min -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.minValue') }}</label>
        <el-input-number
          :model-value="rule.min as number ?? undefined"
          size="small"
          style="width:100%"
          :min="0"
          controls-position="right"
          @update:model-value="updateRule(idx, { min: $event ?? undefined })"
        />
      </div>

      <!-- Max -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.maxValue') }}</label>
        <el-input-number
          :model-value="rule.max as number ?? undefined"
          size="small"
          style="width:100%"
          :min="0"
          controls-position="right"
          @update:model-value="updateRule(idx, { max: $event ?? undefined })"
        />
      </div>

      <!-- Pattern -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.regex') }}</label>
        <el-input
          :model-value="rule.pattern ? String(rule.pattern) : ''"
          size="small"
          placeholder="^[a-zA-Z]+$"
          @update:model-value="updateRule(idx, { pattern: $event || undefined })"
        />
      </div>

      <!-- Message -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.errorMessage') }}</label>
        <el-input
          :model-value="rule.message ?? ''"
          size="small"
          :placeholder="t('editor.rulesEditor.errorMessagePlaceholder')"
          @update:model-value="updateRule(idx, { message: $event || undefined })"
        />
      </div>

      <!-- Trigger -->
      <div :class="styles['rules-editor__field']">
        <label :class="styles['rules-editor__label']">{{ t('editor.rulesEditor.triggerMode') }}</label>
        <el-select
          :model-value="rule.trigger ?? 'blur'"
          size="small"
          style="width:100%"
          @update:model-value="updateRule(idx, { trigger: $event as string })"
        >
          <el-option v-for="opt in triggerOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
    </div>

    <el-button type="primary" size="small" plain style="width:100%;margin-top:8px" @click="addRule">
      <AppIcon name="plus" />
      {{ t('editor.rulesEditor.addRule') }}
    </el-button>
  </div>
</template>

