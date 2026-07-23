<script setup lang="ts">
import { inject, computed, ref, onMounted, watch, type ComputedRef, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useI18n } from '@schema-platform/platform-shared'
import {
  fetchFlowTask,
  fetchMyPendingTaskForInstance,
  claimFlowTask,
  completeFlowTask,
  rejectFlowTaskToNode,
  delegateFlowTask,
  fetchRejectTargets,
  fetchApprovalSuggestion,
  type ApprovalSuggestion,
  type FlowTaskData,
} from '@/api/flowApi'
import { WIDGET_SURFACE_KEY, getWidgetMock, type WidgetSurface } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const variablesContext = inject<ComputedRef<Record<string, unknown>>>(
  'variablesContext',
  computed(() => ({})),
)
const exposedContext = inject<Ref<Record<string, Record<string, unknown>>>>(
  'exposedContext',
  ref({}),
)
const surface = inject(WIDGET_SURFACE_KEY, 'runtime' as WidgetSurface)
const { t } = useI18n()

const task = ref<FlowTaskData | null>(null)
const loading = ref(false)
const acting = ref(false)
const aiSuggestion = ref<ApprovalSuggestion | null>(null)
const showReject = ref(false)
const showDelegate = ref(false)
const rejectTarget = ref('')
const rejectTargets = ref<Array<{ nodeId: string; nodeName: string }>>([])
const delegateUserId = ref('')

useExposeWidget(() => ({
  get taskId() { return task.value?.id ?? '' },
  get loading() { return acting.value },
}))

const title = computed(() => (widgetData.value.props?.title as string) || t('editor.flowTaskActions.defaultTitle'))
const canAct = computed(() => task.value && ['pending', 'claimed'].includes(task.value.status))

function readComment(): string {
  const commentWidgetId = widgetData.value.props?.commentWidgetId as string
  if (!commentWidgetId) return ''
  const exposed = exposedContext.value[commentWidgetId]
  const val = exposed?.value ?? exposed?.defaultValue
  return val != null ? String(val) : ''
}

function resolveTaskId(): string {
  const varName = (widgetData.value.props?.taskIdVariable as string) || 'taskId'
  const val = variablesContext.value[varName]
  return val != null ? String(val) : ''
}

function resolveInstanceId(): string {
  const varName = (widgetData.value.props?.instanceIdVariable as string) || 'flowInstanceId'
  const val = variablesContext.value[varName]
  return val != null ? String(val) : ''
}

async function loadTask() {
  if (surface === 'editor') {
    const mock = getWidgetMock('flow-task-actions')
    if (mock?.kind === 'record') {
      task.value = {
        id: String(mock.staticData.taskId ?? 'mock-task-001'),
        instanceId: 'mock-instance-001',
        nodeId: 'node-approve',
        nodeName: String(mock.staticData.nodeName ?? '部门经理审批'),
        status: String(mock.staticData.status ?? 'pending'),
      }
      rejectTargets.value = [{ nodeId: 'start', nodeName: '发起人' }]
      rejectTarget.value = 'start'
    }
    return
  }

  const taskId = resolveTaskId()
  const instanceId = resolveInstanceId()
  if (!taskId && !instanceId) return

  loading.value = true
  try {
    if (taskId) {
      task.value = await fetchFlowTask(taskId)
    } else if (instanceId) {
      task.value = await fetchMyPendingTaskForInstance(instanceId)
    }

    if (task.value && widgetData.value.props?.showAiSuggestion !== false) {
      aiSuggestion.value = await fetchApprovalSuggestion({
        taskId: task.value.id,
        formData: task.value.formData,
      })
    }

    if (task.value) {
      rejectTargets.value = await fetchRejectTargets(task.value.id)
      if (rejectTargets.value.length > 0) {
        rejectTarget.value = rejectTargets.value[0].nodeId
      }
    }
  } catch (err) {
    console.error('[FgFlowTaskActions] load failed:', err)
  } finally {
    loading.value = false
  }
}

async function handleApprove() {
  if (!task.value) return
  if (surface === 'editor') {
    ElMessage.info(t('editor.flowTaskActions.editorPreviewApproved'))
    return
  }
  acting.value = true
  try {
    await completeFlowTask(task.value.id, {
      outcome: 'approve',
      comment: readComment(),
      formData: task.value.formData,
    })
    ElMessage.success(t('editor.flowTaskActions.approved'))
    await loadTask()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.flowTaskActions.approveFailed'))
  } finally {
    acting.value = false
  }
}

async function handleReject() {
  if (!task.value || !rejectTarget.value) return
  if (surface === 'editor') {
    ElMessage.info(t('editor.flowTaskActions.editorPreviewRejected'))
    showReject.value = false
    return
  }
  acting.value = true
  try {
    await rejectFlowTaskToNode(task.value.id, {
      targetNodeId: rejectTarget.value,
      comment: readComment(),
    })
    showReject.value = false
    ElMessage.success(t('editor.flowTaskActions.rejected'))
    await loadTask()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.flowTaskActions.rejectFailed'))
  } finally {
    acting.value = false
  }
}

async function handleClaim() {
  if (!task.value) return
  if (surface === 'editor') {
    ElMessage.info(t('editor.flowTaskActions.editorPreviewClaimed'))
    return
  }
  acting.value = true
  try {
    await claimFlowTask(task.value.id)
    ElMessage.success(t('editor.flowTaskActions.claimed'))
    await loadTask()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.flowTaskActions.claimFailed'))
  } finally {
    acting.value = false
  }
}

async function handleDelegate() {
  if (!task.value || !delegateUserId.value.trim()) return
  if (surface === 'editor') {
    ElMessage.info(t('editor.flowTaskActions.editorPreviewDelegated'))
    showDelegate.value = false
    delegateUserId.value = ''
    return
  }
  acting.value = true
  try {
    await delegateFlowTask(task.value.id, {
      targetUserId: delegateUserId.value.trim(),
      comment: readComment(),
    })
    showDelegate.value = false
    delegateUserId.value = ''
    ElMessage.success(t('editor.flowTaskActions.delegated'))
    await loadTask()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('editor.flowTaskActions.delegateFailed'))
  } finally {
    acting.value = false
  }
}

function applySuggestion() {
  if (!aiSuggestion.value) return
  const commentWidgetId = widgetData.value.props?.commentWidgetId as string
  if (!commentWidgetId) return
  const exposed = exposedContext.value[commentWidgetId]
  if (exposed && 'defaultValue' in exposed) {
    exposed.defaultValue = aiSuggestion.value.suggestion
  }
}

onMounted(loadTask)
watch(variablesContext, loadTask, { deep: true })
</script>

<template>
  <div :class="styles.wrapper">
    <h4 v-if="title" :class="styles.title">{{ title }}</h4>

    <div v-if="surface === 'editor'" :class="styles.editorBadge">{{ t('editor.flowTaskActions.editorPreview') }}</div>

    <div v-if="loading" :class="styles.loading">{{ t('editor.flowTaskActions.loadingTask') }}</div>
    <div v-else-if="!task" :class="styles.empty">{{ t('editor.flowTaskActions.noPendingTask') }}</div>
    <template v-else>
        <div v-if="aiSuggestion" :class="styles.suggestion">
          <el-alert
            :title="aiSuggestion.suggestion"
            :description="aiSuggestion.reasoning"
            type="info"
            show-icon
            :closable="false"
          />
          <el-button size="small" type="primary" link @click="applySuggestion">{{ t('editor.flowTaskActions.adoptSuggestion') }}</el-button>
        </div>

        <div v-if="canAct" :class="styles.actions">
          <el-button type="success" :loading="acting" @click="handleApprove">{{ t('editor.flowTaskActions.approve') }}</el-button>
          <el-button type="danger" :loading="acting" @click="showReject = true">{{ t('editor.flowTaskActions.reject') }}</el-button>
          <el-button v-if="task.status === 'pending'" :loading="acting" @click="handleClaim">{{ t('editor.flowTaskActions.claim') }}</el-button>
          <el-button :loading="acting" @click="showDelegate = true">{{ t('editor.flowTaskActions.delegate') }}</el-button>
        </div>
        <div v-else :class="styles.done">{{ t('editor.flowTaskActions.taskProcessed') }}</div>
      </template>

    <el-dialog v-model="showReject" :title="t('editor.flowTaskActions.rejectTitle')" width="420px">
      <el-form label-width="80px">
        <el-form-item :label="t('editor.flowTaskActions.rejectTo')">
          <el-select v-model="rejectTarget" :placeholder="t('editor.flowTaskActions.selectNode')">
            <el-option
              v-for="t in rejectTargets"
              :key="t.nodeId"
              :label="t.nodeName"
              :value="t.nodeId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReject = false">{{ t('editor.common.cancel') }}</el-button>
        <el-button type="danger" :loading="acting" @click="handleReject">{{ t('editor.flowTaskActions.confirmReject') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDelegate" :title="t('editor.flowTaskActions.delegateTitle')" width="420px">
      <el-form label-width="80px">
        <el-form-item :label="t('editor.flowTaskActions.delegateTo')">
          <el-input v-model="delegateUserId" :placeholder="t('editor.flowTaskActions.userId')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDelegate = false">{{ t('editor.common.cancel') }}</el-button>
        <el-button type="primary" :loading="acting" @click="handleDelegate">{{ t('editor.flowTaskActions.confirmDelegate') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
