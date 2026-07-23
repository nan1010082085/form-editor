<script setup lang="ts">
/**
 * FgFilterBar — 全局筛选栏
 *
 * 水平排列的筛选控件集合，输出筛选参数供图表/表格消费。
 * 支持日期范围、下拉选择、关键词搜索等筛选项。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useFilterSync } from '../../composables/useFilterSync'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './style.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const filters = computed(() => (widgetData.value.props?.filters as Array<Record<string, unknown>>) ?? [])
const showSearch = computed(() => widgetData.value.props?.showSearch !== false)
const searchPlaceholder = computed(() => (widgetData.value.props?.searchPlaceholder as string) ?? t('editor.filterBar.searchPlaceholder'))

const formData = ref<Record<string, unknown>>({})
const searchValue = ref('')

const filterData = computed(() => ({ ...formData.value, keyword: searchValue.value }))

// 自动同步筛选参数到 DataSourceStore + URL
const { clearFilters } = useFilterSync(filterData)

function handleFilterChange(key: string, value: unknown) {
  formData.value = { ...formData.value, [key]: value }
}

function handleSearch() {
  formData.value = { ...formData.value, keyword: searchValue.value }
}

useExposeWidget(() => ({
  get filterData() { return filterData.value },
  resetFilters() {
    formData.value = {}
    searchValue.value = ''
    clearFilters()
  },
}))
</script>

<template>
  <div :class="styles.filterBar" :style="widgetStyle">
    <div :class="styles.filterItems">
      <div v-for="filter in filters" :key="(filter.key as string)" :class="styles.filterItem">
        <label :class="styles.filterLabel">{{ filter.label }}</label>
        <el-select
          v-if="filter.type === 'select'"
          :model-value="formData[(filter.key as string)]"
          :placeholder="t('editor.filterBar.selectPlaceholder')"
          clearable
          size="default"
          @update:model-value="handleFilterChange((filter.key as string), $event)"
        >
          <el-option
            v-for="opt in ((filter.options as Array<{ label: string; value: unknown }>) ?? [])"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-else-if="filter.type === 'date-range'"
          :model-value="formData[(filter.key as string)]"
          type="daterange"
          :range-separator="t('editor.filterBar.dateRangeSeparator')"
          :start-placeholder="t('editor.filterBar.dateRangeStart')"
          :end-placeholder="t('editor.filterBar.dateRangeEnd')"
          size="default"
          @update:model-value="handleFilterChange((filter.key as string), $event)"
        />
        <el-date-picker
          v-else-if="filter.type === 'date'"
          :model-value="formData[(filter.key as string)]"
          type="date"
          :placeholder="t('editor.filterBar.datePlaceholder')"
          size="default"
          @update:model-value="handleFilterChange((filter.key as string), $event)"
        />
        <el-input
          v-else
          :model-value="formData[(filter.key as string)]"
          :placeholder="(filter.placeholder as string) ?? ''"
          size="default"
          @update:model-value="handleFilterChange((filter.key as string), $event)"
        />
      </div>
      <div v-if="showSearch" :class="styles.filterItem">
        <el-input
          v-model="searchValue"
          :placeholder="searchPlaceholder"
          size="default"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M1014.64 969.04L703.71 656.207c57.953-69.408 92.88-161.04 92.88-260.96C796.59 178.368 618.222 0 398.296 0 178.368 0 0 178.368 0 398.296s178.368 398.296 398.296 398.296c99.92 0 191.552-34.927 260.96-92.88l310.832 312.784c14.64 14.64 38.4 14.64 53.04 0l21.512-21.512c14.64-14.64 14.64-38.4 0-53.04zM398.296 721.6c-178.368 0-323.304-144.936-323.304-323.304S219.928 75 398.296 75s323.304 144.936 323.304 323.304-144.936 323.296-323.304 323.296z"/></svg></el-icon>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>
