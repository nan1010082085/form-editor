<script setup lang="ts">
/**
 * EditorCanvas — Edit器画布 (Phase 3)
 *
 * 简化版画布引擎, 包裹 SchemaRender, 提供画布上下文。
 * 画布Config从 boardStore 读取, Widget Data从 widgetStore 读取。
 *
 * 职责：
 * - 渲染画布Container（尺寸、Background、缩放）
 * - 委托 SchemaRender 渲染 Widget 树
 * - 画布交互（选中、拖拽、缩放）后续迭代接入
 */
import { computed, onMounted, onUnmounted, provide, ref, type CSSProperties } from "vue";
import { ElMessageBox } from "element-plus";
import { useBoardStore } from "../../stores/board";
import { useEditorStore } from "../../stores/editor";
import EditorOverlay from "./EditorOverlay.vue";
import SchemaRender from "../WidgetRenderer/SchemaRender.vue";
import { useWidgetStore } from "../../stores/widget";
import type { Widget, PreviewBreakpoint } from "../../widgets/base/types";
import type {
  PartialWidget,
  DialogRegistry,
  EventExecutionContext,
  FormFieldValue,
} from "../WidgetRenderer/types";
import { triggerWidgetEvent } from "../../engine";
import {
  EVENT_CONTEXT_KEY,
  DIALOG_REGISTRY_KEY,
  FORM_GRID_LINKAGE_KEY,
  FORM_GRID_READONLY_KEY,
  PREVIEW_BREAKPOINT_KEY,
} from "../WidgetRenderer/types";
import { WIDGET_SURFACE_KEY } from "../../widgets/base/widgetMock";
import { useLinkage } from "../../composables/useLinkage";
import { useBoardLayout } from "../../composables/useBoardLayout";
import { WidgetRenderer } from "../WidgetRenderer";
import { useAppStore } from "../../stores/app";
import WidgetContextMenu from "./WidgetContextMenu.vue";
import { useClipboard } from "../../composables/useClipboard";
import { useSnapshot } from "../../composables/useSnapshot";
import { EDITOR_CONTEXTMENU_KEY } from "./editorContextKeys";
import { useGridCanvasDropEnabled } from "../../composables/useGridCanvasDrop";
import { useDuplicateWidget } from "../../composables/useDuplicateWidget";
import {
  PREVIEW_VIEWPORT_WIDTH,
  computeFreePreviewStyle,
} from "../../composables/previewViewport";
import { useI18n } from "@schema-platform/platform-shared";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import styles from "./EditorCanvas.module.scss";
import rendererStyles from "../WidgetRenderer/style.module.scss";

const { t } = useI18n();

const props = defineProps<{
  previewBreakpoint?: PreviewBreakpoint;
}>();

const emit = defineEmits<{
  openEvent: [widget: Widget];
  openRule: [widget: Widget];
  openApi: [widget: Widget];
  openVariables: [widget: Widget];
  openChartLinkage: [widget: Widget];
  savePreview: [dataUrl: string];
}>();

const canvasRef = ref<HTMLElement>();
const contentFrameRef = ref<HTMLElement | null>(null);
defineExpose({ canvasRef });

const boardStore = useBoardStore();
const editorStore = useEditorStore();
const widgetStore = useWidgetStore();
const appStore = useAppStore();

const { isGridLayout, rendererLayout, contentFrameStyle } = useBoardLayout(
  () => boardStore.canvas,
);
const isPreview = computed(() => editorStore.mode !== "edit");
const isReadonly = computed(() => editorStore.mode === "publish-readonly");

const gridDropEnabled = computed(() => isGridLayout.value && !isPreview.value);
const showGridEmpty = computed(
  () => gridDropEnabled.value && widgetStore.widgets.length === 0,
);
/** 已有WidgetHrs, 底部追加落区提示（流式末尾） */
const showGridAppend = computed(
  () => gridDropEnabled.value && widgetStore.widgets.length > 0,
);

const {
  isDragOver: isGridDragOver,
  handleDragOver: handleGridDragOver,
  handleDragLeave: handleGridDragLeave,
  handleDrop: handleGridDrop,
} = useGridCanvasDropEnabled(contentFrameRef, gridDropEnabled);
const { duplicateFromWidget } = useDuplicateWidget();

// ---- 百Min比模式：监听父Container尺寸 ----

const parentSize = ref({ width: 1920, height: 1080 });
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const parent = canvasRef.value?.parentElement;
  if (parent) {
    const measure = () => {
      parentSize.value = {
        width: parent.clientWidth,
        height: parent.clientHeight,
      };
    };
    measure();
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(parent);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

/** 画布ContainerStyle：尺寸、Background、Padding、缩放 */
const canvasStyle = computed((): CSSProperties => {
  const c = boardStore.canvas;
  const bp = props.previewBreakpoint ?? "desktop";
  const viewportW = PREVIEW_VIEWPORT_WIDTH[bp];

  if (isGridLayout.value) {
    const zoom = isPreview.value ? 100 : (c.zoom ?? 100);
    const constrained = isPreview.value && viewportW != null;
    return {
      width: constrained ? `${viewportW}px` : "100%",
      maxWidth: constrained ? `${viewportW}px` : undefined,
      height: "100%",
      minHeight: "100%",
      margin: constrained ? "0 auto" : undefined,
      boxShadow: constrained
        ? "0 0 0 1px var(--el-border-color-lighter)"
        : undefined,
      backgroundColor: c.backgroundColor,
      padding: c.padding,
      position: "relative",
      boxSizing: "border-box",
      transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
      transformOrigin: "top left",
    };
  }

  const wUnit = c.widthUnit ?? "px";
  const hUnit = c.heightUnit ?? "px";

  // Edit模式有 24px margin（标尺空间）, 百Min比Hrs需扣除 margin
  const margin = isPreview.value ? 0 : 24;
  const availW = parentSize.value.width - margin * 2;
  const availH = parentSize.value.height - margin * 2;
  const widthPx =
    wUnit === "%" ? Math.round((availW * c.width) / 100) : c.width;
  const heightPx =
    hUnit === "%" ? Math.round((availH * c.height) / 100) : c.height;

  boardStore.setCanvasPixelSize(widthPx, heightPx);

  // 自由Layout预览：按 scaleMode 适配Container；平板/手机Hrs以设备Width为Container宽
  if (isPreview.value) {
    const frameW = viewportW ?? parentSize.value.width;
    const frameH = parentSize.value.height;
    return computeFreePreviewStyle({
      designW: widthPx,
      designH: heightPx,
      frameW,
      frameH,
      mode: c.scaleMode ?? "contain",
      backgroundColor: c.backgroundColor,
      padding: c.padding,
    });
  }

  return {
    width:
      wUnit === "%" ? `calc(${c.width}% - ${margin * 2}px)` : `${c.width}px`,
    height:
      hUnit === "%" ? `calc(${c.height}% - ${margin * 2}px)` : `${c.height}px`,
    backgroundColor: c.backgroundColor,
    padding: c.padding,
    transform: `scale(${c.zoom / 100})`,
    transformOrigin: "top left",
    position: "relative",
  };
});

// ---- 预览模式：Dialog注册表 + Event执Row上下文 ----

const dialogRegistry: DialogRegistry = new Map();
const lastOpenedDialogId = ref<string | undefined>(undefined);
provide(DIALOG_REGISTRY_KEY, dialogRegistry);

// ---- 变量 + exposed 上下文（预览模式） ----

const runtimeVariables = ref<Record<string, unknown>>({});
const exposedContext = ref<Record<string, Record<string, unknown>>>({});

const variablesContext = computed(() => {
  const vars: Record<string, unknown> = {};
  for (const v of boardStore.variables) {
    vars[v.name] = v.defaultValue;
  }
  function collect(items: Widget[]) {
    for (const item of items) {
      if (item.variables?.length) {
        for (const v of item.variables) {
          vars[v.name] = v.defaultValue;
        }
      }
      if (item.children?.length) collect(item.children as Widget[]);
    }
  }
  collect(widgetStore.widgets);
  Object.assign(vars, runtimeVariables.value);
  return vars;
});

provide(
  "registerExposed",
  (widgetId: string, state: Record<string, unknown>) => {
    exposedContext.value = { ...exposedContext.value, [widgetId]: state };
  },
);
provide("unregisterExposed", (widgetId: string) => {
  const { [widgetId]: _, ...rest } = exposedContext.value;
  exposedContext.value = rest;
});
provide("variablesContext", variablesContext);
provide("exposedContext", exposedContext);

/** 递归查找 widget */
function findWidgetById(items: Widget[], id: string): Widget | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findWidgetById(item.children as Widget[], id);
      if (found) return found;
    }
  }
  return undefined;
}

const previewEventContext: EventExecutionContext = {
  findWidget: (id: string) => findWidgetById(widgetStore.widgets, id),
  updateWidget: (id: string, patch: Partial<Widget>) =>
    widgetStore.updateWidget(id, patch),
  openDialog: (target: string) => {
    const handler = dialogRegistry.get(target);
    if (handler) {
      lastOpenedDialogId.value = target;
      handler(true);
      return;
    }
  },
  closeDialog: () => {
    if (lastOpenedDialogId.value) {
      const handler = dialogRegistry.get(lastOpenedDialogId.value);
      if (handler) handler(false);
      lastOpenedDialogId.value = undefined;
    }
  },
  submitForm: () => {},
  resetForm: () => {},
  getFormData: () => {
    const values: Record<string, unknown> = {};
    function walk(items: Widget[]) {
      for (const w of items) {
        if (w.field) values[w.field] = w.defaultValue ?? null;
        if (w.children?.length) walk(w.children as Widget[]);
      }
    }
    walk(widgetStore.widgets);
    return values;
  },
  emit: () => {},
  get variables() {
    return variablesContext.value;
  },
  setVariable: (name: string, value: unknown) => {
    runtimeVariables.value[name] = value;
  },
  getVariable: (name: string) => variablesContext.value[name],
  get exposed() {
    return exposedContext.value;
  },
  triggerEvent: (targetId: string, eventName: string) => {
    const widget = findWidgetById(widgetStore.widgets, targetId);
    if (widget) {
      triggerWidgetEvent(widget, eventName, previewEventContext);
    }
  },
  confirm: (message: string) => {
    return ElMessageBox.confirm(message, t("editor.canvas.confirmTitle"), {
      confirmButtonText: t("editor.common.confirm"),
      cancelButtonText: t("editor.common.cancel"),
      type: "warning",
    }).then(() => {});
  },
};
provide(EVENT_CONTEXT_KEY, previewEventContext);

// ---- 共享LinkageStatus（Edit模式：注入给所有 SchemaNode, 避免每个节点独立创建 useLinkage） ----

const { stateMap: linkageStateMap } = useLinkage(
  widgetStore.widgets as unknown as PartialWidget[],
  computed(() => {
    const values: Record<string, FormFieldValue> = {};
    function walk(items: Widget[]) {
      for (const w of items) {
        if (w.field) values[w.field] = w.defaultValue ?? null;
        if (w.children?.length) walk(w.children as Widget[]);
      }
    }
    walk(widgetStore.widgets);
    return values;
  }),
  variablesContext,
  exposedContext,
);
provide(FORM_GRID_LINKAGE_KEY, linkageStateMap);
provide(FORM_GRID_READONLY_KEY, isReadonly);

provide(WIDGET_SURFACE_KEY, "editor");

// ---- 响应式断点（预览/发布模式） ----
const previewBreakpointRef = computed<PreviewBreakpoint>(
  () => props.previewBreakpoint ?? "desktop",
);
provide(PREVIEW_BREAKPOINT_KEY, previewBreakpointRef);

const isPercentWidth = computed(
  () => !isGridLayout.value && (boardStore.canvas.widthUnit ?? "px") === "%",
);
const isPercentHeight = computed(
  () => !isGridLayout.value && (boardStore.canvas.heightUnit ?? "px") === "%",
);

const formGridContext = computed(() => appStore.formGridContext);
const { copy: copyToClipboard } = useClipboard();
const { captureElement } = useSnapshot();

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  widget: null as Widget | null,
});

function showContextMenu(event: MouseEvent, widget: Widget) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    widget,
  };
}

provide(EDITOR_CONTEXTMENU_KEY, showContextMenu);

function handleCopyWidget(widget: Widget) {
  duplicateFromWidget(widget);
}

function handleDeleteWidget(widget: Widget) {
  widgetStore.removeWidget(widget.id);
  editorStore.select(null);
  editorStore.pushHistory([...widgetStore.widgets]);
}

function handleCopyId(id: string) {
  void copyToClipboard(id, t("editor.canvas.copiedWidgetId"));
}

function handleBringToFront(widget: Widget) {
  const parent = widgetStore.findParent(widget.id);
  const parentId = parent?.id ?? null;
  const siblings = parent?.children ?? widgetStore.widgets;
  widgetStore.moveWidgetToIndex(widget.id, parentId, siblings.length - 1);
  editorStore.pushHistory([...widgetStore.widgets]);
}

function handleSendToBack(widget: Widget) {
  const parent = widgetStore.findParent(widget.id);
  const parentId = parent?.id ?? null;
  widgetStore.moveWidgetToIndex(widget.id, parentId, 0);
  editorStore.pushHistory([...widgetStore.widgets]);
}

function handleToggleLock(widget: Widget) {
  widgetStore.updateWidget(widget.id, { locked: !widget.locked });
  editorStore.pushHistory([...widgetStore.widgets]);
}

function handleToggleHidden(widget: Widget) {
  widgetStore.updateWidget(widget.id, { hidden: !widget.hidden });
  editorStore.pushHistory([...widgetStore.widgets]);
}

async function handleSavePreview(widget: Widget) {
  const el = document.querySelector(
    `[data-widget-id="${widget.id}"]`,
  ) as HTMLElement | null;
  if (!el) return;
  const dataUrl = await captureElement(el);
  if (dataUrl) emit("savePreview", dataUrl);
}

function handleCanvasClick() {
  if (isGridLayout.value && !isPreview.value) {
    editorStore.clearSelection();
    contextMenu.value.visible = false;
  }
}
</script>

<template>
  <div
    ref="canvasRef"
    :class="[
      styles.canvas,
      rendererStyles.fg,
      {
        [styles.canvasGrid]: !isPreview && !isGridLayout,
        [styles.canvasEdit]: !isPreview && !isGridLayout,
        [styles.canvasGridMode]: isGridLayout,
        [styles.canvasPercentWidth]: !isPreview && isPercentWidth,
        [styles.canvasPercentHeight]: !isPreview && isPercentHeight,
      },
    ]"
    :style="canvasStyle"
  >
    <div
      ref="contentFrameRef"
      :class="[
        styles.contentFrame,
        {
          [styles.contentFrameGridFlow]: gridDropEnabled,
          [styles.contentFrameGridDrop]: gridDropEnabled && isGridDragOver,
        },
      ]"
      :style="contentFrameStyle"
      @click="handleCanvasClick"
      @dragover="gridDropEnabled ? handleGridDragOver($event) : undefined"
      @dragleave="gridDropEnabled ? handleGridDragLeave($event) : undefined"
      @drop="gridDropEnabled ? handleGridDrop($event) : undefined"
    >
      <!-- Grid 空画布：整块流式落区 -->
      <div
        v-if="showGridEmpty"
        :class="[
          styles.gridEmpty,
          { [styles.gridEmptyActive]: isGridDragOver },
        ]"
      >
        <AppIcon name="plus" :size="28" />
        <span :class="styles.gridEmptyTitle">{{
          t("editor.canvas.emptyGrid")
        }}</span>
        <span :class="styles.gridEmptyHint">{{
          t("editor.canvas.emptyGridHint")
        }}</span>
      </div>

      <div
        v-if="isGridLayout && !showGridEmpty"
        :class="styles.gridWidgetsLayer"
      >
        <WidgetRenderer
          :schema="widgetStore.widgets"
          :layout="rendererLayout"
          :canvas-config="boardStore.canvas"
          :user="formGridContext.user"
          :request="formGridContext.request"
          :global="formGridContext.global"
          :editor-selectable="!isPreview"
        />
        <!-- 已有Widget：底部追加带, 标明流式末尾落点 -->
        <div
          v-if="showGridAppend"
          :class="[
            styles.gridAppend,
            { [styles.gridAppendActive]: isGridDragOver },
          ]"
          aria-hidden="true"
        >
          <AppIcon name="plus" :size="14" />
          <span>{{ t("editor.canvas.flowAppendHint") }}</span>
        </div>
      </div>

      <!-- 自由Layout：绝对定位 + Edit交互层 -->
      <template v-else>
        <SchemaRender v-if="isPreview" :widgets="widgetStore.widgets" />
        <EditorOverlay
          v-else
          @open-event="emit('openEvent', $event)"
          @open-rule="emit('openRule', $event)"
          @open-api="emit('openApi', $event)"
          @open-variables="emit('openVariables', $event)"
          @open-chart-linkage="emit('openChartLinkage', $event)"
          @save-preview="emit('savePreview', $event)"
        />
      </template>
    </div>

    <WidgetContextMenu
      v-if="isGridLayout && !isPreview"
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :widget="contextMenu.widget"
      @close="contextMenu.visible = false"
      @copy="handleCopyWidget"
      @copy-id="handleCopyId"
      @delete="handleDeleteWidget"
      @bring-to-front="handleBringToFront"
      @send-to-back="handleSendToBack"
      @toggle-lock="handleToggleLock"
      @toggle-hidden="handleToggleHidden"
      @open-event="emit('openEvent', $event)"
      @open-rule="emit('openRule', $event)"
      @open-api="emit('openApi', $event)"
      @open-variables="emit('openVariables', $event)"
      @open-chart-linkage="emit('openChartLinkage', $event)"
      @save-preview="handleSavePreview"
    />
  </div>
</template>
