<script setup lang="ts">
/**
 * EditorView — 可视化 Schema Edit器 (New Architecture)
 *
 * 三栏Layout：左侧面板 + 中间画布 + 右侧Property面板
 * 使用 4 个新 Store：
 * - useBoardStore  — 画布Config
 * - useWidgetStore — Widget Data（source of truth）
 * - useEditorStore — 选中、历史、模式
 * - useDragStore   — 拖拽Status
 *
 * 已拆Min为子Component：
 * - EditorViewToolbar  — 顶部Toolbar
 * - EditorViewLeftPanel — 左侧面板
 * - EditorViewRightPanel — 右侧Property面板
 */
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  provide,
} from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  connect as connectSocket,
  onAiApply,
  onAiPublished,
} from "@schema-platform/platform-shared/socket";
import {
  track,
  initTelemetry,
  useI18n,
} from "@schema-platform/platform-shared";
import type {
  AiApplyEvent,
  AiPublishedEvent,
} from "@schema-platform/platform-shared/socket";
import { setTriggerLabelProvider } from "@/engine/eventEngine";
import { useSnapshot } from "@/composables/useSnapshot";
import { useAutoSave } from "@/composables/useAutoSave";
import { useSchemaLoader } from "@/composables/useSchemaLoader";
import { useBoardStore } from "@/stores/board";
import { useWidgetStore } from "@/stores/widget";
import { parseSchemaJson } from "@/utils/parseSchemaJson";
import { useEditorStore } from "@/stores/editor";
import { useApiStore } from "@/stores/api";
import { registerAllWidgets } from "@/widgets";
import { useDuplicateWidget } from "@/composables/useDuplicateWidget";
import EditorCanvas from "@/components/Editor/EditorCanvas.vue";
import PageTabBar from "@/components/Editor/PageTabBar.vue";
import ZoomIndicator from "@/components/Editor/ZoomIndicator.vue";
import EventLogPanel from "@/components/Editor/EventLogPanel.vue";
import { setLogCollector } from "@/composables/useLogger";
import { useEventLog } from "@/composables/useEventLog";
import type { Widget, PreviewBreakpoint } from "@/widgets/base/types";
import { fetchVersion } from "@/api/schemaApi";
import SchemaVersionCompare from "@/components/SchemaVersionCompare.vue";
import { useSchemaVersionStore } from "@/stores/schemaVersion";
import SaveTemplateDialog from "@/components/Editor/SaveTemplateDialog.vue";
import EditorViewToolbar from "./EditorViewToolbar.vue";
import EditorViewLeftPanel from "./EditorViewLeftPanel.vue";
import EditorViewRightPanel from "./EditorViewRightPanel.vue";
import EditorRuler from "@/components/Editor/EditorRuler.vue";
import { useWidgetAlignment } from "@/composables/useWidgetAlignment";
import { useBreakpoint } from "@/composables/useBreakpoint";
import {
  VIEWPORT_CULLING_KEY,
  computeViewportRect,
  type ViewportRect,
} from "@/composables/useViewportCulling";
import { APP_CONFIGS } from "@schema-platform/platform-shared/qiankun/config";
import styles from "./EditorView.module.scss";

// Register all widgets on first mount
registerAllWidgets();

const { t } = useI18n();
setTriggerLabelProvider(t);

const route = useRoute();
const boardStore = useBoardStore();
const widgetStore = useWidgetStore();
const editorStore = useEditorStore();
const { duplicateFromClipboard } = useDuplicateWidget();
const apiStore = useApiStore();
const { loadSchemaDetail } = useSchemaLoader();
const schemaVersionStore = useSchemaVersionStore();
const { captureElement } = useSnapshot();
const editorCanvasRef = ref<InstanceType<typeof EditorCanvas>>();
const aiIframeRef = ref<HTMLIFrameElement>();
const canvasScrollRef = ref<HTMLElement>();
const viewportRect = ref<ViewportRect | null>(null);
const { align, distribute, toggleLock, toggleHidden } = useWidgetAlignment();

provide(VIEWPORT_CULLING_KEY, viewportRect);

function updateViewportRect() {
  const el = canvasScrollRef.value;
  if (!el) {
    viewportRect.value = null;
    return;
  }
  viewportRect.value = computeViewportRect(
    el.scrollLeft,
    el.scrollTop,
    el.clientWidth,
    el.clientHeight,
    boardStore.canvas.zoom,
  );
}

let viewportObserver: ResizeObserver | null = null;

function bindViewportListeners() {
  const el = canvasScrollRef.value;
  if (!el) return;
  el.addEventListener("scroll", updateViewportRect, { passive: true });
  viewportObserver = new ResizeObserver(updateViewportRect);
  viewportObserver.observe(el);
  updateViewportRect();
}

function unbindViewportListeners() {
  const el = canvasScrollRef.value;
  if (el) el.removeEventListener("scroll", updateViewportRect);
  viewportObserver?.disconnect();
  viewportObserver = null;
}

// 自动Save：脏Data 60 sec后自动TriggerSave（偏好持久化到 localStorage）
const autoSaveEnabled = ref(localStorage.getItem("editor_auto_save") !== "off");
const { isAutoSaving } = useAutoSave({
  delayMs: 60_000,
  enabled: autoSaveEnabled,
  onSave: handleSave,
});
function toggleAutoSave() {
  autoSaveEnabled.value = !autoSaveEnabled.value;
  localStorage.setItem(
    "editor_auto_save",
    autoSaveEnabled.value ? "on" : "off",
  );
}

// ================================================================
// Layout state
// ================================================================

const leftPanelVisible = ref(true);
const rightPanelVisible = ref(true);
const { isNarrow } = useBreakpoint();

// 窄屏自动收起侧面板
watch(isNarrow, (narrow) => {
  if (narrow) {
    leftPanelVisible.value = false;
    rightPanelVisible.value = false;
  }
}, { immediate: true });

const showLogPanel = ref(false);
const showCodePanel = ref(false);
const showAiDrawer = ref(false);
const showVersionCompare = ref(false);
const previewBreakpoint = ref<PreviewBreakpoint>("desktop");

/** 缩放指示器右侧偏移：Property面板 300px + AI Drawer 400px */
const zoomRightOffset = computed(() => {
  let offset = 0;
  if (rightPanelVisible.value) offset += 300;
  if (showAiDrawer.value) offset += 400;
  return offset;
});

const aiBaseUrl = import.meta.env.DEV
  ? `http://localhost:${APP_CONFIGS.ai.devPort}/index-sidebar.html`
  : `${window.location.origin}${APP_CONFIGS.ai.basePath}index-sidebar.html`;

// ================================================================
// Mode
// ================================================================

const mode = computed(() => editorStore.mode);

/** Store 完整Data快照（供 code 面板展示） */
const storeSnapshot = computed(() => {
  const data = {
    board: {
      id: boardStore.id,
      name: boardStore.name,
      status: boardStore.status,
      canvas: boardStore.canvas,
    },
    widgets: widgetStore.widgets,
    editor: {
      mode: editorStore.mode,
      selectedId: editorStore.selectedId,
      isDirty: editorStore.isDirty,
    },
  };
  return JSON.stringify(data, null, 2);
});

// ================================================================
// Load schema from API
// ================================================================

const currentEditId = ref("");
const currentVersion = ref("");

onMounted(async () => {
  // 接入EventLog收集器
  const { push } = useEventLog();
  setLogCollector(push);

  const id = route.query.id as string | undefined;
  const editId = route.query.editId as string | undefined;
  const version = route.query.version as string | undefined;

  if (editId && version) {
    // 加载特定Version
    const detail = await fetchVersion(editId, version);
    if (detail) {
      loadSchemaDetail(detail);
      currentEditId.value = editId;
      currentVersion.value = version;
    }
  } else if (id) {
    const detail = await apiStore.fetchSchemaById(id);
    if (detail) {
      loadSchemaDetail(detail);
      currentEditId.value = detail.editId;
      currentVersion.value = detail.version;
    }
  }

  // Set default board name if empty
  if (!boardStore.name) {
    boardStore.name = t("editor.editorView.unnamedCanvas");
  }

  // 从实例Column表进入Hrs, 始终为Edit模式
  editorStore.setMode("edit");

  // Socket: 监听 AI 推送Event
  connectSocket();
  onAiApply(async (data: AiApplyEvent) => {
    if (data.type === "schema" && Array.isArray(data.payload)) {
      const { widgets } = parseSchemaJson(data.payload);
      // 逐个插入到当前画布, 而非替换
      for (const widget of widgets) {
        widgetStore.addWidget(widget);
      }
      ElMessage.success(
        t("editor.editorView.insertSuccess", { count: widgets.length }),
      );

      // 自动Save并生成缩略图
      await nextTick();
      await handleSave();
    }
  });
  onAiPublished((data: AiPublishedEvent) => {
    if (data.type === "schema") {
      ElMessage.success(t("editor.editorView.aiPublished"));
    }
  });

  initTelemetry();
  await nextTick();
  bindViewportListeners();
});

watch(
  () => boardStore.canvas.zoom,
  () => updateViewportRect(),
);

// ================================================================
// AI sidebar (iframe)
// ================================================================

function sendContextToAi() {
  const context = {
    type: "ai:set-context",
    payload: {
      source: "editor",
      schemaId: boardStore.id,
      editorMode: editorStore.mode,
    },
  };
  const currentSchema = {
    type: "ai:current-schema",
    payload: widgetStore.widgets,
  };
  const target = aiIframeRef.value?.contentWindow ?? window;
  target.postMessage(context, "*");
  target.postMessage(currentSchema, "*");
}

// 监听 AI iframe 就绪信号
function handleAiReady(event: MessageEvent) {
  if (event.data?.type === "ai:ready" && showAiDrawer.value) {
    sendContextToAi();
  }
}
window.addEventListener("message", handleAiReady);
onUnmounted(() => window.removeEventListener("message", handleAiReady));

// 监听 AI drawer 开关, 动态Settings iframe src
watch(showAiDrawer, async (open) => {
  if (open) {
    await nextTick();
    if (aiIframeRef.value) {
      if (!aiIframeRef.value.src) {
        // 首次加载：Settings src, 等 iframe 发 ai:ready 信号后再发上下文
        aiIframeRef.value.src = aiBaseUrl;
      } else {
        // 已加载过：直接发上下文
        sendContextToAi();
      }
    }
  }
});

// 监听 Schema 变化, 实HrsUpdate AI sidebar
watch(
  () => widgetStore.widgets,
  () => {
    if (showAiDrawer.value) {
      sendContextToAi();
    }
  },
  { deep: true },
);

// PageRefresh/Close拦截
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (editorStore.isDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
}
window.addEventListener("beforeunload", handleBeforeUnload);
onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  unbindViewportListeners();
});

// ================================================================
// Keyboard shortcuts
// ================================================================

function isEditing(e: KeyboardEvent): boolean {
  return !!(e.target as HTMLElement)?.closest(
    "input, textarea, [contenteditable]",
  );
}

function handleKeyDown(e: KeyboardEvent) {
  if (editorStore.mode !== "edit") return;
  if (isEditing(e)) return;

  if (e.key === "Delete" || e.key === "Backspace") {
    if (editorStore.selectedId) {
      track("widget.delete", { widgetId: editorStore.selectedId });
      handleDeleteWidget();
    }
  }

  // 方向键微调选中 Widget（仅自由布局，锁定 Widget 不响应）
  if (boardStore.layoutMode === "free" && editorStore.selectedId && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const widget = widgetStore.findWidget(editorStore.selectedId);
    if (widget && !widget.locked) {
      const step = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      if (e.key === "ArrowUp") { dy = -step; }
      if (e.key === "ArrowDown") { dy = step; }
      if (e.key === "ArrowLeft") { dx = -step; }
      if (e.key === "ArrowRight") { dx = step; }
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        const pos = widget.position || {};
        widgetStore.updateWidget(editorStore.selectedId, {
          position: {
            ...pos,
            x: (pos.x ?? 0) + dx,
            y: (pos.y ?? 0) + dy,
          },
        });
      }
    }
  }

  // 对齐/Min布依赖绝对坐标, 仅在自由Layout下生效；Grid 流式Layout无意义且会污染 position Data
  if (e.altKey && e.shiftKey && boardStore.layoutMode === "free") {
    const key = e.key.toLowerCase();
    if (key === "l") {
      e.preventDefault();
      align("left");
    }
    if (key === "r") {
      e.preventDefault();
      align("right");
    }
    if (key === "c") {
      e.preventDefault();
      align("center");
    }
    if (key === "h") {
      e.preventDefault();
      distribute("horizontal");
    }
    if (key === "v") {
      e.preventDefault();
      distribute("vertical");
    }
  }

  if (e.ctrlKey && e.altKey) {
    const key = e.key.toLowerCase();
    if (key === "l") {
      e.preventDefault();
      toggleLock();
    }
    if (key === "h") {
      e.preventDefault();
      toggleHidden();
    }
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      track("editor.undo");
      handleUndo();
    }
    if (e.key === "z" && e.shiftKey) {
      e.preventDefault();
      handleRedo();
    }
    if (e.key === "c") {
      e.preventDefault();
      handleCopyWidget();
    }
    if (e.key === "v") {
      e.preventDefault();
      handlePasteWidget();
    }
    if (e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+Up/Down: 同级内前移/后移（grid 流式重排为主, free 也可用）
    if (e.key === "ArrowUp") {
      e.preventDefault();
      editorStore.performMoveSelected("up");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      editorStore.performMoveSelected("down");
    }
  }
}

// ================================================================
// Context menu dialog targets — 委托给 editorStore, PropertyPanel 监听并Open弹框
// ================================================================

function handleOpenEvent(widget: Widget) {
  editorStore.openConfigDialog(widget, "events");
}
function handleOpenRule(widget: Widget) {
  editorStore.openConfigDialog(widget, "linkages");
}
function handleOpenApi(widget: Widget) {
  editorStore.openConfigDialog(widget, "api");
}
function handleOpenVariables(widget: Widget) {
  editorStore.openConfigDialog(widget, "variables");
}
function handleOpenChartLinkage(widget: Widget) {
  editorStore.openConfigDialog(widget, "chart-linkages");
}

// ================================================================
// Toolbar actions (委托给 editorStore 组合Action, 消除重复代码)
// ================================================================

function handleUndo() {
  editorStore.performUndo();
}
function handleRedo() {
  editorStore.performRedo();
}
function handleCopyWidget() {
  editorStore.performCopyWidget();
}

function handlePasteWidget() {
  const pasted = editorStore.paste();
  if (!pasted) return;
  duplicateFromClipboard(pasted);
}

function handleDeleteWidget() {
  editorStore.performDeleteWidget();
}

// ================================================================
// Save
// ================================================================

const saving = ref(false);
const publishing = ref(false);
const COOLDOWN_MS = 2000;

// Sync互斥锁, 防止快速点击穿透 Vue 响应式批量Update
let _savingLock = false;
let _publishingLock = false;

async function handleSave() {
  if (_savingLock) return;
  _savingLock = true;
  saving.value = true;
  try {
    const canvasEl = editorCanvasRef.value?.canvasRef;
    let thumbnail = "";
    if (canvasEl) {
      thumbnail = await captureElement(canvasEl);
    }

    const result = await apiStore.saveSchema(
      widgetStore.widgets,
      boardStore.name,
      boardStore.id || undefined,
      thumbnail,
      {
        canvas: boardStore.canvas,
        variables: boardStore.variables,
        events: boardStore.events,
      },
    );

    if (result) {
      boardStore.id = result.id;
      currentEditId.value = result.editId;
      currentVersion.value = result.version;
      editorStore.markClean();
      track("schema.save", { schemaId: result.id });
      ElMessage.success(t("editor.editorView.saveSuccess"));
    } else {
      ElMessage.error(apiStore.error || t("editor.editorView.saveFailed"));
    }
  } finally {
    setTimeout(() => {
      _savingLock = false;
      saving.value = false;
    }, COOLDOWN_MS);
  }
}

// ================================================================
// Save as template
// ================================================================

const showSaveTemplateDialog = ref(false);

function handleSaveCommand(command: string) {
  if (command === "save") {
    handleSave();
  } else if (command === "saveAsTemplate") {
    showSaveTemplateDialog.value = true;
  }
}

async function handlePublish() {
  if (!boardStore.id || _publishingLock) return;

  try {
    await ElMessageBox.confirm(
      t("editor.editorView.publishConfirm"),
      t("editor.editorView.publishConfirmTitle"),
      {
        confirmButtonText: t("editor.editorView.publish"),
        cancelButtonText: t("editor.editorView.cancel"),
        type: "info",
      },
    );

    _publishingLock = true;
    publishing.value = true;
    try {
      await handleSave();
      if (!boardStore.id) return;

      const result = await apiStore.publishSchema(boardStore.id);
      if (result) {
        boardStore.status = "published";
        track("schema.publish", { schemaId: boardStore.id });
        ElMessage.success(t("editor.editorView.publishSuccess"));
      } else {
        ElMessage.error(apiStore.error || t("editor.editorView.publishFailed"));
      }
    } finally {
      setTimeout(() => {
        _publishingLock = false;
        publishing.value = false;
      }, COOLDOWN_MS);
    }
  } catch {
    // UserCancel
  }
}

async function handleSavePreview(dataUrl: string) {
  if (!boardStore.id) {
    ElMessage.warning(t("editor.editorView.saveCanvasFirst"));
    return;
  }
  const result = await apiStore.updateSchema(boardStore.id, {
    thumbnail: dataUrl,
  });
  if (result) {
    ElMessage.success(t("editor.editorView.previewSaved"));
  }
}

// ================================================================
// Version management
// ================================================================

async function handleOpenVersionCompare() {
  if (!currentEditId.value) {
    ElMessage.warning(t("editor.editorView.versionHistoryHint"));
    return;
  }
  await schemaVersionStore.init(currentEditId.value, currentVersion.value);
  showVersionCompare.value = true;
}

function handleVersionLoaded(version: string) {
  currentVersion.value = version;
}

function handleVersionLoadedFromToolbar(version: string) {
  currentVersion.value = version;
}

/** Skip link: 将焦点移到画布主区域 */
function focusCanvas() {
  const el = document.getElementById("editor-canvas-main");
  if (el) {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <div :class="styles.editorView" @keydown="handleKeyDown">
    <!-- Skip link: Tab 首个焦点，跳过工具栏直达画布 -->
    <a :class="styles.skipLink" href="#editor-canvas-main" @click.prevent="focusCanvas">
      {{ t("editor.common.skipToCanvas") }}
    </a>
    <!-- Top toolbar -->
    <EditorViewToolbar
      :mode="mode"
      :current-version="currentVersion"
      :current-edit-id="currentEditId"
      :auto-save-enabled="autoSaveEnabled"
      :is-auto-saving="isAutoSaving"
      :saving="saving"
      :publishing="publishing"
      :left-panel-visible="leftPanelVisible"
      :right-panel-visible="rightPanelVisible"
      :show-ai-drawer="showAiDrawer"
      :show-log-panel="showLogPanel"
      :show-code-panel="showCodePanel"
      :preview-breakpoint="previewBreakpoint"
      @save="handleSave"
      @publish="handlePublish"
      @save-command="handleSaveCommand"
      @load-version="handleVersionLoadedFromToolbar"
      @open-version-compare="handleOpenVersionCompare"
      @toggle-auto-save="toggleAutoSave"
      @update-left-panel="leftPanelVisible = !leftPanelVisible"
      @update-right-panel="rightPanelVisible = !rightPanelVisible"
      @update-ai-drawer="showAiDrawer = !showAiDrawer"
      @update-log-panel="showLogPanel = !showLogPanel"
      @update-code-panel="showCodePanel = !showCodePanel"
      @update-preview-breakpoint="previewBreakpoint = $event"
    />

    <!-- Body: left panel + canvas + right panel -->
    <div :class="styles.body">
      <!-- Left panel -->
      <EditorViewLeftPanel
        v-if="mode === 'edit'"
        :visible="leftPanelVisible"
        :schema-status="boardStore.status"
        :schema-type="boardStore.layoutMode === 'grid' ? 'page' : 'form'"
        :schema-id="boardStore.id || null"
      />

      <!-- Center: canvas + debug panels -->
      <div :class="styles.center">
        <PageTabBar v-if="mode === 'edit'" />
        <EditorRuler
          v-if="mode === 'edit' && boardStore.layoutMode === 'free'"
          :scroll-container="canvasScrollRef"
        />
        <div id="editor-canvas-main" ref="canvasScrollRef" :class="styles.canvasScroll" tabindex="-1">
          <EditorCanvas
            ref="editorCanvasRef"
            :preview-breakpoint="previewBreakpoint"
            @open-event="handleOpenEvent"
            @open-rule="handleOpenRule"
            @open-api="handleOpenApi"
            @open-variables="handleOpenVariables"
            @open-chart-linkage="handleOpenChartLinkage"
            @save-preview="handleSavePreview"
          />
        </div>
        <!-- 缩放指示器：放在 .center 内, 无 transform 祖先, fixed 相对视口 -->
        <ZoomIndicator
          v-if="mode === 'edit' && editorStore.showZoomIndicator"
          :right-offset="zoomRightOffset"
        />
        <EventLogPanel v-if="mode !== 'edit' && showLogPanel" />

        <!-- Store Data面板（全屏覆盖） -->
        <div
          v-if="mode !== 'edit' && showCodePanel"
          :class="styles.codeOverlay"
        >
          <div :class="styles.codeHeader">
            <span :class="styles.codeTitle">{{
              t("editor.editorView.storeData")
            }}</span>
            <el-button
              type="danger"
              text
              size="small"
              @click="showCodePanel = false"
              >{{ t("editor.editorView.close") }}</el-button
            >
          </div>
          <div :class="styles.codeScroll">
            <pre :class="styles.codePre">{{ storeSnapshot }}</pre>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <EditorViewRightPanel
        v-if="mode === 'edit'"
        :visible="rightPanelVisible"
      />

      <!-- AI drawer -->
      <div
        v-if="mode === 'edit'"
        :class="[styles.aiDrawer, { [styles.aiDrawerOpen]: showAiDrawer }]"
      >
        <iframe
          ref="aiIframeRef"
          :class="styles.aiIframe"
          frameborder="0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>

    <!-- VersionCompare面板 -->
    <el-drawer
      v-model="showVersionCompare"
      :title="t('editor.editorView.versionCompare')"
      direction="rtl"
      size="560px"
      :destroy-on-close="true"
    >
      <SchemaVersionCompare
        @close="showVersionCompare = false"
        @version-loaded="handleVersionLoaded"
      />
    </el-drawer>

    <!-- Save为Template对话框 -->
    <SaveTemplateDialog
      v-model:visible="showSaveTemplateDialog"
      :widgets="widgetStore.widgets as any"
      @close="showSaveTemplateDialog = false"
      @saved="showSaveTemplateDialog = false"
    />
  </div>
</template>
