<script setup lang="ts">
/** E-20 — Adhoc 查询构建器 */
import { inject, computed, ref, reactive } from 'vue'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import type { AdhocQueryField, AdhocCondition } from './config'
import { buildAdhocFilterParams, emptyAdhocCondition } from './adhocQueryUtils'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const eventCtx = inject(EVENT_CONTEXT_KEY, null)

const fields = computed<AdhocQueryField[]>(() =>
  (widgetData.value.props?.fields as AdhocQueryField[]) ?? [],
)

const targetTableId = computed(() =>
  String(widgetData.value.props?.targetTableId ?? ''),
)

const conditions = ref<AdhocCondition[]>([emptyAdhocCondition()])
const lastParams = reactive<Record<string, unknown>>({})

useExposeWidget(() => ({
  get lastParams() { return { ...lastParams } },
  reset: () => resetQuery(),
}))

function pushCondition() {
  conditions.value.push(emptyAdhocCondition())
}

function removeCondition(index: number) {
  if (conditions.value.length <= 1) {
    conditions.value[0] = emptyAdhocCondition()
    return
  }
  conditions.value.splice(index, 1)
}

function fieldMeta(fieldKey: string): AdhocQueryField | undefined {
  return fields.value.find((f) => f.field === fieldKey)
}

function applyToTarget(params: Record<string, unknown>) {
  const tableId = targetTableId.value
  if (!tableId || !eventCtx) return
  const setter = eventCtx.exposed?.[tableId]?.['set-search-params']
  if (typeof setter === 'function') {
    ;(setter as (p: Record<string, unknown>) => void)(params)
    return
  }
  eventCtx.triggerEvent?.(tableId, 'refresh')
}

function applyQuery() {
  const params = buildAdhocFilterParams(conditions.value)
  Object.assign(lastParams, params)
  applyToTarget(params)
}

function resetQuery() {
  conditions.value = [emptyAdhocCondition()]
  Object.keys(lastParams).forEach((k) => delete lastParams[k])
  applyToTarget({})
}
</script>

<template>
  <div :class="styles.container">
    <div
      v-for="(row, index) in conditions"
      :key="index"
      :class="styles.row"
    >
      <el-select
        v-model="row.field"
        :class="styles.fieldSelect"
        placeholder="字段"
        clearable
      >
        <el-option
          v-for="f in fields"
          :key="f.field"
          :label="f.label"
          :value="f.field"
        />
      </el-select>
      <el-select v-model="row.operator" :class="styles.operatorSelect">
        <el-option label="等于" value="eq" />
        <el-option label="包含" value="contains" />
      </el-select>
      <el-select
        v-if="fieldMeta(row.field)?.type === 'select'"
        v-model="row.value"
        :class="styles.valueInput"
        placeholder="值"
        clearable
      >
        <el-option
          v-for="opt in fieldMeta(row.field)?.options ?? []"
          :key="String(opt.value)"
          :label="opt.label"
          :value="String(opt.value)"
        />
      </el-select>
      <el-input
        v-else
        v-model="row.value"
        :class="styles.valueInput"
        placeholder="值"
        clearable
        @keyup.enter="applyQuery"
      />
      <el-button text type="danger" @click="removeCondition(index)">
        删除
      </el-button>
    </div>
    <div :class="styles.actions">
      <el-button @click="pushCondition">添加条件</el-button>
      <el-button type="primary" @click="applyQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>
  </div>
</template>
