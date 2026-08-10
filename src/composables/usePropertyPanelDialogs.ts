/**
 * usePropertyPanelDialogs - Property面板四类Config弹框的Status与处理
 *
 * 从 PropertyPanel 抽出：
 * - events / linkages / api / variables 四类弹框的 visible ref 与 open 函数
 * - 监听 editorStore.configDialogTrigger（右键MenuTrigger弹框）
 * - 各弹框SaveHrs写入 widgetStore / boardStore
 */
import { ref, watch, type ComputedRef } from "vue";
import { ElMessage } from "element-plus";
import { tt } from "@/locales";
import type {
  Widget,
  WidgetEvent,
  SchemaApiConfig,
  WidgetVariable,
  ChartLinkageRule,
} from "@/widgets/base/types";
import type { SchemaLinkage } from "@/components/WidgetRenderer/types";
import type { useWidgetStore } from "@/stores/widget";
import type { useEditorStore } from "@/stores/editor";
import type { useBoardStore } from "@/stores/board";

export function usePropertyPanelDialogs(
  selectedWidget: ComputedRef<Widget | null>,
  widgetStore: ReturnType<typeof useWidgetStore>,
  editorStore: ReturnType<typeof useEditorStore>,
  boardStore: ReturnType<typeof useBoardStore>,
) {
  const eventDialogVisible = ref(false);
  const linkageDialogVisible = ref(false);
  const apiDialogVisible = ref(false);
  const variableDialogVisible = ref(false);
  const boardVariableDialogVisible = ref(false);
  const chartLinkageDialogVisible = ref(false);

  function notifyConfigSaved() {
    ElMessage.success(tt("editor.property.configSaved"));
  }

  function openEventDialog() {
    eventDialogVisible.value = true;
  }

  function openLinkageDialog() {
    linkageDialogVisible.value = true;
  }

  function openApiDialog() {
    apiDialogVisible.value = true;
  }

  function openChartLinkageDialog() {
    chartLinkageDialogVisible.value = true;
  }

  // ---- 监听右键MenuTrigger的弹框Open ----
  watch(
    () => editorStore.configDialogTrigger,
    (trigger) => {
      if (!trigger) return;
      if (trigger.type === "events") eventDialogVisible.value = true;
      else if (trigger.type === "linkages") linkageDialogVisible.value = true;
      else if (trigger.type === "api") apiDialogVisible.value = true;
      else if (trigger.type === "variables") variableDialogVisible.value = true;
      else if (trigger.type === "chart-linkages")
        chartLinkageDialogVisible.value = true;
      editorStore.clearConfigDialogTrigger();
    },
  );

  function handleEventSave(events: WidgetEvent[]) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, { events });
    editorStore.pushHistory([...widgetStore.widgets]);
    notifyConfigSaved();
  }

  function handleLinkageSave(linkages: SchemaLinkage[]) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, { linkages });
    editorStore.pushHistory([...widgetStore.widgets]);
    notifyConfigSaved();
  }

  function handleApiSave(api: SchemaApiConfig | undefined) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, { api });
    editorStore.pushHistory([...widgetStore.widgets]);
    notifyConfigSaved();
  }

  function handleVariableSave(variables: WidgetVariable[]) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, { variables });
    editorStore.pushHistory([...widgetStore.widgets]);
    notifyConfigSaved();
  }

  function handleBoardVariableSave(variables: WidgetVariable[]) {
    boardStore.variables = variables as typeof boardStore.variables;
    notifyConfigSaved();
  }

  function handleChartLinkageSave(rules: ChartLinkageRule[]) {
    if (!selectedWidget.value) return;
    widgetStore.updateWidget(selectedWidget.value.id, { chartLinkages: rules });
    editorStore.pushHistory([...widgetStore.widgets]);
    notifyConfigSaved();
  }

  return {
    eventDialogVisible,
    linkageDialogVisible,
    apiDialogVisible,
    variableDialogVisible,
    boardVariableDialogVisible,
    chartLinkageDialogVisible,
    openEventDialog,
    openLinkageDialog,
    openApiDialog,
    openChartLinkageDialog,
    handleEventSave,
    handleLinkageSave,
    handleApiSave,
    handleVariableSave,
    handleBoardVariableSave,
    handleChartLinkageSave,
  };
}
