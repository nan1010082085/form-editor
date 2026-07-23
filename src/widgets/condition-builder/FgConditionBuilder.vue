<script setup lang="ts">
/**
 * FgConditionBuilder — 条件构建器
 *
 * 可视化条件表达式编辑器，支持多条件组合（AND/OR）。
 * 替代手动写表达式，降低配置门槛。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useI18n } from '@schema-platform/platform-shared'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

interface Condition {
  _id: string
  field: string
  operator: string
  value: unknown
}

const fields = computed(() => (widgetData.value.props?.fields as Array<{ key: string; label: string }>) ?? [
  { key: 'name', label: t('editor.conditionBuilder.defaultFieldName') },
  { key: 'age', label: t('editor.conditionBuilder.defaultFieldAge') },
  { key: 'status', label: t('editor.conditionBuilder.defaultFieldStatus') },
])

const operators = computed(() => [
  { value: 'eq', label: t('editor.conditionBuilder.opEqual') },
  { value: 'ne', label: t('editor.conditionBuilder.opNotEqual') },
  { value: 'gt', label: t('editor.conditionBuilder.opGreater') },
  { value: 'lt', label: t('editor.conditionBuilder.opLess') },
  { value: 'gte', label: t('editor.conditionBuilder.opGreaterEqual') },
  { value: 'lte', label: t('editor.conditionBuilder.opLessEqual') },
  { value: 'contains', label: t('editor.conditionBuilder.opContains') },
  { value: 'not_contains', label: t('editor.conditionBuilder.opNotContains') },
  { value: 'in', label: t('editor.conditionBuilder.opIn') },
  { value: 'not_in', label: t('editor.conditionBuilder.opNotIn') },
  { value: 'is_empty', label: t('editor.conditionBuilder.opEmpty') },
  { value: 'is_not_empty', label: t('editor.conditionBuilder.opNotEmpty') },
])

const logic = ref<'and' | 'or'>('and')
const conditions = ref<Condition[]>([
  { _id: `c_${Date.now()}`, field: fields.value[0]?.key ?? '', operator: 'eq', value: '' },
])

function addCondition() {
  conditions.value.push({
    _id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    field: fields.value[0]?.key ?? '',
    operator: 'eq',
    value: '',
  })
}

function removeCondition(index: number) {
  if (conditions.value.length <= 1) return
  conditions.value.splice(index, 1)
}

function updateCondition(index: number, key: keyof Condition, value: unknown) {
  if (conditions.value[index]) {
    conditions.value[index] = { ...conditions.value[index], [key]: value }
  }
}

useExposeWidget(() => ({
  get conditions() { return conditions.value.map(({ _id, ...rest }) => rest) },
  get logic() { return logic.value },
  resetConditions() {
    conditions.value = [{ _id: `c_${Date.now()}`, field: fields.value[0]?.key ?? '', operator: 'eq', value: '' }]
    logic.value = 'and'
  },
}))
</script>

<template>
  <div :class="styles.conditionBuilder" :style="widgetStyle">
    <div :class="styles.logicRow">
      <el-radio-group v-model="logic" size="small">
        <el-radio-button value="and">{{ t('editor.conditionBuilder.logicAnd') }}</el-radio-button>
        <el-radio-button value="or">{{ t('editor.conditionBuilder.logicOr') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div :class="styles.conditions">
      <div v-for="(cond, index) in conditions" :key="cond._id" :class="styles.conditionRow">
        <el-select
          :model-value="cond.field"
          size="small"
          :placeholder="t('editor.conditionBuilder.selectField')"
          @update:model-value="updateCondition(index, 'field', $event)"
        >
          <el-option
            v-for="f in fields"
            :key="f.key"
            :label="f.label"
            :value="f.key"
          />
        </el-select>
        <el-select
          :model-value="cond.operator"
          size="small"
          :placeholder="t('editor.conditionBuilder.selectOperator')"
          @update:model-value="updateCondition(index, 'operator', $event)"
        >
          <el-option
            v-for="op in operators"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          />
        </el-select>
        <el-input
          v-if="!['is_empty', 'is_not_empty'].includes(cond.operator)"
          :model-value="String(cond.value ?? '')"
          size="small"
          :placeholder="t('editor.conditionBuilder.valuePlaceholder')"
          @update:model-value="updateCondition(index, 'value', $event)"
        />
        <button
          :class="styles.removeBtn"
          :disabled="conditions.length <= 1"
          :title="t('editor.conditionBuilder.deleteCondition')"
          @click="removeCondition(index)"
        >
          <AppIcon name="delete" :size="14" />
        </button>
      </div>
    </div>
    <button :class="styles.addBtn" @click="addCondition">
      <AppIcon name="plus" :size="14" />
      <span>{{ t('editor.conditionBuilder.addCondition') }}</span>
    </button>
  </div>
</template>
