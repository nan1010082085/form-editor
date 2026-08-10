<script setup lang="ts">
/**
 * WidgetNode — 单个 Widget 流式渲染节点
 *
 * 与 SchemaNode（绝对定位, Edit器画布）不同, 
 * WidgetNode 使用流式Layout, 用于 WidgetRenderer（预览/发布/运RowHrs）。
 *
 * 职责：
 * - 从 registry ParseComponent并渲染
 * - ContainerComponent递归渲染 children
 * - 有 field + validationRules Hrs包裹 el-form-item
 * - dialog Container渲染为 EnhancedDialog（DefaultOpen）
 * - 拦截 DOM Event并Route到Event引擎
 * - 注入LinkageStatus控制 visible/disabled/required
 */
import { computed, inject, provide, ref, onMounted, onUnmounted } from "vue";
import type { ComputedRef, ComponentPublicInstance } from "vue";
import type {
  Widget,
  PartialWidget,
  LinkageState,
} from "../../widgets/base/types";
import type { FormData } from "./types";
import {
  widgetDataKey,
  widgetStyleKey,
  widgetRenderStateKey,
  formContextKey,
} from "../../widgets/base/types";
import {
  EVENT_CONTEXT_KEY,
  FORM_GRID_LINKAGE_KEY,
  DIALOG_REGISTRY_KEY,
  GRID_ENGINE_CONTEXT_KEY,
} from "./types";
import { getComponentMap } from "../../widgets/registry";
import { useAllContainerTypes } from "../../composables/useConstant";
import { triggerWidgetEvent } from "../../engine/eventEngine";
import { useEditorStore } from "../../stores/editor";
import { useWidgetStore } from "../../stores/widget";
import { useBoardStore } from "../../stores/board";
import { EDITOR_CONTEXTMENU_KEY } from "../Editor/editorContextKeys";
import { useGridDropZone } from "../../composables/useGridDropZone";
import { useWidgetAnimation } from "../../composables/useWidgetAnimation";
import { widthToGridSpan } from "../../utils/gridEngine";
import SchemaRender from "./SchemaRender.vue";
import WidgetErrorBoundary from "./WidgetErrorBoundary.vue";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./WidgetNode.module.scss";

const props = defineProps<{
  widget: PartialWidget;
  formData?: FormData;
  readonly?: boolean;
  /** Grid Edit模式：点击选中Widget, Disable内部交互 */
  editorSelectable?: boolean;
}>();

const compMap = getComponentMap();
const { t } = useI18n();

/** 动态获取ContainerType集合（与 SchemaNode 保持一致） */
function getContainerTypes(): Set<string> {
  return useAllContainerTypes() as Set<string>;
}

/** Form类Component（支持 change Event） */
const FORM_COMPONENT_TYPES: ReadonlySet<string> = new Set([
  "input",
  "select",
  "number",
  "radio",
  "checkbox",
  "date",
  "textarea",
  "richtext",
  "upload",
  "date-time-slot",
  "time-picker",
  "cascader",
  "switch",
  "slider",
  "rate",
  "color-picker",
  "tag-input",
  "autocomplete",
]);

/** Input类Component（支持 focus/blur Event） */
const INPUT_COMPONENT_TYPES: ReadonlySet<string> = new Set([
  "input",
  "select",
  "number",
  "textarea",
  "richtext",
]);

/** 可点击Component（支持 click Event） */
const CLICKABLE_TYPES: ReadonlySet<string> = new Set([
  "button",
  "toolbar-buttons",
  "title",
  "divider",
  "spacer",
  "banner",
]);

const isContainer = computed(() => getContainerTypes().has(props.widget.type));
const SELF_RENDERING_CONTAINER_TYPES = new Set([
  "single-col",
  "double-col",
  "triple-col",
  "quad-col",
  "row-container",
]);
const isSelfRenderingContainer = computed(() =>
  SELF_RENDERING_CONTAINER_TYPES.has(props.widget.type),
);
const resolvedComponent = computed(() => compMap[props.widget.type]);
const editorStore = useEditorStore();
const widgetStore = useWidgetStore();
const boardStore = useBoardStore();

const isSelected = computed(
  () =>
    props.editorSelectable &&
    props.widget.id != null &&
    editorStore.selectedIds.includes(props.widget.id),
);

// ---- Grid 模式Width resize handle（右边缘拖拽 → 反算 gridSpan） ----
const shellEl = ref<HTMLElement | null>(null);
const gridEngineCtx = inject(GRID_ENGINE_CONTEXT_KEY, null);
const isGridResizeEnabled = computed(() =>
  Boolean(
    props.editorSelectable &&
    props.widget.id &&
    !props.widget.locked &&
    boardStore.layoutMode === "grid",
  ),
);

function parseWidthPx(): number {
  const sw = props.widget.style?.width as string | undefined;
  if (sw && sw.endsWith("px")) return parseFloat(sw) || 0;
  // 百Min比or auto：用实际渲染Width
  return shellEl.value?.getBoundingClientRect().width ?? 0;
}

function handleGridResizeStart(event: MouseEvent) {
  if (!isGridResizeEnabled.value || !props.widget.id) return;
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startWidth = parseWidthPx();
  const widgetId = props.widget.id;
  const columns = gridEngineCtx?.columns.value ?? 12;
  const columnGap = gridEngineCtx?.columnGap.value ?? 8;
  const containerWidth =
    gridEngineCtx?.containerWidth.value ||
    shellEl.value?.parentElement?.getBoundingClientRect().width ||
    0;

  function onMove(e: MouseEvent) {
    const delta = e.clientX - startX;
    const newWidth = Math.max(40, Math.round(startWidth + delta));
    const w = widgetStore.findWidget(widgetId);
    if (!w) return;
    const span = widthToGridSpan(
      newWidth,
      columns,
      containerWidth,
      columnGap,
    );
    // 以 gridSpan 驱动Column width；width 置 100% 填满占用格
    w.gridSpan = span;
    w.style = { ...(w.style ?? {}), width: "100%" };
  }
  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    editorStore.pushHistory([...widgetStore.widgets]);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function handleEditorSelect(event: MouseEvent) {
  if (!props.editorSelectable || !props.widget.id) return;
  event.stopPropagation();
  if (event.shiftKey) {
    editorStore.toggleSelect(props.widget.id);
  } else {
    editorStore.select(props.widget.id);
  }
}

const openContextMenu = inject(EDITOR_CONTEXTMENU_KEY, null);

function handleEditorContextMenu(event: MouseEvent) {
  if (!props.editorSelectable || !props.widget.id) return;
  event.preventDefault();
  event.stopPropagation();
  editorStore.select(props.widget.id);
  openContextMenu?.(event, props.widget as Widget);
}

function handleEditorDragStart(event: DragEvent) {
  if (!props.editorSelectable || !props.widget.id) return;
  event.stopPropagation();
  event.dataTransfer?.setData(
    "application/schema-drag",
    JSON.stringify({ source: "canvas", id: props.widget.id }),
  );
  event.dataTransfer!.effectAllowed = "move";
}

// ---- Provide widget data to children ----
const widgetData = computed(() => props.widget);
provide(widgetDataKey, widgetData as ComputedRef<Widget>);
provide(
  widgetStyleKey,
  computed(() => props.widget.style ?? {}),
);

// ---- Dialog state (hidden by default, opened via event action) ----
const dialogVisible = ref(false);

// Register dialog with registry so eventContext.openDialog(target) can open it
const dialogRegistry = inject(DIALOG_REGISTRY_KEY, null);
onMounted(() => {
  if (props.widget.type === "dialog" && props.widget.id && dialogRegistry) {
    dialogRegistry.set(props.widget.id, (visible: boolean) => {
      dialogVisible.value = visible;
    });
  }
});
onUnmounted(() => {
  if (props.widget.type === "dialog" && props.widget.id && dialogRegistry) {
    dialogRegistry.delete(props.widget.id);
  }
});

// ---- Container ref (for tabs activeKey etc.) ----
const containerRef = ref<ComponentPublicInstance | null>(null);

// ---- Form context injection ----
const formCtx = inject(formContextKey, null);

const needsFormItem = computed(() => {
  if (!formCtx) return false;
  if (!props.widget.field) return false;
  return (props.widget.validationRules?.length ?? 0) > 0;
});

// ---- LinkageStatus ----
const linkageStateMap = inject(FORM_GRID_LINKAGE_KEY, null);

const DEFAULT_LINKAGE_STATE: LinkageState = {
  visible: true,
  disabled: false,
  required: false,
};

const renderState = computed(() => {
  const field = props.widget.field;
  const linkageState = field ? linkageStateMap?.value.get(field) : undefined;
  const base = linkageState ?? DEFAULT_LINKAGE_STATE;
  // hidden 静态Property覆盖：hidden=true Hrs强制不可见
  if (props.widget.hidden) {
    return { ...base, visible: false };
  }
  // disabled Property覆盖（Rule引擎动态Settings）
  if (props.widget.disabled) {
    return { ...base, disabled: true };
  }
  return base;
});

provide(widgetRenderStateKey, renderState);

// ---- Event拦截 ----
const eventCtx = inject(EVENT_CONTEXT_KEY, null);

async function handleWidgetEvent(trigger: string, _value?: unknown) {
  if (!eventCtx) return;
  await triggerWidgetEvent(props.widget as Widget, trigger, eventCtx);
}

// ---- 弹框Confirm/Cancel ----
async function handleDialogConfirm() {
  if (eventCtx) {
    await triggerWidgetEvent(
      props.widget as Widget,
      "confirm",
      eventCtx,
      "confirm",
    );
  }
  // 如果Event引擎没有Close弹框（没有 close-dialog Action）, DefaultClose
  if (dialogVisible.value) {
    dialogVisible.value = false;
  }
}

async function handleDialogCancel() {
  if (eventCtx) {
    await triggerWidgetEvent(
      props.widget as Widget,
      "cancel",
      eventCtx,
      "cancel",
    );
  }
  dialogVisible.value = false;
}
// ---- Widget 入场动画（仅预览/发布模式生效） ----
const isPreviewOrPublish = computed(() => !props.editorSelectable);

const { animationStyle } = useWidgetAnimation(
  computed(() => props.widget.style ?? {}) as ComputedRef<
    Record<string, unknown>
  >,
  isPreviewOrPublish,
);

const shellClass = computed(() => {
  if (!props.editorSelectable) return styles.passiveShell;
  return [
    styles.editorShell,
    isSelected.value ? styles.editorShellSelected : "",
  ];
});

const showDragHandle = computed(
  () =>
    Boolean(props.editorSelectable && props.widget.id && !props.widget.locked),
);

const innerClass = computed(() => {
  if (!props.editorSelectable) return styles.passiveShell;
  return styles.editorShellInner;
});

const containerDropRef = ref<HTMLElement | null>(null);
const containerDropEnabled = computed(() =>
  Boolean(props.editorSelectable && isContainer.value && props.widget.id),
);

const tabsActiveKey = computed(() => {
  if (props.widget.type !== "tabs") return null;
  const tabList = props.widget.props?.tabs as
    | Array<{ key: string }>
    | undefined;
  return (
    (props.widget.props?.activeKey as string) || tabList?.[0]?.key || "tab1"
  );
});

const gridContainerChildren = computed(() => {
  const children = (props.widget.children ?? []) as Widget[];
  // tabs Container：Edit态与预览态都按当前 activeKey Filter, 只渲染当前页签子节点
  if (props.widget.type === "tabs" && tabsActiveKey.value) {
    const ak = tabsActiveKey.value;
    return children.filter((c) => (c.tabKey ?? ak) === ak);
  }
  return children;
});

/** tabs Container按 activeKey Filter子节点, 拖放Index需Map回全量 children */
const allContainerChildren = computed(
  () => (props.widget.children ?? []) as Widget[],
);
const isTabsContainer = computed(() => props.widget.type === "tabs");

const {
  isDragOver: isContainerDragOver,
  handleDragOver: handleContainerDragOver,
  handleDragLeave: handleContainerDragLeave,
  handleDrop: handleContainerDrop,
} = useGridDropZone(
  containerDropRef,
  () => props.widget.id ?? null,
  () => gridContainerChildren.value,
  () => containerDropEnabled.value,
  undefined,
  isTabsContainer.value ? () => allContainerChildren.value : undefined,
);

const containerDropClass = computed(() => [
  styles.gridDropZone,
  isContainerDragOver.value ? styles.gridDropZoneActive : "",
]);
</script>

<template>
  <div
    v-if="renderState.visible || editorSelectable"
    ref="shellEl"
    :data-widget-id="editorSelectable ? widget.id : undefined"
    :class="[
      shellClass,
      { [styles.hiddenInEdit]: editorSelectable && props.widget.hidden },
    ]"
    :style="animationStyle || undefined"
    @click="editorSelectable ? handleEditorSelect($event) : undefined"
    @contextmenu="
      editorSelectable ? handleEditorContextMenu($event) : undefined
    "
  >
    <div
      v-if="showDragHandle"
      :class="styles.dragHandle"
      draggable="true"
      :title="t('editor.canvas.dragReorder')"
      @click.stop
      @dragstart.stop="handleEditorDragStart($event)"
    >
      <AppIcon name="rank" :size="12" />
    </div>
    <div
      v-if="isGridResizeEnabled"
      :class="styles.gridResizeHandle"
      @mousedown="handleGridResizeStart"
    />
    <div :class="innerClass">
      <template v-if="widget.type === 'dialog'">
        <!-- Grid Edit模式：可见Container shell, 可选中/拖入子节点。
             AppDialog Default v-model=false invisible, cannot support edit interaction, edit mode uses static shell. -->
        <div v-if="editorSelectable" :class="styles.dialogEditShell">
          <div :class="styles.dialogEditHeader">
            <AppIcon name="chat-dot-round" :size="14" />
            <span :class="styles.dialogEditTitle">{{
              (widget.props?.title as string) || widget.label || t('editor.dialog.fallbackTitle')
            }}</span>
          </div>
          <div
            ref="containerDropRef"
            :class="containerDropClass"
            @dragover="handleContainerDragOver"
            @dragleave="handleContainerDragLeave"
            @drop="handleContainerDrop"
          >
            <SchemaRender
              v-for="(child, ci) in gridContainerChildren"
              :key="ci"
              :schema="child"
              :form-data="formData"
              :readonly="readonly"
              :editor-selectable="editorSelectable"
            />
            <div
              v-if="!gridContainerChildren.length"
              :class="styles.gridDropEmpty"
            >
              {{ t('editor.canvas.dragWidgetToDialog') }}
            </div>
          </div>
        </div>
        <!-- 预览/运RowHrs：AppDialog DefaultHide, passedEvent openDialog Open -->
        <AppDialog
          v-else
          v-model="dialogVisible"
          :title="(widget.props?.title as string) || widget.label || t('editor.dialog.fallbackTitle')"
          :width="(widget.props?.width as string) || '600px'"
          :draggable="widget.props?.draggable !== false"
          :show-fullscreen-btn="widget.props?.showFullscreenBtn !== false"
          :destroy-on-close="widget.props?.destroyOnClose !== false"
          :close-on-click-modal="widget.props?.closeOnClickModal === true"
        >
          <template v-if="widget.children?.length">
            <SchemaRender
              v-for="(child, ci) in widget.children"
              :key="ci"
              :schema="child"
              :form-data="formData"
              :readonly="readonly"
              :editor-selectable="editorSelectable"
            />
          </template>
          <template v-if="widget.props?.showFooter !== false" #footer>
            <el-button @click="handleDialogCancel">
              {{ (widget.props?.cancelText as string) || t('editor.dialog.cancel') }}
            </el-button>
            <el-button type="primary" @click="handleDialogConfirm">
              {{ (widget.props?.confirmText as string) || t('editor.dialog.confirm') }}
            </el-button>
          </template>
        </AppDialog>
      </template>

      <WidgetErrorBoundary
        v-else-if="isContainer && resolvedComponent"
        :widget-type="widget.type"
        :widget-id="widget.id"
      >
        <component
          :ref="
            (el: ComponentPublicInstance | null) => {
              containerRef = el;
            }
          "
          :is="resolvedComponent"
          :widget="widget"
          :editable="false"
          :editor-selectable="editorSelectable"
          :render-children="widget.type === 'tabs'"
        >
          <div
            v-if="editorSelectable && !isSelfRenderingContainer"
            ref="containerDropRef"
            :class="containerDropClass"
            @dragover="handleContainerDragOver"
            @dragleave="handleContainerDragLeave"
            @drop="handleContainerDrop"
          >
            <SchemaRender
              v-for="(child, ci) in gridContainerChildren"
              :key="ci"
              :schema="child"
              :form-data="formData"
              :readonly="readonly"
              :editor-selectable="editorSelectable"
            />
            <div
              v-if="!gridContainerChildren.length"
              :class="styles.gridDropEmpty"
            >
              {{ widget.type === "tabs" ? t('editor.canvas.dragWidgetToTab') : t('editor.canvas.dragWidget') }}
            </div>
          </div>
          <!-- 自渲染Container（col / row-container）：子节点由Component自身渲染, 不向 slot 填充避免重复创建 -->
          <template
            v-else-if="
              !isSelfRenderingContainer && gridContainerChildren.length
            "
          >
            <SchemaRender
              v-for="(child, ci) in gridContainerChildren"
              :key="ci"
              :schema="child"
              :form-data="formData"
              :readonly="readonly"
              :editor-selectable="editorSelectable"
            />
          </template>
        </component>
      </WidgetErrorBoundary>

      <el-form-item
        v-else-if="needsFormItem"
        :label="widget.label"
        :prop="widget.field"
        @change="
          FORM_COMPONENT_TYPES.has(widget.type) &&
          handleWidgetEvent('change', $event)
        "
        @focus="
          INPUT_COMPONENT_TYPES.has(widget.type) && handleWidgetEvent('focus')
        "
        @blur="
          INPUT_COMPONENT_TYPES.has(widget.type) && handleWidgetEvent('blur')
        "
        @click="CLICKABLE_TYPES.has(widget.type) && handleWidgetEvent('click')"
      >
        <WidgetErrorBoundary
          v-if="resolvedComponent"
          :widget-type="widget.type"
          :widget-id="widget.id"
        >
          <component :is="resolvedComponent" :widget="widget" />
        </WidgetErrorBoundary>
      </el-form-item>

      <div
        v-else-if="resolvedComponent"
        @change="
          FORM_COMPONENT_TYPES.has(widget.type) &&
          handleWidgetEvent('change', $event)
        "
        @focus.capture="
          INPUT_COMPONENT_TYPES.has(widget.type) && handleWidgetEvent('focus')
        "
        @blur.capture="
          INPUT_COMPONENT_TYPES.has(widget.type) && handleWidgetEvent('blur')
        "
        @click="CLICKABLE_TYPES.has(widget.type) && handleWidgetEvent('click')"
      >
        <WidgetErrorBoundary :widget-type="widget.type" :widget-id="widget.id">
          <component :is="resolvedComponent" :widget="widget" />
        </WidgetErrorBoundary>
      </div>
    </div>
  </div>
</template>
