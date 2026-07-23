<script setup lang="ts">
/**
 * WidgetTemplateView — 组件模板库
 *
 * 卡片网格展示模板，支持搜索、分类筛选、详情预览。
 */
import { onMounted, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTemplateStore } from '@/stores/template'
import { useWidgetStore } from '@/stores/widget'
import { WidgetRenderer } from '@/components/WidgetRenderer'
import { registerAllWidgets } from '@/widgets'
import FilterTabs from '@schema-platform/platform-shared/components/common/FilterTabs.vue'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import type { TemplateItem } from '@/api/schemaApi'
import type { PartialWidget } from '@/widgets/base/types'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './WidgetTemplateView.module.scss'

registerAllWidgets()

const templateStore = useTemplateStore()
const widgetStore = useWidgetStore()
const { t } = useI18n()

// ---- 分类定义 ----
const CATEGORY_OPTIONS = computed<{ label: string; value: string }[]>(() => [
  { label: t('editor.templateView.categoryAll'), value: '' },
  { label: t('editor.templateView.categoryForm'), value: 'form' },
  { label: t('editor.templateView.categoryLayout'), value: 'layout' },
  { label: t('editor.templateView.categoryTable'), value: 'table' },
  { label: t('editor.templateView.categorySearch'), value: 'search' },
  { label: t('editor.templateView.categoryChart'), value: 'chart' },
  { label: t('editor.templateView.categoryBusiness'), value: 'business' },
  { label: t('editor.templateView.categoryReport'), value: 'report' },
  { label: t('editor.templateView.categoryOther'), value: 'other' },
])

// ---- 搜索防抖 ----
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleSearch(val: string) {
  searchInput.value = val
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    templateStore.setSearch(val)
    templateStore.loadTemplates()
  }, 300)
}

// ---- 分类筛选 ----
function handleCategoryChange(category: string) {
  templateStore.setCategory(category)
  templateStore.loadTemplates()
}

// ---- 分页 ----
function handlePageChange(page: number) {
  templateStore.setPage(page)
  templateStore.loadTemplates()
}

// ---- 详情预览 ----
type PreviewMode = 'render' | 'json'
const previewVisible = ref(false)
const previewTemplate = ref<TemplateItem | null>(null)
const previewJson = ref('')
const previewMode = ref<PreviewMode>('render')
const previewSchema = ref<PartialWidget[]>([])

function openPreview(template: TemplateItem) {
  previewTemplate.value = template
  previewJson.value = JSON.stringify(template.widgets, null, 2)
  previewSchema.value = template.widgets as unknown as PartialWidget[]
  previewMode.value = 'render'
  previewVisible.value = true
}

// ---- 删除模板 ----
async function handleDelete(template: TemplateItem) {
  try {
    await ElMessageBox.confirm(
      t('editor.templateView.deleteConfirmMessage', { name: template.name }),
      t('editor.templateView.deleteConfirmTitle'),
      { type: 'warning', confirmButtonText: t('editor.templateView.confirmDelete'), cancelButtonText: t('editor.common.cancel') }
    )
    await templateStore.removeTemplate(template.id)
    ElMessage.success(t('editor.templateView.templateDeleted'))
  } catch {
    // 用户取消
  }
}

// ---- 分类标签颜色 ----
const CATEGORY_TAG_THEME: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  form: 'default',
  layout: 'success',
  table: 'warning',
  search: 'default',
  chart: 'danger',
  business: 'default',
  report: 'success',
  other: 'default',
}

function getCategoryTagType(category: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  return CATEGORY_TAG_THEME[category] ?? 'default'
}

// ---- 分类中文名 ----
function getCategoryLabel(category: string): string {
  return CATEGORY_OPTIONS.value.find(c => c.value === category)?.label ?? category
}

// ---- 日期格式化 ----
function formatDate(dateStr: string | Date) {
  if (!dateStr) return '-'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('zh-CN')
}

// ---- 初始加载 ----
onMounted(() => {
  templateStore.loadTemplates()
})
</script>

<template>
  <div :class="styles.container">
    <!-- Header -->
    <div :class="styles.header">
      <div :class="styles.titleRow">
        <div>
          <h1>{{ t('editor.templateView.title') }}</h1>
          <p :class="styles.subtitle">{{ t('editor.templateView.subtitle') }}</p>
        </div>
        <div :class="styles.headerActions">
          <el-tag size="small" :class="styles.countTag">
            {{ t('editor.templateView.templateCount', { count: templateStore.total }) }}
          </el-tag>
        </div>
      </div>

      <!-- Filter bar -->
      <div :class="styles.toolbar">
        <FilterTabs v-model="templateStore.selectedCategory" :options="CATEGORY_OPTIONS" @update:model-value="handleCategoryChange" />
        <div :class="styles.toolbarRight">
          <el-input
            v-model="searchInput"
            :placeholder="t('editor.templateView.searchPlaceholder')"
            clearable
            :class="styles.searchInput"
            @input="handleSearch"
          >
            <template #prefix>
              <AppIcon name="search" :size="14" />
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="templateStore.loading" :class="styles.content">
      <div :class="styles.skeleton">
        <div v-for="i in 6" :key="i" :class="styles.skeletonCard">
          <div :class="styles.skeletonThumb" />
          <div :class="styles.skeletonTitle" />
          <div :class="styles.skeletonText" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="templateStore.error" :class="styles.content">
      <el-alert :title="templateStore.error" type="error" show-icon :closable="false">
        <template #default>
          <el-button size="small" @click="templateStore.loadTemplates()">{{ t('editor.common.retry') }}</el-button>
        </template>
      </el-alert>
    </div>

    <!-- Empty state -->
    <div v-else-if="templateStore.templates.length === 0" :class="styles.emptyState">
      <div :class="styles.emptyIcon">
        <AppIcon name="document" :size="64" />
      </div>
      <h2 :class="styles.emptyTitle">{{ t('editor.templateView.emptyTitle') }}</h2>
      <p :class="styles.emptyDesc">{{ t('editor.templateView.emptyDesc') }}</p>
    </div>

    <!-- Card Grid -->
    <div v-else :class="styles.content">
      <div :class="styles.cardGrid">
        <div
          v-for="tpl in templateStore.templates"
          :key="tpl.id"
          :class="styles.card"
        >
          <!-- 缩略图 -->
          <div :class="styles.cardPreview" @click="openPreview(tpl)">
            <img v-if="tpl.thumbnail" :src="tpl.thumbnail" :alt="tpl.name" :class="styles.thumbnail" />
            <div v-else :class="styles.thumbnailPlaceholder">
              <AppIcon name="grid" :size="32" />
            </div>
            <el-tag
              :type="getCategoryTagType(tpl.category)"
              :class="styles.cardCategory"
              size="small"
              effect="dark"
            >
              {{ getCategoryLabel(tpl.category) }}
            </el-tag>
          </div>

          <!-- 卡片内容 -->
          <div :class="styles.cardBody">
            <h3 :class="styles.cardName">{{ tpl.name }}</h3>
            <div :class="styles.cardMeta">
              <span :class="styles.metaItem">
                <AppIcon name="view" :size="12" />
                {{ t('editor.templateView.usageCount', { count: tpl.usageCount }) }}
              </span>
              <span v-if="tpl.isBuiltin" :class="styles.builtinBadge">{{ t('editor.templateView.builtin') }}</span>
              <span :class="styles.metaDate">{{ formatDate(tpl.updatedAt) }}</span>
            </div>
            <p v-if="tpl.description" :class="styles.cardDesc">{{ tpl.description }}</p>
            <div v-if="tpl.tags.length > 0" :class="styles.tagList">
              <el-tag
                v-for="tag in tpl.tags"
                :key="tag"
                size="small"
                :class="styles.tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 卡片操作 -->
          <div :class="styles.cardActions">
            <el-tooltip :content="t('editor.common.preview')" placement="top" :show-after="300">
              <el-button size="small" text @click="openPreview(tpl)">
                <AppIcon name="view" />
              </el-button>
            </el-tooltip>
            <el-tooltip v-if="!tpl.isBuiltin" :content="t('editor.common.delete')" placement="top" :show-after="300">
              <el-button size="small" text type="danger" @click="handleDelete(tpl)">
                <AppIcon name="delete" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="templateStore.totalPages > 1" :class="styles.pagination">
      <el-pagination
        :current-page="templateStore.page"
        :page-size="templateStore.pageSize"
        :total="templateStore.total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情预览抽屉 -->
    <el-drawer
      v-model="previewVisible"
      :title="previewTemplate?.name ?? t('editor.templateView.previewDrawerTitle')"
      size="55%"
      direction="rtl"
    >
      <div v-if="previewTemplate" :class="styles.previewContent">
        <!-- 模式切换 -->
        <div :class="styles.previewModeBar">
          <FilterTabs
            v-model="previewMode"
            :options="[
              { label: t('editor.templateView.renderPreview'), value: 'render' },
              { label: t('editor.templateView.jsonSource'), value: 'json' },
            ]"
          />
        </div>

        <!-- 模板基本信息 -->
        <div :class="styles.previewMeta">
          <div :class="styles.previewMetaRow">
            <span :class="styles.previewMetaLabel">{{ t('editor.templateView.category') }}</span>
            <el-tag :type="getCategoryTagType(previewTemplate.category)" size="small">
              {{ getCategoryLabel(previewTemplate.category) }}
            </el-tag>
          </div>
          <div :class="styles.previewMetaRow">
            <span :class="styles.previewMetaLabel">{{ t('editor.templateView.stats') }}</span>
            <span :class="styles.previewMetaValue">
              {{ t('editor.templateView.statsDetail', { usage: previewTemplate.usageCount, count: previewTemplate.widgets.length }) }}
            </span>
          </div>
          <div v-if="previewTemplate.description" :class="styles.previewMetaRow">
            <span :class="styles.previewMetaLabel">{{ t('editor.common.description') }}</span>
            <span :class="styles.previewMetaValue">{{ previewTemplate.description }}</span>
          </div>
          <div v-if="previewTemplate.tags.length > 0" :class="styles.previewMetaRow">
            <span :class="styles.previewMetaLabel">{{ t('editor.templateView.tags') }}</span>
            <div :class="styles.previewTagList">
              <el-tag
                v-for="tag in previewTemplate.tags"
                :key="tag"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 渲染预览 -->
        <div v-if="previewMode === 'render'" :class="styles.previewRenderArea">
          <WidgetRenderer :schema="previewSchema" />
        </div>

        <!-- JSON 源码 -->
        <pre v-else :class="styles.schemaCode"><code>{{ previewJson }}</code></pre>
      </div>
    </el-drawer>
  </div>
</template>
