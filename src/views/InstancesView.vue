<script setup lang="ts">
/**
 * InstancesView — Schema 实例管理页
 *
 * 卡片网格展示所有 Schema 实例。支持搜索、筛选标签、排序、批量删除。
 * 使用 Element Plus 组件库。
 */
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useApiStore } from '@/stores/api'
import { downloadSchemaJson, parseImportFile } from '@/utils/schemaExport'
import { importSchema, updateSchema } from '@/api/schemaApi'
import type { SchemaTypeValue } from '@/types/api'
import type { BoardLayoutMode, FlexPageTemplate, FreeLayoutPreset } from '@/widgets/base/types'
import { createBoardFromTemplate } from '@/utils/boardTemplates'
import VersionHistoryDialog from '@/components/Editor/VersionHistoryDialog.vue'
import AppDialog from '@schema-platform/platform-shared/components/common/AppDialog.vue'
import FilterTabs from '@schema-platform/platform-shared/components/common/FilterTabs.vue'
import type { SchemaListItem, SchemaDetail } from '@/types/api'
import type { PartialWidget } from '@/widgets/base/types'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'
import { reportTelemetry } from '@/api/telemetryApi'
import styles from './InstancesView.module.scss'

const router = useRouter()
const store = useApiStore()
const { t } = useI18n()

/** 获取 JSON 中的组件数量 */
function getJsonLength(json: SchemaListItem['json']): number {
  if (Array.isArray(json)) return json.length
  if (json && typeof json === 'object' && 'widgets' in json) return (json.widgets as PartialWidget[]).length
  return 0
}
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ---- Filter & Sort ----
const activeTab = ref<'all' | SchemaTypeValue>('all')
const sortBy = ref<'newest' | 'oldest' | 'name'>('newest')
const bulkMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const publishingId = ref<string | null>(null)
const COOLDOWN_MS = 2000

const filterTabs = computed(() => [
  { label: t('editor.instances.filterAll'), value: 'all' as const },
  { label: t('editor.instances.filterForm'), value: 'form' as const },
  { label: t('editor.instances.filterSearchList'), value: 'search-list' as const },
  { label: t('editor.instances.filterLayout'), value: 'layout' as const },
  { label: t('editor.instances.filterTable'), value: 'table' as const },
  { label: t('editor.instances.filterChart'), value: 'chart' as const },
  { label: t('editor.instances.filterBusiness'), value: 'business' as const },
  { label: t('editor.instances.filterReport'), value: 'report' as const },
  { label: t('editor.instances.filterOther'), value: 'other' as const },
])

const sortOptions = computed(() => [
  { label: t('editor.instances.sortNewest'), value: 'newest' as const },
  { label: t('editor.instances.sortOldest'), value: 'oldest' as const },
  { label: t('editor.instances.sortName'), value: 'name' as const },
])

// ---- Schema type options ----
const schemaTypeOptions = computed<{ label: string; value: SchemaTypeValue }[]>(() => [
  { label: t('editor.instances.filterForm'), value: 'form' },
  { label: t('editor.instances.filterSearchList'), value: 'search-list' },
  { label: t('editor.instances.filterLayout'), value: 'layout' },
  { label: t('editor.instances.filterTable'), value: 'table' },
  { label: t('editor.instances.filterChart'), value: 'chart' },
  { label: t('editor.instances.filterBusiness'), value: 'business' },
  { label: t('editor.instances.filterReport'), value: 'report' },
  { label: t('editor.instances.filterOther'), value: 'other' },
])

// ---- Create Dialog ----
const createDialogVisible = ref(false)
const createName = ref('')
const createType = ref<SchemaTypeValue>('form')
const createLayoutMode = ref<BoardLayoutMode>('flex')
const createFlexTemplate = ref<FlexPageTemplate>('form')
const createFreePreset = ref<FreeLayoutPreset>('list-standard')

const layoutModeOptions = computed<{ label: string; value: BoardLayoutMode; desc: string }[]>(() => [
  { label: t('editor.instances.layoutFlex'), value: 'flex', desc: t('editor.instances.layoutFlexDesc') },
  { label: t('editor.instances.layoutFree'), value: 'free', desc: t('editor.instances.layoutFreeDesc') },
])

const flexTemplateOptions = computed<{ label: string; value: FlexPageTemplate }[]>(() => [
  { label: t('editor.instances.tplForm'), value: 'form' },
  { label: t('editor.instances.tplList'), value: 'list' },
  { label: t('editor.instances.tplDetail'), value: 'detail' },
  { label: t('editor.instances.tplBlank'), value: 'blank' },
])

const freePresetOptions = computed<{ label: string; value: FreeLayoutPreset }[]>(() => [
  { label: t('editor.instances.presetFull'), value: 'full' },
  { label: t('editor.instances.presetFormNarrow'), value: 'form-narrow' },
  { label: t('editor.instances.presetListStandard'), value: 'list-standard' },
  { label: t('editor.instances.presetListWide'), value: 'list-wide' },
  { label: t('editor.instances.presetDashboardDemo'), value: 'dashboard-demo' },
])

const selectedLayoutDesc = computed(
  () => layoutModeOptions.value.find((o) => o.value === createLayoutMode.value)?.desc ?? '',
)

function openCreateDialog() {
  createName.value = ''
  createType.value = 'form'
  createLayoutMode.value = 'flex'
  createFlexTemplate.value = 'form'
  createFreePreset.value = 'list-standard'
  createDialogVisible.value = true
}

function onLayoutModeChange(mode: BoardLayoutMode) {
  createLayoutMode.value = mode
  if (mode === 'flex') {
    if (createFlexTemplate.value === 'form') createType.value = 'form'
    else if (createFlexTemplate.value === 'list') createType.value = 'search-list'
    else if (createFlexTemplate.value === 'detail') createType.value = 'business'
  }
}

function onFlexTemplateChange(template: FlexPageTemplate) {
  createFlexTemplate.value = template
  if (template === 'form') createType.value = 'form'
  else if (template === 'list') createType.value = 'search-list'
  else if (template === 'detail') createType.value = 'business'
}

async function confirmCreate() {
  const name = createName.value.trim()
  if (!name) {
    ElMessage.warning(t('editor.instances.nameRequired'))
    return
  }
  const seed = createBoardFromTemplate({
    layoutMode: createLayoutMode.value,
    flexTemplate: createFlexTemplate.value,
    freePreset: createFreePreset.value,
  })
  const result = await store.createSchema({
    name,
    type: createType.value,
    json: {
      widgets: seed.widgets,
      board: {
        canvas: seed.canvas,
        variables: [],
        events: [],
      },
    },
  })
  if (result) {
    createDialogVisible.value = false
    ElMessage.success(t('editor.instances.createSuccess'))
    router.push({ path: '/editor', query: { id: result.id } })
  } else {
    ElMessage.error(store.error || t('editor.instances.createFailed'))
  }
}

// ---- Data fetching ----
onMounted(() => {
  store.fetchSchemas()
})

function handleSearch(val: string) {
  searchInput.value = val
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const filter = buildFilter()
    store.fetchSchemas({ search: val, page: 1, ...filter })
  }, 300)
}

function buildFilter(): { type?: string } {
  const filter: { type?: string } = {}
  if (activeTab.value !== 'all') {
    // 前端 search-list → 后端 search_list，其他类型名称一致
    filter.type = activeTab.value === 'search-list' ? 'search_list' : activeTab.value
  }
  return filter
}

watch(activeTab, () => {
  const filter = buildFilter()
  store.fetchSchemas({ search: searchInput.value || undefined, page: 1, ...filter })
})

function handlePageChange(page: number) {
  const filter = buildFilter()
  store.fetchSchemas({ search: searchInput.value || undefined, page, ...filter })
}

// ---- Sort (client-side) ----
const sortedSchemas = computed(() => {
  const items = [...store.schemas]
  if (sortBy.value === 'oldest') return items.reverse()
  if (sortBy.value === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  return items
})

// ---- CRUD ----
function handleDelete(item: SchemaListItem) {
  const isPublished = !!item.publishId
  const message = isPublished
    ? t('editor.instances.deletePublishedMessage', { name: item.name })
    : t('editor.instances.deleteConfirmMessage', { name: item.name })
  ElMessageBox.confirm(message, t('editor.instances.deleteConfirmTitle'), {
    confirmButtonText: t('editor.instances.actionDelete'),
    cancelButtonText: t('editor.instances.cancel'),
    type: isPublished ? 'error' : 'warning',
  }).then(async () => {
    const ok = await store.deleteSchema(item.id)
    if (ok) ElMessage.success(t('editor.instances.deleteSuccess'))
    else ElMessage.error(store.error || t('editor.instances.deleteFailed'))
  }).catch((err) => {
    if (err !== 'cancel') throw err
  })
}

function handleDesigner(id: string) {
  // 跳转到设计器（原编辑按钮行为）
  router.push({ path: '/editor', query: { id } })
}

function handlePreview(item: SchemaListItem) {
  if (item.publishId) {
    // 预览发布版本
    router.push({ path: '/view', query: { id: item.publishId } })
  } else {
    // 未发布则预览编辑版本
    router.push({ path: '/editor', query: { id: item.id, mode: 'preview' } })
  }
}

async function handlePublish(item: SchemaListItem) {
  if (publishingId.value) return
  try {
    await ElMessageBox.confirm(
      t('editor.instances.publishConfirmMessage', { name: item.name }),
      t('editor.instances.publishConfirmTitle'),
      {
        confirmButtonText: t('editor.instances.actionPublish'),
        cancelButtonText: t('editor.instances.cancel'),
        type: 'info',
      }
    )
  } catch {
    return // 用户取消，不做任何操作
  }

  try {
    publishingId.value = item.id
    const result = await store.publishSchema(item.id)
    if (result) {
      ElMessage.success(t('editor.instances.publishSuccess'))
      store.fetchSchemas()
    } else {
      ElMessage.error(store.error || t('editor.instances.publishFailed'))
    }
  } catch (err) {
    console.error(t('editor.instances.publishFailed'), err)
    ElMessage.error(t('editor.instances.publishFailed'))
  } finally {
    setTimeout(() => { publishingId.value = null }, COOLDOWN_MS)
  }
}

// ---- Bulk operations ----
function toggleBulkMode() {
  bulkMode.value = !bulkMode.value
  selectedIds.value.clear()
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

async function handleBulkDelete() {
  if (selectedIds.value.size === 0) return
  try {
    await ElMessageBox.confirm(
      t('editor.instances.bulkDeleteMessage', { count: selectedIds.value.size }),
      t('editor.instances.bulkDeleteTitle'),
      {
        confirmButtonText: t('editor.instances.actionDelete'),
        cancelButtonText: t('editor.instances.cancel'),
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    let success = 0
    let fail = 0
    for (const id of selectedIds.value) {
      const ok = await store.deleteSchema(id)
      if (ok) success++
      else fail++
    }
    if (fail === 0) ElMessage.success(t('editor.instances.bulkDeleteSuccess', { count: success }))
    else ElMessage.warning(t('editor.instances.bulkDeletePartial', { success, fail }))

    bulkMode.value = false
    selectedIds.value.clear()
  } catch (err) {
    console.error(t('editor.instances.bulkDeleteFailed'), err)
    ElMessage.error(t('editor.instances.bulkDeleteFailed'))
  }
}

// ---- Export/Import ----
function handleExport(item: SchemaListItem) {
  // 需要完整的 schema 数据才能导出
  store.fetchSchemaById(item.id).then((detail) => {
    if (detail) {
      downloadSchemaJson(detail as SchemaDetail)
      ElMessage.success(t('editor.instances.exportSuccess'))
      void reportTelemetry('export', { schemaId: item.id })
    }
  })
}

const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFile = ref<File | null>(null)

function openImportDialog() {
  importFile.value = null
  importDialogVisible.value = true
}

function handleFileChange(file: File) {
  importFile.value = file
}

function handleUploadChange(uploadFile: any) {
  if (uploadFile.raw) {
    handleFileChange(uploadFile.raw)
  }
}

async function confirmImport() {
  if (!importFile.value) {
    ElMessage.warning(t('editor.instances.importFileRequired'))
    return
  }

  importLoading.value = true
  try {
    const parsed = await parseImportFile(importFile.value)
    await importSchema(parsed)
    importDialogVisible.value = false
    ElMessage.success(t('editor.instances.importSuccess'))
    void reportTelemetry('import')
    store.fetchSchemas()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.instances.importFailed'))
  } finally {
    importLoading.value = false
  }
}

// ---- Helpers ----
function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}

const TYPE_LABEL_MAP = computed<Record<string, string>>(() => ({
  form: t('editor.instances.filterForm'),
  search_list: t('editor.instances.filterSearchList'),
  layout: t('editor.instances.filterLayout'),
  table: t('editor.instances.filterTable'),
  chart: t('editor.instances.filterChart'),
  business: t('editor.instances.filterBusiness'),
  report: t('editor.instances.filterReport'),
  other: t('editor.instances.filterOther'),
}))

const TYPE_TAG_MAP: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  form: 'info',
  search_list: 'success',
  layout: 'info',
  table: 'success',
  chart: 'warning',
  business: 'danger',
  report: 'info',
  other: '',
}

function typeLabel(type: string): string {
  return TYPE_LABEL_MAP.value[type] ?? type
}

function typeTagType(type: string): 'info' | 'success' | 'warning' | 'danger' | '' {
  return TYPE_TAG_MAP[type] ?? ''
}

const isFiltered = computed(() =>
  activeTab.value !== 'all' || (searchInput.value && searchInput.value.trim().length > 0),
)

// ---- Edit Instance ----
const editDialogVisible = ref(false)
const editId = ref<string | null>(null)
const editName = ref('')
const editType = ref<SchemaTypeValue>('form')
const editSaving = ref(false)

function handleEdit(id: string) {
  const item = store.schemas.find(s => s.id === id)
  if (!item) return
  editId.value = item.id
  editName.value = item.name
  editType.value = (item.type as SchemaTypeValue) ?? 'form'
  editDialogVisible.value = true
}

async function confirmEdit() {
  if (!editId.value || !editName.value.trim()) return
  editSaving.value = true
  try {
    await updateSchema(editId.value, { name: editName.value.trim(), type: editType.value })
    ElMessage.success(t('editor.instances.updateSuccess'))
    editDialogVisible.value = false
    store.fetchSchemas()
  } catch {
    ElMessage.error(t('editor.instances.updateFailed'))
  } finally {
    editSaving.value = false
  }
}

// ---- Version History ----
const versionDialogVisible = ref(false)
const versionDialogId = ref<string | null>(null)
const versionDialogEditId = ref<string | null>(null)
const versionDialogVersion = ref<string | undefined>(undefined)
const versionDialogName = ref<string | undefined>(undefined)

function handleShowVersions(item: SchemaListItem) {
  versionDialogId.value = item.id
  versionDialogEditId.value = item.editId
  versionDialogVersion.value = item.version
  versionDialogName.value = item.name
  versionDialogVisible.value = true
}

function handleLoadVersion(version: string) {
  // 加载特定版本后跳转到编辑器
  if (versionDialogEditId.value) {
    router.push({ path: '/editor', query: { editId: versionDialogEditId.value, version } })
  }
}

function handleVersionPublished() {
  store.fetchSchemas()
}
</script>

<template>
  <div :class="styles['fg-instances']">
    <div :class="styles['fg-instances__scrollbar']">
      <!-- Header -->
      <div :class="styles['fg-instances__header']">
        <div :class="styles['fg-instances__title-row']">
          <div>
            <h1>{{ t('editor.instances.title') }}</h1>
            <p :class="styles['fg-instances__subtitle']">{{ t('editor.instances.subtitle') }}</p>
          </div>
          <div :class="styles['fg-instances__header-actions']">
            <el-button @click="openImportDialog">
              <AppIcon name="upload" class="el-icon--left" />{{ t('editor.instances.import') }}
            </el-button>
            <el-button type="primary" @click="openCreateDialog">
              <AppIcon name="plus" class="el-icon--left" />{{ t('editor.instances.create') }}
            </el-button>
          </div>
        </div>

        <!-- Filter bar -->
        <div :class="styles['fg-instances__toolbar']">
          <FilterTabs v-model="activeTab" :options="filterTabs" />
          <div :class="styles['fg-instances__toolbar-right']">
            <el-input v-model="searchInput" :placeholder="t('editor.instances.searchPlaceholder')" clearable :class="styles['fg-instances__search']" @input="handleSearch" @clear="handleSearch('')">
              <template #prefix><AppIcon name="search" :size="14" /></template>
            </el-input>
            <el-dropdown @command="(cmd: string) => sortBy = cmd as any">
              <el-button size="small">
                <AppIcon name="sort" class="el-icon--left" />
                {{ sortOptions.find(s => s.value === sortBy)?.label }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="s in sortOptions" :key="s.value" :command="s.value">
                    {{ s.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" :type="bulkMode ? 'danger' : 'default'" @click="toggleBulkMode">
              <AppIcon name="document" class="el-icon--left" />
              {{ bulkMode ? t('editor.instances.cancelBulk') : t('editor.instances.bulkAction') }}
            </el-button>
            <el-button v-if="bulkMode && selectedIds.size > 0" size="small" type="danger" @click="handleBulkDelete">
              <AppIcon name="delete" class="el-icon--left" />
              {{ t('editor.instances.actionDelete') }} ({{ selectedIds.size }})
            </el-button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading && !store.hasSchemas" :class="styles['fg-instances__content']">
        <div :class="styles['fg-instances__skeleton']">
          <div v-for="i in 6" :key="i" :class="styles['fg-instances__skeleton-card']">
            <div :class="styles['fg-instances__skeleton-preview']" />
            <div :class="styles['fg-instances__skeleton-title']" />
            <div :class="styles['fg-instances__skeleton-text']" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="store.hasError && !store.hasSchemas" :class="styles['fg-instances__content']">
        <el-alert :title="store.error ?? ''" type="error" show-icon :closable="false">
          <template #default>
            <el-button size="small" @click="store.fetchSchemas()">{{ t('editor.instances.retry') }}</el-button>
          </template>
        </el-alert>
      </div>

      <!-- Empty (global) -->
      <div v-else-if="store.isEmpty" :class="styles['fg-instances__state--empty']">
        <div :class="styles['fg-instances__empty-icon']">
          <AppIcon name="document" :size="64" />
        </div>
        <h2 :class="styles['fg-instances__empty-title']">{{ t('editor.instances.emptyTitle') }}</h2>
        <p :class="styles['fg-instances__empty-desc']">{{ t('editor.instances.emptyDesc') }}</p>
        <div :class="styles['fg-instances__empty-actions']">
          <el-button type="primary" size="large" @click="openCreateDialog">
            <AppIcon name="plus" class="el-icon--left" />{{ t('editor.instances.createInstance') }}
          </el-button>
        </div>
      </div>

      <!-- No search results -->
      <div v-else-if="isFiltered && sortedSchemas.length === 0 && !store.loading" :class="styles['fg-instances__state--no-results']">
        <p>{{ t('editor.instances.noMatch') }}</p>
        <el-button @click="activeTab = 'all'; searchInput = ''; store.fetchSchemas()">{{ t('editor.instances.clearFilter') }}</el-button>
      </div>

      <!-- Card Grid -->
      <div v-else :class="styles['fg-instances__content']">
        <div :class="styles['fg-instances__cards']">
          <div v-for="item in sortedSchemas" :key="item.id" :class="styles['fg-instances-card']">
            <!-- Bulk select checkbox -->
            <div v-if="bulkMode" :class="styles['fg-instances-card__check']">
              <el-checkbox :model-value="selectedIds.has(item.id)" @change="toggleSelect(item.id)" />
            </div>
            <div :class="styles['fg-instances-card__preview']" @click="handleDesigner(item.id)">
              <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" :class="styles['fg-instances-card__thumbnail']" />
              <div v-else :class="styles['fg-instances-card__thumbnail-placeholder']">
                <AppIcon name="document" :size="32" />
              </div>
            </div>
            <div :class="styles['fg-instances-card__body']">
              <h3 :class="styles['fg-instances-card__name']">{{ item.name }}</h3>
              <div :class="styles['fg-instances-card__meta']">
                <el-tag size="small" :type="typeTagType(item.type)">{{ typeLabel(item.type) }}</el-tag>
                <el-tag v-if="item.publishId" size="small" type="success">{{ t('editor.instances.published') }}</el-tag>
                <span v-if="item.version" :class="styles['fg-instances-card__version']">v{{ item.version }}</span>
                <!-- Component count -->
                <span v-if="getJsonLength(item.json)" :class="styles['fg-instances-card__count']">
                  {{ getJsonLength(item.json) }} {{ t('editor.instances.components') }}
                </span>
                <span :class="styles['fg-instances-card__date']">{{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
            <div :class="styles['fg-instances-card__actions']">
              <el-tooltip :content="t('editor.instances.tooltipEdit')" placement="top" :show-after="300">
                <el-button size="small" text type="primary" @click="handleEdit(item.id)"><AppIcon name="edit" /></el-button>
              </el-tooltip>
              <el-tooltip :content="t('editor.instances.tooltipDesigner')" placement="top" :show-after="300">
                <el-button size="small" text @click="handleDesigner(item.id)"><AppIcon name="setting" /></el-button>
              </el-tooltip>
              <el-tooltip :content="item.publishId ? t('editor.instances.previewPublished') : t('editor.instances.previewEdit')" placement="top" :show-after="300">
                <el-button size="small" text type="warning" @click="handlePreview(item)"><AppIcon name="view" /></el-button>
              </el-tooltip>
              <el-tooltip :content="t('editor.instances.tooltipVersions')" placement="top" :show-after="300">
                <el-button size="small" text @click="handleShowVersions(item)"><AppIcon name="clock" /></el-button>
              </el-tooltip>
              <el-tooltip :content="t('editor.instances.actionPublish')" placement="top" :show-after="300">
                <el-button size="small" text type="success" :loading="publishingId === item.id" :disabled="publishingId !== null" @click="handlePublish(item)"><AppIcon name="promotion" /></el-button>
              </el-tooltip>
              <el-tooltip :content="t('editor.instances.actionExport')" placement="top" :show-after="300">
                <el-button size="small" text @click="handleExport(item)"><AppIcon name="download" /></el-button>
              </el-tooltip>
              <el-tooltip :content="t('editor.instances.actionDelete')" placement="top" :show-after="300">
                <el-button size="small" text type="danger" @click="handleDelete(item)"><AppIcon name="delete" /></el-button>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="store.pagination.total > 0" :class="styles['fg-instances__pagination']">
          <el-pagination
            v-model:current-page="store.pagination.page"
            :page-size="store.pagination.pageSize"
            :total="store.pagination.total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <AppDialog v-model="createDialogVisible" :title="t('editor.instances.createDialogTitleNew')" width="520px">
      <el-form label-width="96px" @submit.prevent="confirmCreate">
        <el-form-item :label="t('editor.instances.createFormName')">
          <el-input v-model="createName" :placeholder="t('editor.instances.createFormNamePlaceholder')" maxlength="100" show-word-limit @keyup.enter="confirmCreate" />
        </el-form-item>
        <el-form-item :label="t('editor.instances.createFormLayoutMode')">
          <div :class="styles.createLayoutMode">
            <el-radio-group v-model="createLayoutMode" :class="styles.createLayoutRadios" @change="onLayoutModeChange">
              <el-radio
                v-for="opt in layoutModeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </el-radio>
            </el-radio-group>
            <p v-if="selectedLayoutDesc" :class="styles.createLayoutDesc">{{ selectedLayoutDesc }}</p>
          </div>
        </el-form-item>
        <el-form-item v-if="createLayoutMode === 'flex'" :label="t('editor.instances.createFormPageTemplate')">
          <el-select v-model="createFlexTemplate" style="width:100%" @change="onFlexTemplateChange">
            <el-option v-for="opt in flexTemplateOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-else :label="t('editor.instances.createFormPreset')">
          <el-select v-model="createFreePreset" style="width:100%">
            <el-option v-for="opt in freePresetOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('editor.instances.createFormTypeTag')">
          <el-select v-model="createType" style="width:100%">
            <el-option v-for="opt in schemaTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <div :class="styles.createFieldHint">{{ t('editor.instances.createFormTypeHint') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">{{ t('editor.instances.cancel') }}</el-button>
        <el-button type="primary" @click="confirmCreate">{{ t('editor.instances.createAndEdit') }}</el-button>
      </template>
    </AppDialog>

    <!-- Import Dialog -->
    <AppDialog v-model="importDialogVisible" :title="t('editor.instances.importDialogTitle')" width="440px">
      <el-upload drag :auto-upload="false" accept=".json" :limit="1" :on-change="handleUploadChange">
        <AppIcon name="upload" class="el-icon--upload" :size="40" />
        <div class="el-upload__text">{{ t('editor.instances.importDragHint') }} <em>{{ t('editor.instances.importClickSelect') }}</em></div>
        <template #tip>
          <div class="el-upload__tip">{{ t('editor.instances.importTip') }}</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ t('editor.instances.cancel') }}</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">{{ t('editor.instances.import') }}</el-button>
      </template>
    </AppDialog>

    <!-- Version History Dialog -->
    <VersionHistoryDialog
      v-model:visible="versionDialogVisible"
      :id="versionDialogId"
      :edit-id="versionDialogEditId"
      :current-version="versionDialogVersion"
      :schema-name="versionDialogName"
      @load-version="handleLoadVersion"
      @published="handleVersionPublished"
    />

    <!-- Edit Instance Dialog -->
    <AppDialog v-model="editDialogVisible" :title="t('editor.instances.editDialogTitle')" width="440px">
      <el-form label-width="80px" @submit.prevent="confirmEdit">
        <el-form-item :label="t('editor.instances.editFormName')">
          <el-input v-model="editName" :placeholder="t('editor.instances.createFormNamePlaceholder')" maxlength="100" show-word-limit @keyup.enter="confirmEdit" />
        </el-form-item>
        <el-form-item :label="t('editor.instances.editFormTypeTag')">
          <el-select v-model="editType" style="width:100%">
            <el-option v-for="opt in schemaTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{ t('editor.instances.cancel') }}</el-button>
        <el-button type="primary" :loading="editSaving" @click="confirmEdit">{{ t('editor.instances.save') }}</el-button>
      </template>
    </AppDialog>
  </div>
</template>
