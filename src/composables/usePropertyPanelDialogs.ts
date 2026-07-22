/**
 * usePropertyPanelDialogs - 属性面板四类配置弹框的状态与处理
 *
 * 从 PropertyPanel 抽出：
 * - events / linkages / api / variables 四类弹框的 visible ref 与 open 函数
 * - 监听 editorStore.configDialogTrigger（右键菜单触发弹框）
 * - 各弹框保存时写入 widgetStore / boardStore
 */
import { ref, watch, type ComputedRef } from 'vue'
import type { Widget, WidgetEvent, SchemaApiConfig, WidgetVariable } from '@/widgets/base/types'
import type { SchemaLinkage } from '@/components/WidgetRenderer/types'
import type { useWidgetStore } from '@/stores/widget'
import type { useEditorStore } from '@/stores/editor'
import type { useBoardStore } from '@/stores/board'

export function usePropertyPanelDialogs(
  selectedWidget: ComputedRef<Widget | null>,
  widgetStore: ReturnType<typeof useWidgetStore>,
  editorStore: ReturnType<typeof useEditorStore>,
  boardStore: ReturnType<typeof useBoardStore>,
) {
  const eventDialogVisible = ref(false)
  const linkageDialogVisible = ref(false)
  const apiDialogVisible = ref(false)
  const variableDialogVisible = ref(false)
  const boardVariableDialogVisible = ref(false)

  function openEventDialog() {
    eventDialogVisible.value = true
  }

  function openLinkageDialog() {
    linkageDialogVisible.value = true
  }

  function openApiDialog() {
    apiDialogVisible.value = true
  }

  // ---- 监听右键菜单触发的弹框打开 ----
  watch(() => editorStore.configDialogTrigger, (trigger) => {
    if (!trigger) return
    if (trigger.type === 'events') eventDialogVisible.value = true
    else if (trigger.type === 'linkages') linkageDialogVisible.value = true
    else if (trigger.type === 'api') apiDialogVisible.value = true
    else if (trigger.type === 'variables') variableDialogVisible.value = true
    editorStore.clearConfigDialogTrigger()
  })

  function handleEventSave(events: WidgetEvent[]) {
    if (!selectedWidget.value) return
    widgetStore.updateWidget(selectedWidget.value.id, { events })
  }

  function handleLinkageSave(linkages: SchemaLinkage[]) {
    if (!selectedWidget.value) return
    widgetStore.updateWidget(selectedWidget.value.id, { linkages })
  }

  function handleApiSave(api: SchemaApiConfig | undefined) {
    if (!selectedWidget.value) return
    widgetStore.updateWidget(selectedWidget.value.id, { api })
  }

  function handleVariableSave(variables: WidgetVariable[]) {
    if (!selectedWidget.value) return
    widgetStore.updateWidget(selectedWidget.value.id, { variables })
  }

  function handleBoardVariableSave(variables: WidgetVariable[]) {
    boardStore.variables = variables as typeof boardStore.variables
  }

  return {
    eventDialogVisible,
    linkageDialogVisible,
    apiDialogVisible,
    variableDialogVisible,
    boardVariableDialogVisible,
    openEventDialog,
    openLinkageDialog,
    openApiDialog,
    handleEventSave,
    handleLinkageSave,
    handleApiSave,
    handleVariableSave,
    handleBoardVariableSave,
  }
}
