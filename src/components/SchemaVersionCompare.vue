<script setup lang="ts">
/**
 * SchemaVersionCompare — Schema 版本对比组件
 *
 * 功能：
 * - 版本列表（按时间倒序）
 * - 选择两个版本进行对比
 * - 字段级变更高亮（新增/删除/修改/移动）
 * - 版本回滚
 * - 版本导出
 *
 * 依赖：
 * - useSchemaVersionStore — 版本状态管理
 * - schemaDiff — Widget 树差异算法
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSchemaVersionStore } from '@/stores/schemaVersion'
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import { useBoardStore } from '@/stores/board'
import { parseSchemaJson } from '@/utils/parseSchemaJson'
import type { VersionEntry } from '@/types/api'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'

const { t } = useI18n()

const versionStore = useSchemaVersionStore()
const widgetStore = useWidgetStore()
const editorStore = useEditorStore()
const boardStore = useBoardStore()

const emit = defineEmits<{
  close: []
  'version-loaded': [version: string]
}>()

// ---- 视图状态 ----

type ViewMode = 'list' | 'compare'
const viewMode = ref<ViewMode>('list')

// ---- 格式化 ----

function formatVersion(v: string): string {
  if (!v || v.length !== 14) return v
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)} ${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`
}

// ---- 版本选择 ----

const selectedForCompare = ref<Set<string>>(new Set())

function toggleSelect(version: string) {
  if (selectedForCompare.value.has(version)) {
    selectedForCompare.value.delete(version)
  } else {
    // 最多选两个
    if (selectedForCompare.value.size >= 2) {
      // 移除最早选的
      const first = selectedForCompare.value.values().next().value!
      selectedForCompare.value.delete(first)
    }
    selectedForCompare.value.add(version)
  }
  // 触发响应式更新
  selectedForCompare.value = new Set(selectedForCompare.value)
}

function isSelected(version: string): boolean {
  return selectedForCompare.value.has(version)
}

const canCompare = computed(() => selectedForCompare.value.size === 2)

const selectedVersions = computed(() => Array.from(selectedForCompare.value))

// ---- 进入对比 ----

async function handleCompare() {
  if (selectedVersions.value.length !== 2) return

  // 排序：较早的放左边
  const sorted = [...selectedVersions.value].sort((a, b) => a.localeCompare(b))

  versionStore.selectForCompare(sorted[0], 'left')
  versionStore.selectForCompare(sorted[1], 'right')

  const success = await versionStore.executeCompare()
  if (success) {
    viewMode.value = 'compare'
  }
}

function handleBackToList() {
  viewMode.value = 'list'
  versionStore.clearCompare()
  selectedForCompare.value = new Set()
}

// ---- 版本回滚 ----

async function handleRollback(version: string) {
  try {
    await ElMessageBox.confirm(
      t('editor.versionCompare.rollbackConfirm', { version: formatVersion(version) }),
      t('editor.versionCompare.rollbackTitle'),
      {
        confirmButtonText: t('editor.versionCompare.rollback'),
        cancelButtonText: t('editor.common.cancel'),
        type: 'warning',
      }
    )
  } catch {
    return
  }

  const detail = await versionStore.rollbackToVersion(version)
  if (detail) {
    const { widgets, boardConfig } = parseSchemaJson(detail.json)
    boardStore.loadBoard({
      id: detail.id,
      name: detail.name,
      status: (detail.status as 'draft' | 'published') || 'draft',
      canvas: boardConfig.canvas,
      variables: boardConfig.variables as any[],
      events: boardConfig.events as any[],
    })
    widgetStore.loadWidgets(widgets)
    editorStore.markClean()
    emit('version-loaded', version)
    ElMessage.success(t('editor.versionCompare.rollbackSuccess', { version: formatVersion(version) }))
    emit('close')
  } else {
    ElMessage.error(t('editor.versionCompare.rollbackFailed'))
  }
}

// ---- 版本导出 ----

function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function handleExport(version: string) {
  const json = await versionStore.exportVersion(version)
  if (json) {
    const filename = `schema-${versionStore.editId}-${version}.json`
    downloadJson(json, filename)
    ElMessage.success(t('editor.versionCompare.exportSuccess'))
  } else {
    ElMessage.error(t('editor.versionCompare.exportFailed'))
  }
}

// ---- 版本删除 ----

async function handleDelete(entry: VersionEntry) {
  if (entry.published) {
    ElMessage.warning(t('editor.versionCompare.deletePublishedWarning'))
    return
  }
  if (entry.version === versionStore.currentVersion) {
    ElMessage.warning(t('editor.versionCompare.deleteCurrentWarning'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('editor.versionCompare.deleteConfirm', { version: formatVersion(entry.version) }),
      t('editor.versionCompare.deleteTitle'),
      {
        confirmButtonText: t('editor.versionCompare.delete'),
        cancelButtonText: t('editor.common.cancel'),
        type: 'warning',
      }
    )
  } catch {
    return
  }

  const success = await versionStore.removeVersion(entry.version)
  if (success) {
    ElMessage.success(t('editor.versionCompare.deletedSuccess'))
  } else {
    ElMessage.error(t('editor.versionCompare.deleteFailed'))
  }
}

// ---- 刷新 ----

function handleRefresh() {
  versionStore.loadVersions(versionStore.page)
}

// ---- Diff status helpers ----

function getStatusColor(status: string): string {
  switch (status) {
    case 'added': return '#67c23a'
    case 'removed': return '#f56c6c'
    case 'modified': return '#e6a23c'
    case 'moved': return '#409eff'
    default: return '#909399'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'added': return t('editor.versionCompare.added')
    case 'removed': return t('editor.versionCompare.removed')
    case 'modified': return t('editor.versionCompare.modified')
    case 'moved': return t('editor.versionCompare.moved')
    default: return t('editor.versionCompare.same')
  }
}

// ---- Diff summary counts ----

const diffSummaryCounts = computed(() => {
  if (!versionStore.diffResult) return { added: 0, removed: 0, modified: 0, moved: 0 }
  return {
    added: versionStore.diffResult.added.length,
    removed: versionStore.diffResult.removed.length,
    modified: versionStore.diffResult.modified.length,
    moved: versionStore.diffResult.moved.length,
  }
})

// ---- Flatten diffs for table ----

interface DiffRow {
  id: string
  name: string
  type: string
  label?: string
  path: string
  status: 'added' | 'removed' | 'modified' | 'moved'
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>
}

const diffRows = computed<DiffRow[]>(() => {
  if (!versionStore.diffResult) return []
  const rows: DiffRow[] = []
  const r = versionStore.diffResult

  for (const d of r.added) {
    rows.push({ ...d, status: 'added' })
  }
  for (const d of r.removed) {
    rows.push({ ...d, status: 'removed' })
  }
  for (const d of r.modified) {
    rows.push({ ...d, status: 'modified', changes: d.changes })
  }
  for (const d of r.moved) {
    rows.push({ ...d, status: 'moved' })
  }

  return rows
})

// ---- 侧边标记 ----

function getSideLabel(version: string): string {
  if (version === versionStore.compareLeft) return t('editor.versionCompare.old')
  if (version === versionStore.compareRight) return t('editor.versionCompare.new')
  return ''
}

/**
 * 格式化变更值用于展示。
 */
function formatChangeValue(val: unknown): string {
  if (val === null || val === undefined) return t('editor.versionCompare.emptyValue')
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}
</script>

<template>
  <div :class="$style.compare">
    <!-- Header -->
    <div :class="$style.header">
      <span :class="$style.title">{{ t('editor.versionCompare.title') }}</span>
      <el-button :class="$style.closeBtn" text @click="emit('close')">
        <AppIcon name="close" />
      </el-button>
    </div>

    <!-- 版本列表视图 -->
    <template v-if="viewMode === 'list'">
      <div :class="$style.versionPanel">
        <!-- 操作栏 -->
        <div :class="$style.versionHeader">
          <div :class="$style.versionHeaderLeft">
            <span :class="$style.versionTitle">{{ t('editor.versionCompare.versionList') }}</span>
            <span :class="$style.versionBadge">
              {{ t('editor.versionCompare.totalVersions', { count: versionStore.total }) }}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-button
              :class="$style.compareBtn"
              type="primary"
              size="small"
              :disabled="!canCompare"
              @click="handleCompare"
            >
              {{ t('editor.versionCompare.compareSelected') }}
            </el-button>
            <el-button size="small" text @click="handleRefresh">
              <AppIcon name="refresh" />
            </el-button>
          </div>
        </div>

        <!-- 列表 -->
        <div :class="$style.versionList" style="overflow: auto; height: 100%;">
          <div v-if="versionStore.loading" :class="$style.versionLoading">
            {{ t('editor.versionCompare.loading') }}
          </div>
          <div v-else-if="versionStore.isEmpty" :class="$style.versionEmpty">
            {{ t('editor.versionCompare.noVersions') }}
          </div>
          <template v-else>
            <div
              v-for="entry in versionStore.versions"
              :key="entry.version"
              :class="[
                $style.versionItem,
                { [$style.versionItemCurrent]: entry.version === versionStore.currentVersion },
                { [$style.versionItemSelected]: isSelected(entry.version) },
              ]"
            >
              <div :class="$style.versionItemLeft" @click="toggleSelect(entry.version)">
                <el-checkbox
                  :class="$style.versionCheckbox"
                  :model-value="isSelected(entry.version)"
                  @click.stop
                  @change="toggleSelect(entry.version)"
                />
                <div :class="$style.versionInfo">
                  <span :class="$style.versionTime">
                    {{ formatVersion(entry.version) }}
                  </span>
                  <div :class="$style.versionTags">
                    <el-tag v-if="entry.published" type="success" size="small">
                      {{ t('editor.versionCompare.published') }}
                    </el-tag>
                    <el-tag v-if="entry.version === versionStore.currentVersion" type="primary" size="small">
                      {{ t('editor.versionCompare.current') }}
                    </el-tag>
                    <el-tag v-if="getSideLabel(entry.version)" type="warning" size="small">
                      {{ getSideLabel(entry.version) }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div :class="$style.versionItemRight">
                <el-tooltip :content="t('editor.versionCompare.rollbackTooltip')" placement="top">
                  <el-button
                    size="small"
                    text
                    :disabled="entry.version === versionStore.currentVersion"
                    @click.stop="handleRollback(entry.version)"
                  >
                    <AppIcon name="refresh-left" />
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="t('editor.versionCompare.export')" placement="top">
                  <el-button
                    size="small"
                    text
                    @click.stop="handleExport(entry.version)"
                  >
                    <AppIcon name="download" />
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="!entry.published && entry.version !== versionStore.currentVersion"
                  :content="t('editor.versionCompare.deleteTooltip')"
                  placement="top"
                >
                  <el-button
                    size="small"
                    text
                    type="danger"
                    @click.stop="handleDelete(entry)"
                  >
                    <AppIcon name="close" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>
        </div>

        <!-- 分页 -->
        <div v-if="versionStore.total > versionStore.pageSize" :class="$style.versionPagination">
          <el-pagination
            :current-page="versionStore.page"
            :page-size="versionStore.pageSize"
            :total="versionStore.total"
            small
            layout="prev, pager, next"
            @current-change="(p: number) => versionStore.goToPage(p)"
          />
        </div>
      </div>
    </template>

    <!-- 对比视图 -->
    <template v-if="viewMode === 'compare'">
      <div :class="$style.comparePanel">
        <!-- 对比头部 -->
        <div :class="$style.compareHeader">
          <span :class="$style.compareTitle">{{ t('editor.versionCompare.compareTitle') }}</span>
          <el-button :class="$style.compareBack" size="small" text @click="handleBackToList">
            {{ t('editor.versionCompare.backToList') }}
          </el-button>
        </div>

        <!-- 对比信息 -->
        <div :class="$style.compareInfo">
          <span :class="$style.compareLabel">{{ t('editor.versionCompare.oldVersion') }}</span>
          <span :class="$style.compareVersion">{{ formatVersion(versionStore.compareLeft) }}</span>
          <AppIcon name="arrow-right" :class="$style.compareArrow" />
          <span :class="$style.compareLabel">{{ t('editor.versionCompare.newVersion') }}</span>
          <span :class="$style.compareVersion">{{ formatVersion(versionStore.compareRight) }}</span>
        </div>

        <!-- Summary -->
        <div v-if="versionStore.hasDiff" :class="$style.summary">
          <span :class="$style.summaryItem">
            <span :class="$style.dot" :style="{ background: '#67c23a' }" />
            {{ t('editor.versionCompare.added') }} {{ diffSummaryCounts.added }}
          </span>
          <span :class="$style.summaryItem">
            <span :class="$style.dot" :style="{ background: '#f56c6c' }" />
            {{ t('editor.versionCompare.removed') }} {{ diffSummaryCounts.removed }}
          </span>
          <span :class="$style.summaryItem">
            <span :class="$style.dot" :style="{ background: '#e6a23c' }" />
            {{ t('editor.versionCompare.modified') }} {{ diffSummaryCounts.modified }}
          </span>
          <span :class="$style.summaryItem">
            <span :class="$style.dot" :style="{ background: '#409eff' }" />
            {{ t('editor.versionCompare.moved') }} {{ diffSummaryCounts.moved }}
          </span>
        </div>

        <!-- Loading -->
        <div v-if="versionStore.compareLoading" :class="$style.compareLoading">
          <AppIcon name="refresh" :class="'is-loading'" />
          <span>{{ t('editor.versionCompare.comparing') }}</span>
        </div>

        <!-- Error -->
        <div v-else-if="versionStore.hasError" :class="$style.compareError">
          {{ versionStore.error }}
        </div>

        <!-- No diff -->
        <div v-else-if="!versionStore.hasDiff" :class="$style.noDiff">
          {{ t('editor.versionCompare.identical') }}
        </div>

        <!-- Diff table -->
        <div v-else :class="$style.diffScroll" style="overflow: auto; height: 100%;">
          <table :class="$style.diffTable">
            <thead>
              <tr>
                <th :class="$style.diffTh">{{ t('editor.versionCompare.field') }}</th>
                <th :class="$style.diffTh">{{ t('editor.versionCompare.detail') }}</th>
                <th :class="$style.diffTh">{{ t('editor.versionCompare.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in diffRows"
                :key="row.id + row.status"
                :class="[
                  $style.diffTr,
                  $style[`diffTr${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`],
                ]"
              >
                <td :class="$style.diffTd">
                  <div>
                    <span :class="$style.diffWidgetName">
                      {{ row.label || row.name || row.type }}
                    </span>
                    <span :class="$style.diffWidgetType">({{ row.type }})</span>
                  </div>
                  <div :class="$style.diffPath">{{ row.path }}</div>
                </td>
                <td :class="$style.diffTd">
                  <!-- 修改的字段详情 -->
                  <div v-if="row.status === 'modified' && row.changes?.length" :class="$style.changesList">
                    <div
                      v-for="(change, ci) in row.changes"
                      :key="ci"
                      :class="$style.changeItem"
                    >
                      <span :class="$style.changeField">{{ change.field }}</span>
                      <span :class="$style.changeOld">{{ formatChangeValue(change.oldValue) }}</span>
                      <span :class="$style.changeArrow">&rarr;</span>
                      <span :class="$style.changeNew">{{ formatChangeValue(change.newValue) }}</span>
                    </div>
                  </div>
                  <span v-else-if="row.status === 'added'">{{ t('editor.versionCompare.newWidget') }}</span>
                  <span v-else-if="row.status === 'removed'">{{ t('editor.versionCompare.alreadyDeleted') }}</span>
                  <span v-else-if="row.status === 'moved'">{{ t('editor.versionCompare.positionChanged') }}</span>
                </td>
                <td :class="$style.diffTd">
                  <span
                    :class="$style.statusBadge"
                    :style="{ background: getStatusColor(row.status) }"
                  >
                    {{ getStatusLabel(row.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style module src="./SchemaVersionCompare.module.scss" />
