<script setup lang="ts">
import { inject, computed, provide, ref, watch, type ComputedRef } from 'vue'
import { widgetDataKey } from '../base/types'
import { EVENT_CONTEXT_KEY } from '../../components/WidgetRenderer/types'
import FgAdvancedTable from '../advanced-table/FgAdvancedTable.vue'
import { TABLE_CLICK_INTERCEPT_KEY } from '../advanced-table/clickIntercept'
import type { ActionButton, AdvancedTableColumn } from '../advanced-table/config'
import { executeEventAction, type EventExecutionContext } from '../../engine/eventEngine'
import { fetchWidgetDataSource } from '@/api/widgetApi'
import { fetchApprovalLogs, type ApprovalLogItem } from '@/api/flowApi'
import { resolveWidgetUrl } from '@/utils/resolveWidgetUrl'
import type { CrudDetailDialogConfig, CrudPageActions } from './config'
import type { DescriptionItemConfig } from '../descriptions/config'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const eventCtx = inject(EVENT_CONTEXT_KEY, null)
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  'variablesContext',
  computed(() => ({})),
)

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

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<Record<string, unknown>>({})
const detailRow = ref<Record<string, unknown>>({})
const timelineLogs = ref<ApprovalLogItem[]>([])
const timelineLoading = ref(false)

const descriptionItems = computed<DescriptionItemConfig[]>(() =>
  detailDialogConfig.value?.descriptionItems ?? [],
)

function buildEventContext(row?: Record<string, unknown>): EventExecutionContext | null {
  if (!eventCtx) return null
  return {
    ...eventCtx,
    row,
    rowIndex: row ? 0 : undefined,
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
</script>

<template>
  <div :class="styles.container">
    <FgAdvancedTable />

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
