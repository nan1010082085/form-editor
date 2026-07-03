<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import type { FormFieldValue, SearchFieldSchema } from '@/components/WidgetRenderer/types'
import { buildSearchParams, initSearchFormValues } from '@/utils/searchFormUtils'
import SearchFormField from './SearchFormField.vue'
import styles from './style.module.scss'

const props = withDefaults(defineProps<{
  fields: SearchFieldSchema[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  defaultVisibleCount?: number
}>(), {
  collapsible: true,
  defaultCollapsed: false,
  defaultVisibleCount: 3,
})

const emit = defineEmits<{
  search: [params: Record<string, unknown>]
  reset: []
}>()

const collapsed = ref(props.defaultCollapsed)
const searchForm = reactive<Record<string, FormFieldValue>>({})

watch(
  () => props.fields,
  (fields) => {
    const next = initSearchFormValues(fields)
    for (const key of Object.keys(searchForm)) {
      if (!(key in next)) delete searchForm[key]
    }
    Object.assign(searchForm, next)
  },
  { immediate: true, deep: true },
)

const canCollapse = computed(() =>
  props.collapsible && props.fields.length > props.defaultVisibleCount,
)

const visibleFields = computed(() => {
  if (!canCollapse.value || !collapsed.value) return props.fields
  return props.fields.slice(0, props.defaultVisibleCount)
})

function handleSearch() {
  emit('search', buildSearchParams(props.fields, searchForm))
}

function handleReset() {
  Object.assign(searchForm, initSearchFormValues(props.fields))
  emit('reset')
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

defineExpose({
  getValues: () => buildSearchParams(props.fields, searchForm),
  reset: handleReset,
})
</script>

<template>
  <div :class="styles.searchForm">
    <el-row :gutter="16" :class="styles.searchRow">
      <el-col
        v-for="field in visibleFields"
        :key="field.field"
        :span="field.span ?? 8"
        :class="styles.searchField"
      >
        <label
          v-if="field.type !== 'checkbox'"
          :class="styles.searchLabel"
        >
          {{ field.label ?? field.field }}
        </label>
        <SearchFormField
          :field="field"
          :model-value="searchForm[field.field]"
          @update:model-value="(v) => (searchForm[field.field] = v)"
        />
      </el-col>
      <el-col :span="8" :class="styles.searchField">
        <div :class="styles.searchActions">
          <el-button type="primary" @click="handleSearch">
            <AppIcon name="search" :class="styles.toolbarBtnIcon" />
            查询
          </el-button>
          <el-button @click="handleReset">
            <AppIcon name="refresh-left" :class="styles.toolbarBtnIcon" />
            重置
          </el-button>
          <el-button
            v-if="canCollapse"
            link
            type="primary"
            @click="toggleCollapse"
          >
            {{ collapsed ? '展开' : '收起' }}
            <AppIcon :name="collapsed ? 'arrow-down' : 'arrow-up'" />
          </el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
