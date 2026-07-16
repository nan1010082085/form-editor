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
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

interface Condition {
  _id: string
  field: string
  operator: string
  value: unknown
}

const fields = computed(() => (widgetData.value.props?.fields as Array<{ key: string; label: string }>) ?? [
  { key: 'name', label: '名称' },
  { key: 'age', label: '年龄' },
  { key: 'status', label: '状态' },
])

const operators = [
  { value: 'eq', label: '等于' },
  { value: 'ne', label: '不等于' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' },
  { value: 'in', label: '在...中' },
  { value: 'not_in', label: '不在...中' },
  { value: 'is_empty', label: '为空' },
  { value: 'is_not_empty', label: '不为空' },
]

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
        <el-radio-button value="and">并且 (AND)</el-radio-button>
        <el-radio-button value="or">或者 (OR)</el-radio-button>
      </el-radio-group>
    </div>
    <div :class="styles.conditions">
      <div v-for="(cond, index) in conditions" :key="cond._id" :class="styles.conditionRow">
        <el-select
          :model-value="cond.field"
          size="small"
          placeholder="选择字段"
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
          placeholder="运算符"
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
          placeholder="值"
          @update:model-value="updateCondition(index, 'value', $event)"
        />
        <button
          :class="styles.removeBtn"
          :disabled="conditions.length <= 1"
          title="删除条件"
          @click="removeCondition(index)"
        >
          <AppIcon name="delete" :size="14" />
        </button>
      </div>
    </div>
    <button :class="styles.addBtn" @click="addCondition">
      <AppIcon name="plus" :size="14" />
      <span>添加条件</span>
    </button>
  </div>
</template>
