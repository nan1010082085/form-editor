<script setup lang="ts">
/**
 * EditorViewToolbar — 顶部Toolbar子Component
 *
 * 从 EditorView.vue 拆Min而来, 负责渲染整个ToolbarRegion。
 * 直接访问全局 Store 读取Status, passed emits 向父ComponentTriggerAction。
 */
import { ref, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useBoardStore, MIN_ZOOM, MAX_ZOOM } from "@/stores/board";
import { useEditorStore } from "@/stores/editor";
import { useWidgetStore } from "@/stores/widget";
import { useSchemaValidation } from "@/composables/useSchemaValidation";
import { useSchemaLoader } from "@/composables/useSchemaLoader";
import { useAppLocale } from "@/composables/useAppLocale";
import { fetchVersions, fetchVersion, deleteVersion } from "@/api/schemaApi";
import type { VersionEntry } from "@/types/api";
import type { InteractionMode } from "@/composables/useConstant";
import type { ScaleMode, PreviewBreakpoint } from "@/widgets/base/types";
import styles from "./EditorView.module.scss";

const props = defineProps<{
  mode: InteractionMode;
  currentVersion: string;
  currentEditId: string;
  autoSaveEnabled: boolean;
  isAutoSaving: boolean;
  saving: boolean;
  publishing: boolean;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  showAiDrawer: boolean;
  showLogPanel: boolean;
  showCodePanel: boolean;
  previewBreakpoint: PreviewBreakpoint;
}>();

const emit = defineEmits<{
  save: [];
  publish: [];
  saveCommand: [command: string];
  loadVersion: [version: string];
  openVersionCompare: [];
  toggleAutoSave: [];
  updateLeftPanel: [];
  updateRightPanel: [];
  updateAiDrawer: [];
  updateLogPanel: [];
  updateCodePanel: [];
  updatePreviewBreakpoint: [mode: PreviewBreakpoint];
  zoomIn: [];
  zoomOut: [];
  clearCanvas: [];
}>();

const router = useRouter();
const { t } = useI18n();
const { locale, toggleLocale } = useAppLocale();
const boardStore = useBoardStore();
const editorStore = useEditorStore();
const widgetStore = useWidgetStore();
const { loadSchemaDetail } = useSchemaLoader();
const validation = useSchemaValidation();

const langButtonLabel = computed(() =>
  locale.value === "zh-CN"
    ? t("editor.toolbar.langEn")
    : t("editor.toolbar.langZh"),
);

// ================================================================
// Canvas size
// ================================================================

const canvasSizePreset = ref("1920x1080");
const canvasSizePresets = [
  { label: "1920×1080 (Full HD)", value: "1920x1080" },
  { label: "2560×1440 (2K)", value: "2560x1440" },
  { label: "3840×2160 (4K)", value: "3840x2160" },
  { label: "1440×900", value: "1440x900" },
  { label: "1366×768", value: "1366x768" },
];
const canvasSizeMap: Record<string, { w: number; h: number }> = {
  "1920x1080": { w: 1920, h: 1080 },
  "2560x1440": { w: 2560, h: 1440 },
  "3840x2160": { w: 3840, h: 2160 },
  "1440x900": { w: 1440, h: 900 },
  "1366x768": { w: 1366, h: 768 },
};

function handleCanvasSizeChange(preset: string) {
  canvasSizePreset.value = preset;
  const size = canvasSizeMap[preset];
  if (size) boardStore.updateCanvas({ width: size.w, height: size.h });
}

const showCustomSizeDialog = ref(false);
const customWidth = ref(1920);
const customHeight = ref(1080);

function handleCustomSizeApply() {
  const w = Math.max(320, Math.min(7680, customWidth.value));
  const h = Math.max(240, Math.min(4320, customHeight.value));
  canvasSizePreset.value = `${w}x${h}`;
  boardStore.updateCanvas({ width: w, height: h });
  showCustomSizeDialog.value = false;
}

// ================================================================
// Scale mode (publish/preview 自适应模式)
// ================================================================

/** 仅自由Layout：发布页 / 预览态真实套用 useCanvasScale */
const showScaleMode = computed(() => boardStore.layoutMode === "free");

const scaleModeOptions = computed<Array<{ label: string; value: ScaleMode }>>(
  () => [
    { label: t("editor.toolbar.scaleContain"), value: "contain" },
    { label: t("editor.toolbar.scaleFitWidth"), value: "fit-width" },
    { label: t("editor.toolbar.scaleFitHeight"), value: "fit-height" },
    { label: t("editor.toolbar.scaleStretch"), value: "stretch" },
  ],
);

/**
 * @param mode - 自适应模式
 */
function handleScaleModeChange(mode: ScaleMode) {
  boardStore.updateCanvas({ scaleMode: mode });
}

// ================================================================
// Layout mode：创建Hrs由Template固定, Toolbar仅展示当前模式, 不可切换
// ================================================================

const layoutModeLabel = computed(() =>
  boardStore.layoutMode === "grid"
    ? t("editor.toolbar.layoutGrid")
    : t("editor.toolbar.layoutFree"),
);

// ================================================================
// Version management (toolbar-local state)
// ================================================================

const versionPopoverVisible = ref(false);
const versionList = ref<VersionEntry[]>([]);
const versionLoading = ref(false);
const versionPage = ref(1);
const versionTotal = ref(0);
const versionPageSize = 10;

function formatVersion(v: string): string {
  if (!v || v.length !== 14) return v;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)} ${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`;
}

async function loadVersionList(page = 1) {
  if (!props.currentEditId) return;
  versionLoading.value = true;
  versionPage.value = page;
  try {
    const res = await fetchVersions(props.currentEditId, page, versionPageSize);
    versionList.value = res.items;
    versionTotal.value = res.total ?? 0;
  } catch {
    versionList.value = [];
  } finally {
    versionLoading.value = false;
  }
}

function handleVersionPageChange(page: number) {
  loadVersionList(page);
}

async function handleLoadVersion(entry: VersionEntry) {
  if (!props.currentEditId) return;
  try {
    const detail = await fetchVersion(props.currentEditId, entry.version);
    loadSchemaDetail(detail);
    versionPopoverVisible.value = false;
    emit("loadVersion", entry.version);
    ElMessage.success(
      t("editor.instances.updateSuccess", {
        version: formatVersion(entry.version),
      }),
    );
  } catch {
    ElMessage.error(t("editor.toolbar.versionLoadFailed"));
  }
}

const deletingVersion = ref<string | null>(null);

async function handleDeleteVersion(entry: VersionEntry) {
  if (!props.currentEditId) return;
  try {
    await ElMessageBox.confirm(
      t("editor.toolbar.versionDeleteConfirm", {
        version: formatVersion(entry.version),
      }),
      t("editor.toolbar.deleteConfirm"),
      {
        confirmButtonText: t("editor.toolbar.delete"),
        cancelButtonText: t("editor.instances.cancel"),
        type: "warning",
      },
    );
  } catch {
    return;
  }
  deletingVersion.value = entry.version;
  try {
    await deleteVersion(props.currentEditId, entry.version);
    ElMessage.success(t("editor.toolbar.deleted"));
    loadVersionList(versionPage.value);
  } catch {
    ElMessage.error(t("editor.toolbar.deleteFailed"));
  } finally {
    deletingVersion.value = null;
  }
}

// ================================================================
// Toolbar-local actions (委托给 editorStore 组合Action)
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
function handleDeleteWidget() {
  editorStore.performDeleteWidget();
}

function handleZoomIn() {
  boardStore.setZoom(boardStore.canvas.zoom + 10);
}

function handleZoomOut() {
  boardStore.setZoom(boardStore.canvas.zoom - 10);
}

function handleClearCanvas() {
  widgetStore.clearWidgets();
  editorStore.clearSelection();
  editorStore.pushHistory([]);
}
</script>

<template>
  <div :class="[styles.toolbar, { [styles.toolbarPreview]: mode !== 'edit' }]">
    <!-- Left: back + name -->
    <div :class="styles.toolbarLeft">
      <button
        :class="styles.iconBtn"
        :title="t('editor.toolbar.backToList')"
        :aria-label="t('editor.toolbar.backToList')"
        @click="router.push('/instances')"
      >
        <AppIcon name="arrow-left" :size="14" />
      </button>
      <div :class="styles.divider" />
      <template v-if="mode === 'edit'">
        <input
          v-model="boardStore.name"
          :class="styles.nameInput"
          :placeholder="t('editor.toolbar.unnamedCanvas')"
        />
        <span v-if="currentVersion" :class="styles.versionBadge"
          >v{{ formatVersion(currentVersion) }}</span
        >
        <el-tooltip
          :content="
            autoSaveEnabled
              ? t('editor.toolbar.autoSaveOff')
              : t('editor.toolbar.autoSaveOn')
          "
          placement="bottom"
        >
          <button
            :class="[
              styles.iconBtn,
              styles.autoSaveToggle,
              { [styles.autoSaveToggleOn]: autoSaveEnabled },
            ]"
            :aria-label="
              autoSaveEnabled
                ? t('editor.toolbar.autoSaveOff')
                : t('editor.toolbar.autoSaveOn')
            "
            @click="emit('toggleAutoSave')"
          >
            <AppIcon name="refresh" :size="14" />
          </button>
        </el-tooltip>
        <span v-if="isAutoSaving" :class="styles.autoSaveBadge">{{
          t("editor.toolbar.autoSaving")
        }}</span>
        <span v-else-if="editorStore.isDirty" :class="styles.dirtyBadge">{{
          t("editor.toolbar.unsaved")
        }}</span>
      </template>
    </div>

    <!-- Center: panel toggles + operations + AI -->
    <div v-if="mode === 'edit'" :class="styles.toolbarCenter">
      <el-tooltip
        :content="
          leftPanelVisible
            ? t('editor.toolbar.hideWidgetPanel')
            : t('editor.toolbar.showWidgetPanel')
        "
        placement="bottom"
      >
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: leftPanelVisible },
          ]"
          :title="t('editor.toolbar.widgetPanel')"
          :aria-label="t('editor.toolbar.widgetPanel')"
          @click="emit('updateLeftPanel')"
        >
          <AppIcon name="grid" :size="14" />
        </button>
      </el-tooltip>
      <div :class="styles.btnGroup">
        <el-tooltip
          :content="t('editor.toolbar.undoTooltip')"
          placement="bottom"
        >
          <button
            :class="styles.iconBtn"
            :disabled="!editorStore.canUndo"
            :aria-label="t('editor.toolbar.undoTooltip')"
            @click="handleUndo"
          >
            <AppIcon name="back" :size="14" />
          </button>
        </el-tooltip>
        <el-tooltip
          :content="t('editor.toolbar.redoTooltip')"
          placement="bottom"
        >
          <button
            :class="styles.iconBtn"
            :disabled="!editorStore.canRedo"
            :aria-label="t('editor.toolbar.redoTooltip')"
            @click="handleRedo"
          >
            <AppIcon name="refresh" :size="14" />
          </button>
        </el-tooltip>
      </div>
      <el-tooltip
        :content="
          rightPanelVisible
            ? t('editor.toolbar.hidePropertyPanel')
            : t('editor.toolbar.showPropertyPanel')
        "
        placement="bottom"
      >
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: rightPanelVisible },
          ]"
          :title="t('editor.toolbar.propertyPanel')"
          :aria-label="t('editor.toolbar.propertyPanel')"
          @click="emit('updateRightPanel')"
        >
          <AppIcon name="setting" :size="14" />
        </button>
      </el-tooltip>
      <div :class="styles.btnGroup">
        <el-tooltip
          :content="t('editor.toolbar.copyWidget')"
          placement="bottom"
        >
          <button
            :class="styles.iconBtn"
            :disabled="!editorStore.selectedId"
            :aria-label="t('editor.toolbar.copyWidget')"
            @click="handleCopyWidget"
          >
            <AppIcon name="copy-document" :size="14" />
          </button>
        </el-tooltip>
        <el-tooltip
          :content="t('editor.toolbar.deleteWidget')"
          placement="bottom"
        >
          <button
            :class="styles.iconBtn"
            :disabled="!editorStore.selectedId"
            :aria-label="t('editor.toolbar.deleteWidget')"
            @click="handleDeleteWidget"
          >
            <AppIcon name="delete" :size="14" />
          </button>
        </el-tooltip>
      </div>
      <div :class="styles.divider" />
      <el-tooltip :content="t('editor.toolbar.aiAssistant')" placement="bottom">
        <button
          :class="[
            styles.iconBtn,
            styles.aiBtn,
            { [styles.iconBtnActive]: showAiDrawer },
          ]"
          :aria-label="t('editor.toolbar.aiAssistant')"
          @click="emit('updateAiDrawer')"
        >
          <AppIcon name="magic-stick" :size="14" />
        </button>
      </el-tooltip>
      <div :class="styles.divider" />
      <el-tooltip
        :content="
          t('editor.toolbar.layoutModeTooltip', {
            mode: layoutModeLabel,
          })
        "
        placement="bottom"
      >
        <div
          :class="[styles.iconBtn, styles.modeBadge]"
          role="status"
          :aria-label="
            t('editor.toolbar.layoutModeTooltip', {
              mode: layoutModeLabel,
            })
          "
        >
          <AppIcon
            :name="boardStore.layoutMode === 'grid' ? 'grid' : 'aim'"
            :size="14"
          />
        </div>
      </el-tooltip>
      <div :class="styles.divider" />
      <el-tooltip
        :content="
          editorStore.showZoomIndicator
            ? t('editor.toolbar.hideZoomControl')
            : t('editor.toolbar.showZoomControl')
        "
        placement="bottom"
      >
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: editorStore.showZoomIndicator },
          ]"
          :title="t('editor.toolbar.zoomControl')"
          :aria-label="t('editor.toolbar.zoomControl')"
          @click="editorStore.toggleZoomIndicator()"
        >
          <AppIcon name="aim" :size="14" />
        </button>
      </el-tooltip>
      <!-- 快捷键Help -->
      <el-popover placement="bottom" :width="300" trigger="click">
        <div :class="styles.shortcuts">
          <div :class="styles.shortcutsTitle">
            {{ t("editor.shortcuts.title") }}
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.undo")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>Z</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.redo")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.copy")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>C</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.paste")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>V</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.delete")
            }}</span>
            <span :class="styles.shortcutKeys"><kbd>Delete</kbd></span>
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.save")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>S</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.alignLeft")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>L/R/C</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.distributeH")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>H/V</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.lock")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>L/H</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.moveUp")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>↑</kbd></span
            >
          </div>
          <div :class="styles.shortcutRow">
            <span :class="styles.shortcutLabel">{{
              t("editor.shortcuts.moveDown")
            }}</span>
            <span :class="styles.shortcutKeys"
              ><kbd>Ctrl</kbd> + <kbd>↓</kbd></span
            >
          </div>
        </div>
        <template #reference>
          <button :class="styles.iconBtn" :title="t('editor.shortcuts.title')" :aria-label="t('editor.shortcuts.title')">
            <AppIcon name="question-filled" :size="14" />
          </button>
        </template>
      </el-popover>
      <div :class="styles.divider" />
      <el-tooltip :content="t('editor.toolbar.preview')" placement="bottom">
        <button
          :class="styles.iconBtn"
          :title="t('editor.toolbar.preview')"
          :aria-label="t('editor.toolbar.preview')"
          @click="editorStore.setMode('preview')"
        >
          <AppIcon name="view" :size="14" />
        </button>
      </el-tooltip>
      <el-tooltip
        :content="t('editor.toolbar.publishInteractive')"
        placement="bottom"
      >
        <button
          :class="styles.iconBtn"
          :title="t('editor.toolbar.publishInteractive')"
          :aria-label="t('editor.toolbar.publishInteractive')"
          @click="editorStore.setMode('publish-interactive')"
        >
          <AppIcon name="video-play" :size="14" />
        </button>
      </el-tooltip>
      <el-tooltip
        :content="t('editor.toolbar.publishReadonly')"
        placement="bottom"
      >
        <button
          :class="styles.iconBtn"
          :title="t('editor.toolbar.publishReadonly')"
          :aria-label="t('editor.toolbar.publishReadonly')"
          @click="editorStore.setMode('publish-readonly')"
        >
          <AppIcon name="lock" :size="14" />
        </button>
      </el-tooltip>
    </div>

    <!-- Center: non-edit modes -->
    <div v-if="mode !== 'edit'" :class="styles.toolbarCenter">
      <span :class="styles.previewLabel">
        {{
          mode === "preview"
            ? t("editor.mode.preview")
            : mode === "publish-interactive"
              ? t("editor.mode.publishInteractive")
              : t("editor.mode.publishReadonly")
        }}
      </span>
      <div :class="styles.divider" />
      <!-- 预览断点：收窄视口Width, Grid 重排 / 自由Layout套自适应缩放 -->
      <div :class="styles.breakpointSwitcher">
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: previewBreakpoint === 'desktop' },
          ]"
          :title="t('editor.toolbar.breakpointDesktop')"
          :aria-label="t('editor.toolbar.breakpointDesktop')"
          @click="emit('updatePreviewBreakpoint', 'desktop')"
        >
          <AppIcon name="monitor" :size="14" />
        </button>
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: previewBreakpoint === 'tablet' },
          ]"
          :title="t('editor.toolbar.breakpointTablet')"
          :aria-label="t('editor.toolbar.breakpointTablet')"
          @click="emit('updatePreviewBreakpoint', 'tablet')"
        >
          <AppIcon name="iphone" :size="14" />
        </button>
        <button
          :class="[
            styles.iconBtn,
            { [styles.iconBtnActive]: previewBreakpoint === 'mobile' },
          ]"
          :title="t('editor.toolbar.breakpointMobile')"
          :aria-label="t('editor.toolbar.breakpointMobile')"
          @click="emit('updatePreviewBreakpoint', 'mobile')"
        >
          <AppIcon name="cellphone" :size="14" />
        </button>
      </div>
    </div>

    <!-- Right: version + save + publish -->
    <div :class="styles.toolbarRight">
      <button
        :class="[styles.iconBtn, styles.langToggle]"
        :title="t('editor.toolbar.language')"
        :aria-label="t('editor.toolbar.language')"
        @click="toggleLocale"
      >
        <span :class="styles.langBadge">{{ langButtonLabel }}</span>
      </button>
      <div :class="styles.divider" />
      <template v-if="mode === 'edit'">
        <!-- Canvas size -->
        <el-dropdown trigger="click" @command="handleCanvasSizeChange">
          <button
            :class="styles.iconBtn"
            :title="t('editor.toolbar.canvasSize')"
            :aria-label="t('editor.toolbar.canvasSize')"
          >
            <AppIcon name="full-screen" :size="14" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="p in canvasSizePresets"
                :key="p.value"
                :command="p.value"
                >{{ p.label }}</el-dropdown-item
              >
              <el-dropdown-item
                divided
                command="custom"
                @click="showCustomSizeDialog = true"
              >
                {{ t("editor.toolbar.customSize") }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- 自适应：仅自由Layout（发布页 + 预览态真实生效） -->
        <el-dropdown
          v-if="showScaleMode"
          trigger="click"
          @command="handleScaleModeChange"
        >
          <button
            :class="styles.iconBtn"
            :title="t('editor.toolbar.scaleModeTitle')"
            :aria-label="t('editor.toolbar.scaleModeTitle')"
          >
            <AppIcon name="rank" :size="14" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in scaleModeOptions"
                :key="opt.value"
                :command="opt.value"
                :class="{
                  'is-active':
                    (boardStore.canvas.scaleMode ?? 'contain') === opt.value,
                }"
                >{{ opt.label }}</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div :class="styles.divider" />
        <!-- Zoom: ZoomIndicator 可见时隐藏 Toolbar 内缩放，避免双入口 -->
        <div v-if="!editorStore.showZoomIndicator" :class="styles.zoomGroup">
          <button
            :class="styles.iconBtn"
            :aria-label="t('editor.zoomIndicator.zoomOut')"
            :disabled="boardStore.canvas.zoom <= MIN_ZOOM"
            @click="handleZoomOut"
          >
            -
          </button>
          <span :class="styles.zoomValue">{{ boardStore.canvas.zoom }}%</span>
          <button
            :class="styles.iconBtn"
            :aria-label="t('editor.zoomIndicator.zoomIn')"
            :disabled="boardStore.canvas.zoom >= MAX_ZOOM"
            @click="handleZoomIn"
          >
            +
          </button>
        </div>
        <div :class="styles.divider" />
        <!-- Version history -->
        <el-popover
          v-model:visible="versionPopoverVisible"
          placement="bottom-end"
          :width="320"
          trigger="click"
          @show="loadVersionList()"
        >
          <div :class="styles.versionPanel">
            <div :class="styles.versionHeader">
              <span :class="styles.versionTitle">{{
                t("editor.toolbar.versionHistory")
              }}</span>
              <el-button
                size="small"
                text
                @click="loadVersionList(versionPage)"
              >
                <AppIcon name="refresh" />
              </el-button>
            </div>
            <div v-if="versionLoading" :class="styles.versionLoading">
              {{ t("editor.toolbar.loading") }}
            </div>
            <div
              v-else-if="versionList.length === 0"
              :class="styles.versionEmpty"
            >
              {{ t("editor.toolbar.noVersions") }}
            </div>
            <div v-else :class="styles.versionList">
              <div
                v-for="entry in versionList"
                :key="entry.version"
                :class="[
                  styles.versionItem,
                  {
                    [styles.versionItemCurrent]:
                      entry.version === currentVersion,
                  },
                ]"
              >
                <div :class="styles.versionInfo">
                  <span :class="styles.versionTime">{{
                    formatVersion(entry.version)
                  }}</span>
                  <div :class="styles.versionTags">
                    <el-tag
                      v-if="entry.published"
                      type="success"
                      size="small"
                      >{{ t("editor.toolbar.published") }}</el-tag
                    >
                    <el-tag
                      v-if="entry.version === currentVersion"
                      size="small"
                      >{{ t("editor.toolbar.current") }}</el-tag
                    >
                  </div>
                </div>
                <div :class="styles.versionActions">
                  <el-button
                    v-if="entry.version !== currentVersion"
                    size="small"
                    text
                    type="primary"
                    @click="handleLoadVersion(entry)"
                    >{{ t("editor.toolbar.load") }}</el-button
                  >
                  <el-button
                    v-if="entry.version !== currentVersion"
                    size="small"
                    text
                    type="danger"
                    :loading="deletingVersion === entry.version"
                    @click="handleDeleteVersion(entry)"
                    >{{ t("editor.toolbar.delete") }}</el-button
                  >
                </div>
              </div>
            </div>
            <div
              v-if="versionTotal > versionPageSize"
              :class="styles.versionPagination"
            >
              <el-pagination
                v-model:current-page="versionPage"
                :page-size="versionPageSize"
                :total="versionTotal"
                small
                layout="prev, pager, next"
                @current-change="handleVersionPageChange"
              />
            </div>
          </div>
          <template #reference>
            <button
              :class="styles.iconBtn"
              :title="t('editor.toolbar.versionHistory')"
              :aria-label="t('editor.toolbar.versionHistory')"
            >
              <AppIcon name="clock" :size="14" />
            </button>
          </template>
        </el-popover>
        <!-- Version compare -->
        <el-tooltip
          :content="t('editor.toolbar.versionCompare')"
          placement="bottom"
        >
          <button
            :class="styles.iconBtn"
            :disabled="!currentEditId"
            :title="t('editor.toolbar.versionCompare')"
            :aria-label="t('editor.toolbar.versionCompare')"
            @click="emit('openVersionCompare')"
          >
            <AppIcon name="document-copy" :size="14" />
          </button>
        </el-tooltip>
        <el-button size="small" @click="handleClearCanvas">{{
          t("editor.toolbar.clear")
        }}</el-button>
        <el-dropdown
          trigger="click"
          @command="(cmd: string) => emit('saveCommand', cmd)"
        >
          <el-button size="small" :loading="saving">
            <span v-if="saving">{{ t("editor.toolbar.saving") }}</span>
            <span v-else :class="styles.saveBtnContent">
              {{ t("editor.toolbar.save") }}
              <AppIcon name="arrow-down" :size="10" />
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="save" :class="styles.dropdownItem">
                <AppIcon name="document" :size="14" />
                <span :class="styles.dropdownLabel">{{
                  t("editor.toolbar.save")
                }}</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="saveAsTemplate"
                :class="styles.dropdownItem"
              >
                <AppIcon name="grid" :size="14" />
                <span :class="styles.dropdownLabel">{{
                  t("editor.toolbar.saveAsTemplate")
                }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          v-if="boardStore.id"
          type="primary"
          size="small"
          :loading="publishing"
          @click="emit('publish')"
        >
          {{
            publishing
              ? t("editor.toolbar.publishing")
              : t("editor.toolbar.publish")
          }}
        </el-button>
      </template>
      <template v-if="mode !== 'edit'">
        <!-- Mode switch back to edit -->
        <button
          :class="[styles.iconBtn, { [styles.iconBtnActive]: showLogPanel }]"
          :title="t('editor.toolbar.executionLog')"
          :aria-label="t('editor.toolbar.executionLog')"
          @click="emit('updateLogPanel')"
        >
          <AppIcon name="document" :size="14" />
        </button>
        <button
          :class="[styles.iconBtn, { [styles.iconBtnActive]: showCodePanel }]"
          :title="t('editor.toolbar.storeData')"
          :aria-label="t('editor.toolbar.storeData')"
          @click="emit('updateCodePanel')"
        >
          <AppIcon name="data-line" :size="14" />
        </button>
        <div :class="styles.divider" />
        <!-- Schema Validate -->
        <el-popover
          placement="bottom-end"
          :width="420"
          trigger="click"
          @before-enter="validation.runValidation()"
        >
          <template #reference>
            <button
              :class="styles.iconBtn"
              :title="t('editor.toolbar.schemaValidation')"
              :aria-label="t('editor.toolbar.schemaValidation')"
            >
              <el-badge
                v-if="validation.errorCount.value > 0"
                :value="validation.errorCount.value"
                :max="99"
                type="danger"
              >
                <AppIcon name="warning" :size="14" />
              </el-badge>
              <AppIcon v-else name="success" :size="14" />
            </button>
          </template>
          <div
            v-if="validation.issues.value.length === 0"
            style="
              text-align: center;
              padding: 20px;
              color: var(--color-success);
            "
          >
            {{ t("editor.toolbar.validationPassed") }}
          </div>
          <div v-else style="max-height: 360px; overflow-y: auto">
            <div
              style="
                padding: 0 0 8px;
                font-size: 13px;
                font-weight: 600;
                border-bottom: 1px solid var(--border-color-lighter);
                margin-bottom: 8px;
              "
            >
              {{
                t("editor.toolbar.validationSummary", {
                  errors: validation.errorCount.value,
                  warnings: validation.warningCount.value,
                })
              }}
            </div>
            <div
              v-for="(issue, idx) in validation.issues.value"
              :key="idx"
              style="
                padding: 6px 0;
                font-size: 12px;
                border-bottom: 1px solid var(--border-color-lighter);
              "
            >
              <el-tag
                :type="
                  issue.severity === 'error'
                    ? 'danger'
                    : issue.severity === 'warning'
                      ? 'warning'
                      : 'info'
                "
                size="small"
                style="margin-right: 6px"
              >
                {{ issue.severity }}
              </el-tag>
              <span style="color: var(--text-color-secondary)">{{
                issue.message
              }}</span>
            </div>
          </div>
        </el-popover>
        <div :class="styles.divider" />
        <el-button size="small" @click="editorStore.setMode('edit')">
          <AppIcon name="edit" :size="12" />
          <span>{{ t("editor.toolbar.exitPreview") }}</span>
        </el-button>
      </template>
    </div>
  </div>

  <!-- Custom canvas size dialog -->
  <el-dialog
    v-model="showCustomSizeDialog"
    :title="t('editor.toolbar.customSizeTitle')"
    width="360px"
    append-to-body
  >
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; align-items: center; gap: 12px">
        <span style="width: 40px; text-align: right; font-size: 13px">{{
          t("editor.property.width")
        }}</span>
        <el-input-number
          v-model="customWidth"
          :min="320"
          :max="7680"
          :step="10"
          size="default"
          style="flex: 1"
        />
        <span style="font-size: 12px; color: var(--text-color-secondary)"
          >px</span
        >
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <span style="width: 40px; text-align: right; font-size: 13px">{{
          t("editor.property.height")
        }}</span>
        <el-input-number
          v-model="customHeight"
          :min="240"
          :max="4320"
          :step="10"
          size="default"
          style="flex: 1"
        />
        <span style="font-size: 12px; color: var(--text-color-secondary)"
          >px</span
        >
      </div>
    </div>
    <template #footer>
      <el-button @click="showCustomSizeDialog = false">{{
        t("editor.instances.cancel")
      }}</el-button>
      <el-button type="primary" @click="handleCustomSizeApply">{{
        t("editor.common.confirm")
      }}</el-button>
    </template>
  </el-dialog>
</template>
