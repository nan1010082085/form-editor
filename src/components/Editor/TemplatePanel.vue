<script setup lang="ts">
/**
 * TemplatePanel — 左侧模板面板
 *
 * 展示组件模板库，支持搜索/分类筛选。
 * 模板卡片可拖拽到画布（通过 dataTransfer 传递模板 ID）。
 * 支持应用模板和删除操作。
 */
import { ref, watch } from 'vue'
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

registerAllWidgets()

const emit = defineEmits<{
  apply: [template: WidgetTemplateItem]
}>()

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  form: '表单',
  layout: '布局',
  table: '表格',
  search: '搜索',
  chart: '图表',
  business: '业务',
  report: '报表',
  other: '其他',
}

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
    ElMessage.error(err instanceof Error ? err.message : '加载模板失败')
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
      `确定删除模板「${template.name}」？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await deleteTemplate(template.id)
    ElMessage.success('模板已删除')
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
      `确认应用模板「${template.name}」？模板内容将添加到画布。`,
      '应用模板',
      { confirmButtonText: '应用', cancelButtonText: '取消' },
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
        placeholder="搜索模板..."
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
        placeholder="分类"
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
            <span v-else :class="styles.placeholder">无预览</span>
          </div>

          <!-- 信息 -->
          <div :class="styles.info">
            <div :class="styles.name">{{ template.name }}</div>
            <div :class="styles.meta">
              <span :class="styles.category">{{ CATEGORY_LABELS[template.category] ?? '其他' }}</span>
              <span v-if="template.isBuiltin" :class="styles.builtin">内置</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div :class="styles.actions">
            <el-tooltip content="预览" placement="top" :show-after="300">
              <el-button size="small" text @click.stop="openPreview(template)">
                <AppIcon name="view" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="使用模板" placement="top" :show-after="300">
              <el-button size="small" text type="primary" @click.stop="handleApply(template)">
                <AppIcon name="plus" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="!template.isBuiltin"
              content="删除"
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
        暂无模板
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
      :title="previewTemplate ? `预览：${previewTemplate.name}` : '模板预览'"
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
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button
          v-if="previewTemplate"
          type="primary"
          @click="handleApplyFromPreview"
        >
          使用
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>
