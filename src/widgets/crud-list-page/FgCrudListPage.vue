<script setup lang="ts">
import { inject, computed, provide, ref, reactive, watch, type ComputedRef } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import FgAdvancedTable from '../advanced-table/FgAdvancedTable.vue'
import { TABLE_CLICK_INTERCEPT_KEY } from '../advanced-table/clickIntercept'
import type { ActionButton, AdvancedTableColumn } from '../advanced-table/config'
import { executeEventAction, type EventExecutionContext } from '../../engine/eventEngine'
import { fetchWidgetDataSource } from '@/api/widgetApi'
import { fetchApprovalLogs, type ApprovalLogItem } from '@/api/flowApi'
import { resolveWidgetUrl } from '@/utils/resolveWidgetUrl'
import { apiClient } from '@/utils/apiClient'
import type { CrudDetailDialogConfig, CrudFormDialogConfig, CrudPageActions } from './config'
import type { DescriptionItemConfig } from '../descriptions/config'
import CrudFormField from './CrudFormField.vue'
import { WIDGET_SURFACE_KEY, type WidgetSurface } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const isEditorSurface = computed(() => surface === 'editor')
const eventCtx = inject(EVENT_CONTEXT_KEY, null)
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  'variablesContext',
  computed(() => ({})),
)

const tableRef = ref<InstanceType<typeof FgAdvancedTable> | null>(null)

const tableWidgetData = computed(() => ({
  ...widgetData.value,
  type: 'advanced-table' as const,
}))

provide(widgetDataKey, tableWidgetData)

const pageActions = computed<CrudPageActions>(() =>
  (widgetData.value.props?.pageActions as CrudPageActions) ?? {},
)

const detailDialogConfig = computed<CrudDetailDialogConfig | null>(() => {
  const raw = widgetData.value.props?.detailDialog as CrudDetailDialogConfig | undefined
  if (!raw?.detailApiUrl) return null
  return raw
})

const formDialogConfig = computed<CrudFormDialogConfig | null>(() => {
  const raw = widgetData.value.props?.formDialog as CrudFormDialogConfig | undefined
  if (!raw?.fields?.length) return null
  if (isEditorSurface.value) return raw
  if (!raw.createApiUrl && !raw.updateApiUrl) return null
  return raw
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<Record<string, unknown>>({})
const detailRow = ref<Record<string, unknown>>({})
const timelineLogs = ref<ApprovalLogItem[]>([])
const timelineLoading = ref(false)

const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const formSubmitting = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<Record<string, unknown>>({})
const editingRecordId = ref('')

const descriptionItems = computed<DescriptionItemConfig[]>(() =>
  detailDialogConfig.value?.descriptionItems ?? [],
)

const visibleFormFields = computed(() => {
  const fields = formDialogConfig.value?.fields ?? []
  return fields.filter((field) => {
    if (formMode.value === 'add' && field.hiddenOnCreate) return false
    if (formMode.value === 'edit' && field.hiddenOnEdit) return false
    return true
  })
})

const formDialogTitle = computed(() => {
  const cfg = formDialogConfig.value
  if (!cfg) return ''
  if (formMode.value === 'add') return cfg.createTitle ?? cfg.title ?? '新增'
  return cfg.editTitle ?? cfg.title ?? '编辑'
})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  for (const field of visibleFormFields.value) {
    if (!field.required) continue
    rules[field.field] = [
      { required: true, message: `请填写${field.label}`, trigger: field.type === 'select' ? 'change' : 'blur' },
    ]
  }
  return rules
})

function buildEventContext(row?: Record<string, unknown>): EventExecutionContext | null {
  if (!eventCtx) return null
  return {
    ...eventCtx,
    row,
    rowIndex: row ? 0 : undefined,
  }
}

function initFormValues(row?: Record<string, unknown>) {
  const fields = formDialogConfig.value?.fields ?? []
  for (const key of Object.keys(formData)) {
    if (!fields.some((f) => f.field === key)) delete formData[key]
  }
  for (const field of fields) {
    const fromRow = row?.[field.field]
    if (fromRow !== undefined && fromRow !== null) {
      formData[field.field] = fromRow
    } else if (field.defaultValue !== undefined) {
      formData[field.field] = field.defaultValue
    } else if (field.type === 'switch') {
      formData[field.field] = false
    } else {
      formData[field.field] = ''
    }
  }
}

function openFormDialog(mode: 'add' | 'edit', row?: Record<string, unknown>) {
  formMode.value = mode
  editingRecordId.value = mode === 'edit'
    ? String(row?.[formDialogConfig.value?.recordIdField ?? '_id'] ?? '')
    : ''
  initFormValues(row)
  formVisible.value = true
}

function resolveUpdateUrl(template: string, id: string): string {
  if (template.includes('${id}')) {
    return resolveWidgetUrl(template.replace('${id}', id), {
      ...variablesContext.value,
      id,
      recordId: id,
    })
  }
  const base = resolveWidgetUrl(template, variablesContext.value)
  return base.endsWith('/') ? `${base}${id}` : `${base}/${id}`
}

async function submitFormDialog() {
  const cfg = formDialogConfig.value
  if (!cfg) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  formSubmitting.value = true
  try {
    if (isEditorSurface.value) {
      ElMessage.success(formMode.value === 'add' ? '（预览）新增成功' : '（预览）保存成功')
      formVisible.value = false
      return
    }

    const payload = { ...formData }
    if (formMode.value === 'add') {
      if (!cfg.createApiUrl) {
        ElMessage.warning('未配置新增 API')
        return
      }
      const url = resolveWidgetUrl(cfg.createApiUrl, variablesContext.value)
      await apiClient.post(url, payload)
      ElMessage.success('新增成功')
    } else {
      if (!cfg.updateApiUrl) {
        ElMessage.warning('未配置更新 API')
        return
      }
      const id = editingRecordId.value
      if (!id) {
        ElMessage.error('缺少记录 ID')
        return
      }
      const url = resolveUpdateUrl(cfg.updateApiUrl, id)
      await apiClient.put(url, payload)
      ElMessage.success('保存成功')
    }
    formVisible.value = false
    tableRef.value?.refresh()
  } catch (err) {
    console.error('[FgCrudListPage] form submit failed:', err)
    ElMessage.error(formMode.value === 'add' ? '新增失败' : '保存失败')
  } finally {
    formSubmitting.value = false
  }
}

function openDetailDialog(row: Record<string, unknown>) {
  detailRow.value = row
  detailVisible.value = true
  loadDetailData()
  loadTimeline()
}

async function loadDetailData() {
  const cfg = detailDialogConfig.value
  if (!cfg?.detailApiUrl) return

  detailLoading.value = true
  try {
    const ctx = {
      ...variablesContext.value,
      ...detailRow.value,
      recordId: detailRow.value._id,
    }
    const url = resolveWidgetUrl(cfg.detailApiUrl, ctx)
    detailData.value = await fetchWidgetDataSource(url)
  } catch (err) {
    console.error('[FgCrudListPage] detail load failed:', err)
    detailData.value = {}
  } finally {
    detailLoading.value = false
  }
}

async function loadTimeline() {
  const cfg = detailDialogConfig.value
  if (!cfg?.showFlowTimeline) {
    timelineLogs.value = []
    return
  }

  const instanceId = String(detailRow.value.flowInstanceId ?? detailData.value.flowInstanceId ?? '')
  if (!instanceId) {
    timelineLogs.value = []
    return
  }

  timelineLoading.value = true
  try {
    timelineLogs.value = await fetchApprovalLogs(instanceId)
  } catch (err) {
    console.error('[FgCrudListPage] timeline load failed:', err)
    timelineLogs.value = []
  } finally {
    timelineLoading.value = false
  }
}

function formatDescriptionValue(item: DescriptionItemConfig): string {
  const raw = detailData.value[item.field]
  if (raw == null) return '—'
  if (item.type === 'tag' && item.options?.length) {
    const found = item.options.find((o) => o.value === raw)
    return found?.label ?? String(raw)
  }
  const prefix = item.prefix ?? ''
  const suffix = item.suffix ?? ''
  return `${prefix}${String(raw)}${suffix}`
}

function getTagType(item: DescriptionItemConfig): string {
  const raw = detailData.value[item.field]
  if (!item.options?.length) return ''
  const found = item.options.find((o) => o.value === raw)
  return found?.color ?? ''
}

function handleConfirmNavigate() {
  const cfg = detailDialogConfig.value
  const ctx = buildEventContext(detailRow.value)
  if (!ctx || !cfg?.confirmNavigatePath) return

  ctx.emit('navigate', {
    path: cfg.confirmNavigatePath,
    query: {
      recordId: String(detailRow.value._id ?? ''),
      flowInstanceId: String(detailRow.value.flowInstanceId ?? ''),
      taskId: String(detailRow.value.viewerTaskId ?? detailRow.value.taskId ?? ''),
    },
  })
  detailVisible.value = false
}

function shouldOpenDetail(btnKey: string): boolean {
  return btnKey === 'view' || btnKey === 'detail'
}

function navigateToFullDetail(
  ctx: EventExecutionContext,
  row: Record<string, unknown>,
  path: string,
) {
  ctx.emit('navigate', {
    path,
    query: {
      recordId: String(row._id ?? ''),
      flowInstanceId: String(row.flowInstanceId ?? ''),
      taskId: String(row.viewerTaskId ?? row.taskId ?? ''),
    },
  })
}

provide(TABLE_CLICK_INTERCEPT_KEY, {
  onToolbarClick(btn: ActionButton) {
    const ctx = buildEventContext()
    if (!ctx) return false

    if (btn.key === 'add' && formDialogConfig.value) {
      if (isEditorSurface.value || formDialogConfig.value.createApiUrl) {
        openFormDialog('add')
        return true
      }
    }

    const actions = pageActions.value
    if (btn.key === 'add' && actions.applyNavigatePath) {
      ctx.emit('navigate', { path: actions.applyNavigatePath })
      return true
    }
    if (btn.key === 'export' && actions.export?.apiUrl) {
      void executeEventAction(
        {
          type: 'exportData',
          apiUrl: actions.export.apiUrl,
          exportFileName: actions.export.filename,
        },
        ctx,
      )
      return true
    }
    return false
  },

  onRowButtonClick(btn: ActionButton, row: Record<string, unknown>) {
    const ctx = buildEventContext(row)
    if (!ctx) return false

    if (btn.key === 'edit' && formDialogConfig.value) {
      if (isEditorSurface.value || formDialogConfig.value.updateApiUrl) {
        openFormDialog('edit', row)
        return true
      }
    }

    if (detailDialogConfig.value && shouldOpenDetail(btn.key)) {
      openDetailDialog(row)
      return true
    }

    const detailPath = pageActions.value.approveNavigatePath
    if (shouldOpenDetail(btn.key) && detailPath && !detailDialogConfig.value) {
      navigateToFullDetail(ctx, row, detailPath)
      return true
    }

    const approvePath = pageActions.value.approveNavigatePath
    if (btn.key === 'approve' && approvePath) {
      navigateToFullDetail(ctx, row, approvePath)
      return true
    }
    return false
  },

  onLinkClick(col: AdvancedTableColumn, row: Record<string, unknown>) {
    const ctx = buildEventContext(row)
    if (!ctx) return false

    if (detailDialogConfig.value && (col.prop === '_id' || col.render === 'link')) {
      openDetailDialog(row)
      return true
    }

    const detailPath = pageActions.value.approveNavigatePath
    if (detailPath && (col.prop === '_id' || col.render === 'link')) {
      navigateToFullDetail(ctx, row, detailPath)
      return true
    }
    return false
  },
})

watch(detailVisible, (visible) => {
  if (!visible) {
    detailData.value = {}
    detailRow.value = {}
    timelineLogs.value = []
  }
})

watch(formVisible, (visible) => {
  if (!visible) {
    editingRecordId.value = ''
    formRef.value?.resetFields()
  }
})
</script>

<template>
  <div :class="styles.container">
    <FgAdvancedTable ref="tableRef" />

    <el-dialog
      v-if="formDialogConfig"
      v-model="formVisible"
      :title="formDialogTitle"
      :width="formDialogConfig.width || '640px'"
      destroy-on-close
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="96px"
        :class="styles.formBody"
      >
        <el-row :gutter="16">
          <el-col
            v-for="field in visibleFormFields"
            :key="field.field"
            :span="field.span ?? 24"
          >
            <el-form-item :label="field.label" :prop="field.field">
              <CrudFormField
                :field="field"
                :model-value="formData[field.field]"
                @update:model-value="(v) => (formData[field.field] = v)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="submitFormDialog">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-if="detailDialogConfig"
      v-model="detailVisible"
      :title="detailDialogConfig.title || '申请详情'"
      width="920px"
      destroy-on-close
      append-to-body
    >
      <div v-loading="detailLoading" :class="styles.detailBody">
        <el-descriptions
          v-if="descriptionItems.length > 0"
          :title="detailDialogConfig.title || '申请信息'"
          :column="2"
          border
        >
          <el-descriptions-item
            v-for="item in descriptionItems"
            :key="item.field"
            :label="item.label"
            :span="item.span"
          >
            <el-tag
              v-if="item.type === 'tag'"
              :type="getTagType(item) as any"
              size="small"
            >
              {{ formatDescriptionValue(item) }}
            </el-tag>
            <span v-else>{{ formatDescriptionValue(item) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="detailDialogConfig.showFlowTimeline"
          :class="styles.timelineSection"
        >
          <div :class="styles.timelineTitle">审批记录</div>
          <div v-if="timelineLoading" :class="styles.timelineLoading">加载中…</div>
          <el-timeline v-else-if="timelineLogs.length > 0">
            <el-timeline-item
              v-for="(log, idx) in timelineLogs"
              :key="idx"
              :timestamp="log.createdAt ? String(log.createdAt) : undefined"
              placement="top"
            >
              <strong>{{ log.operatorName || log.operatorId || '—' }}</strong>
              {{ log.action ? ` · ${log.action}` : '' }}
              <div v-if="log.comment">{{ log.comment }}</div>
            </el-timeline-item>
          </el-timeline>
          <div v-else :class="styles.timelineEmpty">暂无审批记录</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="detailDialogConfig.confirmNavigatePath"
          type="primary"
          @click="handleConfirmNavigate"
        >
          {{ detailDialogConfig.confirmText || '全屏审批' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
