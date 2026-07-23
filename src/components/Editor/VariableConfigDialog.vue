<script setup lang="ts">
/**
 * VariableConfigDialog — 变量配置对话框
 *
 * 支持配置 WidgetVariable[] 或 BoardVariable[]。
 * 每个变量包含：name, type, defaultValue, description。
 */
import { ref, watch, computed } from 'vue'
import type { WidgetVariable } from '../../widgets/base/types'
import AppDialog from '@schema-platform/platform-shared/components/common/AppDialog.vue'
import styles from './VariableConfigDialog.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  variables: WidgetVariable[]
  title?: string
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  save: [variables: WidgetVariable[]]
}>()

// ---- 本地编辑副本 ----

const localVariables = ref<WidgetVariable[]>([])

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localVariables.value = JSON.parse(JSON.stringify(props.variables ?? []))
    }
  },
)

// ---- 类型选项 ----

const typeOptions = computed(() => [
  { label: t('editor.variableConfig.typeString'), value: 'string' },
  { label: t('editor.variableConfig.typeNumber'), value: 'number' },
  { label: t('editor.variableConfig.typeBoolean'), value: 'boolean' },
  { label: t('editor.variableConfig.typeObject'), value: 'object' },
  { label: t('editor.variableConfig.typeArray'), value: 'array' },
])

// ---- CRUD ----

function addVariable() {
  localVariables.value.push({
    name: '',
    type: 'string',
    defaultValue: '',
    description: '',
  })
}

function removeVariable(index: number) {
  localVariables.value.splice(index, 1)
}

// ---- JSON 输入处理 ----

function handleJsonInput(v: WidgetVariable, val: string) {
  try {
    v.defaultValue = JSON.parse(val)
  } catch {
    v.defaultValue = val
  }
}

// ---- 名称校验 ----

const nameError = computed(() => {
  const names = localVariables.value.map(v => v.name).filter(Boolean)
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i)
  if (duplicates.length) return t('editor.variableConfig.nameDuplicate', { name: duplicates[0] })
  const invalid = localVariables.value.find(v => v.name && !/^[a-zA-Z_]\w*$/.test(v.name))
  if (invalid) return t('editor.variableConfig.nameInvalid', { name: invalid.name })
  return ''
})

// ---- 保存 / 关闭 ----

function handleSave() {
  if (nameError.value) return
  // 过滤掉空名称的变量
  const valid = localVariables.value.filter(v => v.name.trim())
  emit('save', valid)
  emit('update:visible', false)
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="title || t('editor.variableConfig.title')"
    width="600px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div :class="styles.body">
      <!-- 空状态 -->
      <div v-if="localVariables.length === 0" :class="styles.empty">
        {{ t('editor.variableConfig.emptyHint') }}
      </div>

      <!-- 变量列表 -->
      <div
        v-for="(v, i) in localVariables"
        :key="i"
        :class="styles.card"
      >
        <div :class="styles.cardHeader">
          <span :class="styles.cardTitle">{{ t('editor.variableConfig.variableTitle', { index: i + 1 }) }}</span>
          <el-button
            type="danger"
            link
            size="small"
            @click="removeVariable(i)"
          >
            <AppIcon name="delete"  />
          </el-button>
        </div>

        <div :class="styles.row">
          <label :class="styles.label">{{ t('editor.variableConfig.name') }}</label>
          <el-input
            v-model="v.name"
            :placeholder="t('editor.variableConfig.namePlaceholder')"
            style="flex: 1"
          />
        </div>

        <div :class="styles.row">
          <label :class="styles.label">{{ t('editor.variableConfig.type') }}</label>
          <el-select
            v-model="v.type"
            style="width: 120px"
            @change="v.defaultValue = $event === 'boolean' ? false : $event === 'number' ? 0 : $event === 'object' ? {} : $event === 'array' ? [] : ''"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <label :class="styles.label" style="margin-left: 8px">{{ t('editor.variableConfig.defaultValue') }}</label>
          <el-switch
            v-if="v.type === 'boolean'"
            v-model="v.defaultValue"
          />
          <el-input-number
            v-else-if="v.type === 'number'"
            v-model="v.defaultValue as number"
            controls-position="right"
          />
          <el-input
            v-else-if="v.type === 'string'"
            v-model="v.defaultValue as string"
            :placeholder="t('editor.variableConfig.defaultValuePlaceholder')"
            style="flex: 1"
          />
          <el-input
            v-else
            type="textarea"
            :model-value="typeof v.defaultValue === 'object' ? JSON.stringify(v.defaultValue) : (v.defaultValue as string) ?? ''"
            :rows="2"
            :placeholder="v.type === 'object' ? '{&quot;key&quot;: &quot;value&quot;}' : '[&quot;item1&quot;, &quot;item2&quot;]'"
            style="flex: 1"
            @input="handleJsonInput(v, $event)"
          />
        </div>

        <div :class="styles.row">
          <label :class="styles.label">{{ t('editor.variableConfig.description') }}</label>
          <el-input
            v-model="v.description"
            :placeholder="t('editor.variableConfig.descriptionPlaceholder')"
            style="flex: 1"
          />
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="nameError" :class="styles.error">{{ nameError }}</div>

      <!-- 添加变量 -->
      <el-button
        type="primary"
        plain
        style="width: 100%"
        @click="addVariable"
      >
        <AppIcon name="plus"  />
        {{ t('editor.variableConfig.addVariable') }}
      </el-button>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('editor.common.cancel') }}</el-button>
      <el-button type="primary" :disabled="!!nameError" @click="handleSave">{{ t('editor.common.save') }}</el-button>
    </template>
  </AppDialog>
</template>
