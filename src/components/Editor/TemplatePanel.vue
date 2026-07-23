<script setup lang="ts">
/**
 * TemplatePanel — 左侧模板面板
 *
 * 展示组件模板库，支持搜索/分类筛选。
 * 模板卡片可拖拽到画布（通过 dataTransfer 传递模板 ID）。
 * 支持应用模板和删除操作。
 */
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTemplates, deleteTemplate } from '@/api/schemaApi'
import type { TemplateItem as WidgetTemplateItem, TemplateCategory } from '@/api/schemaApi'
import type { PaginatedResponse } from '@/types/api'
import type { PartialWidget } from '@/widgets/base/types'
import { WidgetRenderer } from '@/components/WidgetRenderer'
import { registerAllWidgets } from '@/widgets'
import AppDialog from '@schema-platform/platform-shared/components/common/AppDialog.vue'
import styles from './TemplatePanel.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import { useI18n } from '@schema-platform/platform-shared'

const { t } = useI18n()

registerAllWidgets()

const emit = defineEmits<{
  apply: [template: WidgetTemplateItem]
}>()

const CATEGORY_LABELS = computed<Record<TemplateCategory, string>>(() => ({
  form: t('editor.templatePanel.categoryForm'),
  layout: t('editor.templatePanel.categoryLayout'),
  table: t('editor.templatePanel.categoryTable'),
  search: t('editor.templatePanel.categorySearch'),
  chart: t('editor.templatePanel.categoryChart'),
  business: t('editor.templatePanel.categoryBusiness'),
  report: t('editor.templatePanel.categoryReport'),
  other: t('editor.templatePanel.categoryOther'),
}))

const searchQuery = ref('')
const categoryFilter = ref<TemplateCategory | ''>('')
const loading = ref(false)
const items = ref<WidgetTemplateItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const previewVisible = ref(false)
const previewTemplate = ref<WidgetTemplateItem | null>(null)
const previewSchema = ref<PartialWidget[]>([])

async function loadTemplates() {
  loading.value = true
  try {
    const res: PaginatedResponse<WidgetTemplateItem> = await fetchTemplates({
      search: searchQuery.value || undefined,
      category: categoryFilter.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = res.items
    total.value = res.total
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.templatePanel.loadFailed'))
  } finally {
    loading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadTemplates()
  }, 300)
}

watch(searchQuery, debouncedLoad)
watch(categoryFilter, () => {
  page.value = 1
  loadTemplates()
})

// 初始加载
loadTemplates()

function handleDragStart(event: DragEvent, template: WidgetTemplateItem) {
  event.dataTransfer?.setData('template-id', template.id)
  event.dataTransfer?.setData('application/schema-drag', JSON.stringify({
    source: 'template',
    templateId: template.id,
  }))
  event.dataTransfer!.effectAllowed = 'copy'
}

async function handleDelete(template: WidgetTemplateItem) {
  try {
    await ElMessageBox.confirm(
      t('editor.templatePanel.deleteConfirmMessage', { name: template.name }),
      t('editor.templatePanel.deleteConfirmTitle'),
      {
        confirmButtonText: t('editor.common.confirm'),
        cancelButtonText: t('editor.common.cancel'),
        type: 'warning',
      }
    )
    await deleteTemplate(template.id)
    ElMessage.success(t('editor.templatePanel.templateDeleted'))
    loadTemplates()
  } catch {
    // 用户取消
  }
}

function openPreview(template: WidgetTemplateItem) {
  previewTemplate.value = template
  previewSchema.value = template.widgets as unknown as PartialWidget[]
  previewVisible.value = true
}

async function handleApply(template: WidgetTemplateItem): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      t('editor.templatePanel.applyConfirmMessage', { name: template.name }),
      t('editor.templatePanel.applyConfirmTitle'),
      { confirmButtonText: t('editor.templatePanel.apply'), cancelButtonText: t('editor.common.cancel') },
    )
  } catch {
    return false
  }
  emit('apply', template)
  return true
}

async function handleApplyFromPreview() {
  if (!previewTemplate.value) return
  const applied = await handleApply(previewTemplate.value)
  if (applied) previewVisible.value = false
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadTemplates()
}

const totalPages = ref(0)
watch(() => total.value, (v) => {
  totalPages.value = Math.ceil(v / pageSize.value)
})

defineExpose({ loadTemplates })
</script>

<template>
  <div :class="styles.panel">
    <!-- 搜索和筛选 -->
    <div :class="styles.toolbar">
      <el-input
        v-model="searchQuery"
        :class="styles.search"
        size="small"
        :placeholder="t('editor.templatePanel.searchPlaceholder')"
        clearable
      >
        <template #prefix>
          <AppIcon name="search" />
        </template>
      </el-input>
      <el-select
        v-model="categoryFilter"
        :class="styles.categorySelect"
        size="small"
        :placeholder="t('editor.templatePanel.categoryPlaceholder')"
        clearable
      >
        <el-option
          v-for="(label, key) in CATEGORY_LABELS"
          :key="key"
          :label="label"
          :value="key"
        />
      </el-select>
    </div>

    <!-- 模板列表 -->
    <div v-loading="loading" :class="styles.scroll">
      <div :class="styles.grid">
        <div
          v-for="template in items"
          :key="template.id"
          :class="styles.card"
          draggable="true"
          @dragstart="handleDragStart($event, template)"
        >
          <!-- 缩略图 -->
          <div :class="styles.thumbnail">
            <img v-if="template.thumbnail" :src="template.thumbnail" :alt="template.name" />
            <span v-else :class="styles.placeholder">{{ t('editor.templatePanel.noPreview') }}</span>
          </div>

          <!-- 信息 -->
          <div :class="styles.info">
            <div :class="styles.name">{{ template.name }}</div>
            <div :class="styles.meta">
              <span :class="styles.category">{{ CATEGORY_LABELS[template.category] ?? t('editor.templatePanel.categoryOther') }}</span>
              <span v-if="template.isBuiltin" :class="styles.builtin">{{ t('editor.templatePanel.builtin') }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div :class="styles.actions">
            <el-tooltip :content="t('editor.templatePanel.preview')" placement="top" :show-after="300">
              <el-button size="small" text @click.stop="openPreview(template)">
                <AppIcon name="view" />
              </el-button>
            </el-tooltip>
            <el-tooltip :content="t('editor.templatePanel.useTemplate')" placement="top" :show-after="300">
              <el-button size="small" text type="primary" @click.stop="handleApply(template)">
                <AppIcon name="plus" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="!template.isBuiltin"
              :content="t('editor.templatePanel.delete')"
              placement="top"
              :show-after="300"
            >
              <el-button size="small" text type="danger" @click.stop="handleDelete(template)">
                <AppIcon name="delete" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div v-if="items.length === 0 && !loading" :class="styles.empty">
        {{ t('editor.templatePanel.emptyHint') }}
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" :class="styles.pagination">
      <el-pagination
        small
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePageChange"
      />
    </div>

    <AppDialog
      v-model="previewVisible"
      :title="previewTemplate ? t('editor.templatePanel.previewTitleWithName', { name: previewTemplate.name }) : t('editor.templatePanel.previewTitle')"
      width="720px"
      :show-fullscreen-btn="true"
    >
      <div v-if="previewTemplate" :class="styles.previewBody">
        <p v-if="previewTemplate.description" :class="styles.previewDesc">
          {{ previewTemplate.description }}
        </p>
        <div :class="styles.previewRender">
          <WidgetRenderer :schema="previewSchema" />
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">{{ t('editor.common.close') }}</el-button>
        <el-button
          v-if="previewTemplate"
          type="primary"
          @click="handleApplyFromPreview"
        >
          {{ t('editor.templatePanel.apply') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>
