<script setup lang="ts">
/**
 * SchemaNode — 单个 Widget 渲染节点
 *
 * SchemaRender 的内部实现细节。每个 SchemaNode 实例
 * 独立调用 provide, 确保 Vue provide 作用域正确隔离。
 *
 * 职责：
 * - provide 当前 Widget 的 data 和 style 给子Component
 * - 判断是否ContainerComponent, 渲染Component + 递归 children
 * - 位置passed position: absolute + left/top 定位
 *
 * 性能优化：
 * - 注入共享的 linkageStateMap（由 EditorCanvas/WidgetRenderer 提供）, 
 *   避免每个 SchemaNode 独立创建 useLinkage 实例
 * - 使用Cache的ComponentMap表
 */
import {
  computed,
  inject,
  provide,
  ref,
  onMounted,
  onUnmounted,
  type ComputedRef,
  type ComponentPublicInstance,
} from "vue";
import {
  widgetDataKey,
  widgetStyleKey,
  widgetRenderStateKey,
  formContextKey,
  widgetBoundsKey,
  parentBoundsKey,
  type WidgetBounds,
} from "../../widgets/base/types";
import type {
  Widget,
  SchemaType,
  LinkageState,
  PreviewBreakpoint,
} from "../../widgets/base/types";
import type { FormData, EventExecutionContext } from "./types";
import {
  EVENT_CONTEXT_KEY,
  DIALOG_REGISTRY_KEY,
  FORM_GRID_LINKAGE_KEY,
  FORM_GRID_FORM_KEY,
  PREVIEW_BREAKPOINT_KEY,
  FORM_GRID_T_KEY,
} from "./types";
import { useResponsivePosition } from "../../composables/useResponsivePosition";
import { getComponentMap } from "../../widgets/registry";
import { useWidgetStore } from "../../stores/widget";
import { useEditorStore } from "../../stores/editor";
import { useBoardStore } from "../../stores/board";
import { triggerWidgetEvent } from "../../engine/eventEngine";
import { useLogger } from "../../composables/useLogger";
import { useWidgetAnimation } from "../../composables/useWidgetAnimation";
import SchemaRender from "./SchemaRender.vue";
import WidgetErrorBoundary from "./WidgetErrorBoundary.vue";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import styles from "./SchemaNode.module.scss";

const props = defineProps<{
  widget: Widget;
  mode?: "edit" | "preview";
  canvasOffsetX?: number;
  canvasOffsetY?: number;
}>();

/** ComponentMap表 — CacheVersion, 避免每次 mount 创建新对象 */
const compMap = getComponentMap();

import { useAllContainerTypes } from "../../composables/useConstant";

/** 获取ContainerComponentType集合（动态） */
function getContainerTypes() {
  return useAllContainerTypes();
}

/**
 * 自渲染Container：Component内部自己渲染 children（passed SchemaRender + inject）, 
 * SchemaNode 不需要再渲染 childrenLayer, 否则子Component会重复出现。
 *
 * 所有Container统一由 childrenLayer（absolute 定位）渲染子Component, 
 * 保证 overlay 坐标系与渲染坐标系一致。
 */
const SELF_RENDERING_CONTAINERS: ReadonlySet<SchemaType> = new Set([
  "single-col",
  "double-col",
  "triple-col",
  "quad-col",
  "tree-layout",
]);

/**
 * 交互式Container：内部有可交互 UI（tab headers、dialog body）, 
 * 需要 pointer-events:auto 让点击穿透 hitArea 到达实际 UI。
 * 选中逻辑由 wrapper @click 处理, 而非 hitArea。
 */
const INTERACTIVE_CONTAINER_TYPES: ReadonlySet<SchemaType> = new Set([
  "tabs",
  "dialog",
]);

// ---- ComponentType集合 ----

/** Form类Component（支持 change Event） */
const FORM_COMPONENT_TYPES: ReadonlySet<SchemaType> = new Set([
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
  "switch",
  "slider",
  "rate",
  "cascader",
  "color-picker",
  "time-picker",
]);

/** Input类Component（支持 focus/blur Event） */
const INPUT_COMPONENT_TYPES: ReadonlySet<SchemaType> = new Set([
  "input",
  "select",
  "number",
  "textarea",
  "richtext",
]);

/** 可点击Component（支持 click Event） */
const CLICKABLE_TYPES: ReadonlySet<SchemaType> = new Set([
  "button",
  "title",
  "divider",
  "spacer",
  "banner",
]);

const logger = useLogger("SchemaNode");

// ---- Provide/Inject ----

/** Provide 当前 Widget Data给子Component */
const widgetData = computed(() => props.widget);
provide(widgetDataKey, widgetData as ComputedRef<Widget>);

/** Provide 当前 Widget StyleConfig */
const widgetStyle = computed(() => props.widget.style ?? {});
provide(widgetStyleKey, widgetStyle as ComputedRef<Record<string, unknown>>);

// ---- 渲染逻辑 ----

/** 是否Edit模式 */
const isEditMode = computed(() => props.mode === "edit");

/** 是否ContainerComponent */
const isContainer = computed(() => getContainerTypes().has(props.widget.type));

/** 是否自渲染Container（内部已渲染 children, 无需 childrenLayer） */
const isSelfRendering = computed(() =>
  SELF_RENDERING_CONTAINERS.has(props.widget.type),
);

/** ParseComponent */
const resolvedComponent = computed(() => compMap[props.widget.type]);

// ---- Tabs activeKey 支持 ----

/** tabs ContainerComponent ref, 用于读取 activeKey */
const containerRef = ref<ComponentPublicInstance | null>(null);

/** 当前 tabs Container的 activeKey（仅 tabs ContainerValid） */
const activeTabKey = computed(() => {
  if (props.widget.type !== "tabs") return null;
  const instance = containerRef.value as Record<string, unknown> | null;
  if (!instance) return null;
  // activeKey is exposed via defineExpose on FgTabs
  return (
    (instance as { activeKey?: { value?: string } })?.activeKey?.value ?? null
  );
});

/** Filter后的子WidgetColumn表：tabs Container按 tabKey Filter, 其他Container全量 */
const filteredChildren = computed(() => {
  if (!props.widget.children?.length) return [];
  if (props.widget.type !== "tabs" || activeTabKey.value === null)
    return props.widget.children;
  return props.widget.children.filter(
    (c) => (c as { tabKey?: string }).tabKey === activeTabKey.value,
  );
});

// ---- Rule引擎 ----

const widgetStore = useWidgetStore();
const editorStore = useEditorStore();
const boardStore = useBoardStore();

/** 父Container像素尺寸（嵌套Widget % 换算基准, 根级默认为画布） */
const parentBounds = inject(
  parentBoundsKey,
  computed<WidgetBounds>(() => ({
    widthPx: boardStore.getCanvasWidthPx(),
    heightPx: boardStore.getCanvasHeightPx(),
  })),
);

/** 当前WidgetParse尺寸 — 与 EditorOverlay hitArea 算法一致 */
const resolvedBounds = computed<WidgetBounds>(() => {
  const pos = resolvedPosition.value;
  const parentW = parentBounds.value.widthPx;
  const parentH = parentBounds.value.heightPx;
  const w = pos.wUnit === "%" ? (parentW * pos.w) / 100 : pos.w;
  const h = pos.hUnit === "%" ? (parentH * pos.h) / 100 : pos.h;
  return { widthPx: w, heightPx: h };
});

provide(widgetBoundsKey, resolvedBounds);
provide(parentBoundsKey, resolvedBounds);

/** 交互式Container空白Region点击 → 选中Container */
function handleInteractiveContainerClick() {
  editorStore.select(props.widget.id);
}

// ---- 预览模式：Dialog注册 + Event拦截 ----

/** Dialog注册表（从 EditorCanvas 或 WidgetRenderer 注入） */
const dialogRegistry = inject(DIALOG_REGISTRY_KEY, null);

/** dialog Type的可见性（预览模式下默认Hide, passedEventOpen） */
const dialogVisible = ref(false);

/** 注册/注销 dialog 到注册表 */
onMounted(() => {
  if (
    !isEditMode.value &&
    props.widget.type === "dialog" &&
    props.widget.id &&
    dialogRegistry
  ) {
    dialogRegistry.set(props.widget.id, (visible: boolean) => {
      dialogVisible.value = visible;
    });
  }
});
onUnmounted(() => {
  if (
    !isEditMode.value &&
    props.widget.type === "dialog" &&
    props.widget.id &&
    dialogRegistry
  ) {
    dialogRegistry.delete(props.widget.id);
  }
});

/** 翻译函数（从 WidgetRenderer 注入） */
const t = inject(FORM_GRID_T_KEY, (key: string) => key);

/** Event执Row上下文（预览模式从 EditorCanvas/WidgetRenderer 注入） */
const eventCtx = inject(EVENT_CONTEXT_KEY, null);

/** 响应式断点（预览/发布模式从 EditorCanvas 注入） */
const previewBreakpoint = inject(
  PREVIEW_BREAKPOINT_KEY,
  ref<PreviewBreakpoint>("desktop"),
);

/** 响应式位置Parse */
const widgetRef = computed(() => props.widget);
const { resolvedPosition } = useResponsivePosition({
  widget: widgetRef,
  breakpoint: previewBreakpoint,
  isPreviewMode: computed(() => !isEditMode.value),
});

/** 顶层 formData（absolute LayoutLinkage/SubmitAggregate） */
const formGridData = inject(FORM_GRID_FORM_KEY, null);

/** 预览模式统一EventTrigger */
async function handlePreviewEvent(trigger: string, _value?: unknown) {
  if (trigger === "change" && props.widget.field && formGridData) {
    formGridData[props.widget.field] = props.widget
      .defaultValue as FormData[string];
  }
  if (!eventCtx) return;
  await triggerWidgetEvent(props.widget, trigger, eventCtx);
}

/** 构建Edit器模式的Event执Row上下文（Edit器仅做Config验证, 不实际执Row复杂逻辑） */
function buildEditorEventContext(): EventExecutionContext {
  return {
    findWidget: (id: string) =>
      widgetStore.findWidget(id) as Widget | undefined,
    updateWidget: (id: string, patch: Partial<Widget>) =>
      widgetStore.updateWidget(id, patch),
    openDialog: (target: string) => editorStore.openDialogEditor(target),
    closeDialog: () => editorStore.closeDialogEditor(),
    submitForm: () => {
      const form = widgetStore.widgets.find((w: Widget) => w.type === "form");
      if (form)
        logger.event("Form submit:", widgetStore.collectFormValues(form.id));
    },
    resetForm: () => {
      const form = widgetStore.widgets.find((w: Widget) => w.type === "form");
      if (form?.children) {
        for (const child of form.children) {
          if (child.field)
            widgetStore.updateWidget(child.id, {
              defaultValue: child.defaultValue,
            });
        }
      }
    },
    getFormData: () => formData.value,
    emit: (eventName: string, payload?: unknown) =>
      logger.event("Emit:", eventName, payload),
    confirm: (_message: string) => Promise.resolve(),
    variables: {},
    setVariable: () => {},
    getVariable: () => undefined,
    exposed: {},
    triggerEvent: () => {},
  };
}

/** 统一EventTrigger：由 SchemaNode 拦截并Min发, Widget无需自Row调用 */
async function handleWidgetEvent(trigger: string, _value?: unknown) {
  logger.debug(`trigger=${trigger}`, props.widget.id);
  await triggerWidgetEvent(props.widget, trigger, buildEditorEventContext());
}

/**
 * 当前Form上下文的Value集合（Edit模式仅用于Event引擎DebugLog）。
 * 延迟计算：仅在EventTriggerHrs按需收集, 避免每次渲染都 O(n) 遍历。
 */
const formData = computed<FormData>(() => {
  const formId = props.widget.formId;
  if (!formId) return {};
  return widgetStore.collectFormValues(formId) as FormData;
});

// formData 在Edit模式下仅供 buildEditorEventContext 使用, 
// passed lazy computed 避免在 render 路径中Trigger

/**
 * Rule引擎Output：visible / disabled / required。
 *
 * 性能优化：从父级注入共享的 linkageStateMap（由 EditorCanvas 或 WidgetRenderer 提供）, 
 * 而非每个 SchemaNode 独立创建 useLinkage 实例。
 * widget.hidden / widget.disabled 作为静态Property覆盖（优先于LinkageStatus）。
 */
const DEFAULT_LINKAGE_STATE: LinkageState = {
  visible: true,
  disabled: false,
  required: false,
};
const linkageStateMap = inject(FORM_GRID_LINKAGE_KEY, null);

const renderState = computed(() => {
  const field = props.widget.field;
  const linkageState = field ? linkageStateMap?.value.get(field) : undefined;
  const base = linkageState ?? DEFAULT_LINKAGE_STATE;
  // hidden 静态Property覆盖：hidden=true Hrs强制不可见
  if (props.widget.hidden) {
    return { ...base, visible: false };
  }
  // 响应式断点Hide：当前断点Config了 hidden=true
  if (resolvedPosition.value.hidden) {
    return { ...base, visible: false };
  }
  // disabled Property覆盖（Rule引擎动态Settings）
  if (props.widget.disabled) {
    return { ...base, disabled: true };
  }
  return base;
});

provide(widgetRenderStateKey, renderState);

// ---- FormValidate ----

/** 注入Form上下文（仅在 FgForm 内部Hrs有Value） */
const formCtx = inject(formContextKey, null);

/** 当前 base Component是否需要包裹 el-form-item（有 field + validationRules 且在Form内） */
const needsFormItem = computed(() => {
  if (!formCtx) return false;
  if (!props.widget.field) return false;
  return (props.widget.validationRules?.length ?? 0) > 0;
});

/**
 * 位置Style：position: absolute + left/top（不用 transform）
 * 合并 widget.style 中的 CSS Property（Border、Border radius、内Margin、Background、对齐等）
 */
const CSS_STYLE_KEYS: ReadonlySet<string> = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "backgroundColor",
  "boxShadow",
  "opacity",
  "fontSize",
  "fontWeight",
  "color",
  "textAlign",
]);

const isPreviewOrPublish = computed(() => !isEditMode.value);

const { animationStyle } = useWidgetAnimation(
  widgetStyle as ComputedRef<Record<string, unknown>>,
  isPreviewOrPublish,
);

const wrapperStyle = computed(() => {
  const pos = resolvedPosition.value;
  const style: Record<string, string | number> = {
    position: "absolute",
    left: `${pos.x}${pos.xUnit}`,
    top: `${pos.y}${pos.yUnit}`,
    width: `${pos.w}${pos.wUnit}`,
    height: `${pos.h}${pos.hUnit}`,
  };
  if (pos.zIndex !== undefined) {
    style.zIndex = pos.zIndex;
  }
  // 合并 widget.style 中的 CSS Property到 wrapper
  const ws = props.widget.style;
  if (ws) {
    for (const key of CSS_STYLE_KEYS) {
      const val = (ws as Record<string, unknown>)[key];
      if (val !== undefined && val !== "") {
        style[key] = val as string | number;
      }
    }
  }
  return style;
});
</script>

<template>
  <!-- Rule引擎控制可见性 -->
  <template v-if="renderState.visible">
    <!-- Dialog Container：Edit模式=shell+childrenLayer, 预览模式=EnhancedDialog -->
    <template v-if="widget.type === 'dialog'">
      <!-- Edit模式：Container shell + 子Widget层 -->
      <div
        v-if="isEditMode"
        :data-widget-id="widget.id"
        :class="[
          styles.nodeWrapper,
          styles.nodeWrapperContainer,
          styles.nodeWrapperEdit,
          styles.interactiveContainer,
        ]"
        :style="wrapperStyle"
        @click.stop="handleInteractiveContainerClick()"
      >
        <component
          v-if="resolvedComponent"
          :ref="
            (el: ComponentPublicInstance | null) => {
              containerRef = el;
            }
          "
          :is="resolvedComponent"
          :widget="widget"
          :editable="true"
        />
        <div v-if="filteredChildren.length" :class="styles.childrenLayer">
          <SchemaRender
            :widgets="filteredChildren"
            :mode="mode"
            :canvas-offset-x="(canvasOffsetX ?? 0) + resolvedPosition.x"
            :canvas-offset-y="(canvasOffsetY ?? 0) + resolvedPosition.y"
          />
        </div>
      </div>

      <!-- 预览模式：EnhancedDialog（默认Hide, passedEventOpen） -->
      <AppDialog
        v-else
        v-model="dialogVisible"
        :title="
          (widget.props?.title as string) ||
          widget.label ||
          t('dialog.defaultTitle')
        "
        :width="(widget.props?.width as string) || '600px'"
        :draggable="widget.props?.draggable !== false"
        :show-fullscreen-btn="widget.props?.showFullscreenBtn !== false"
        :destroy-on-close="widget.props?.destroyOnClose !== false"
        :close-on-click-modal="widget.props?.closeOnClickModal === true"
      >
        <!-- 流式Layout渲染子Widget（与 WidgetNode 一致） -->
        <template v-if="filteredChildren.length">
          <SchemaRender
            v-for="(child, ci) in filteredChildren"
            :key="ci"
            :schema="child"
          />
        </template>
        <template v-if="widget.props?.showFooter !== false" #footer>
          <el-button @click="dialogVisible = false">
            {{ (widget.props?.cancelText as string) || t("dialog.cancel") }}
          </el-button>
          <el-button type="primary" @click="dialogVisible = false">
            {{ (widget.props?.confirmText as string) || t("dialog.confirm") }}
          </el-button>
        </template>
      </AppDialog>
    </template>

    <!-- 其他ContainerComponent：Container渲染 + 独立子Widget层 -->
    <div
      v-else-if="isContainer"
      :data-widget-id="widget.id"
      :class="[
        styles.nodeWrapper,
        styles.nodeWrapperContainer,
        {
          [styles.nodeWrapperEdit]: isEditMode,
          [styles.interactiveContainer]: INTERACTIVE_CONTAINER_TYPES.has(
            widget.type,
          ),
        },
      ]"
      :style="[wrapperStyle, animationStyle]"
      @click.stop="
        INTERACTIVE_CONTAINER_TYPES.has(widget.type) &&
        handleInteractiveContainerClick()
      "
    >
      <!-- ContainerComponent自身渲染（Card Title、Form包裹等） -->
      <WidgetErrorBoundary
        v-if="resolvedComponent"
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
          :editable="isEditMode"
        >
          <!-- form Container：子Widget必须在 el-form 内才能参与Validate -->
          <div
            v-if="widget.type === 'form' && filteredChildren.length"
            :class="styles.childrenLayer"
          >
            <SchemaRender
              :widgets="filteredChildren"
              :mode="mode"
              :canvas-offset-x="(canvasOffsetX ?? 0) + resolvedPosition.x"
              :canvas-offset-y="(canvasOffsetY ?? 0) + resolvedPosition.y"
            />
          </div>
          <!-- flex-zone: Flex 流式渲染 children（Free canvas 内的 Flex 子Region） -->
          <template v-if="widget.type === 'flex-zone' && filteredChildren.length">
            <SchemaRender
              v-for="(child, ci) in filteredChildren"
              :key="ci"
              :schema="child"
            />
          </template>
        </component>
      </WidgetErrorBoundary>
      <!-- 非 form Container：子Widget层绝对定位（排除 flex-zone, 已在上方 Flex 渲染） -->
      <div
        v-if="
          filteredChildren.length && !isSelfRendering && widget.type !== 'form' && widget.type !== 'flex-zone'
        "
        :class="styles.childrenLayer"
      >
        <SchemaRender :widgets="filteredChildren" :mode="mode" />
      </div>
    </div>

    <!-- 基础Component：直接渲染 -->
    <!-- Edit模式：SchemaNode 拦截所有 DOM EventMin发到Event引擎 -->
    <!-- 预览模式：change/focus/blur 仍由 wrapper 拦截（FormComponent不自RowTrigger）, click 由Component自Row处理（避免与 FgButton 内部 handler 重复） -->
    <div
      v-else
      :data-widget-id="widget.id"
      :class="[
        styles.nodeWrapper,
        styles.nodeWrapperBase,
        { [styles.nodeWrapperEdit]: isEditMode },
      ]"
      :style="[wrapperStyle, animationStyle]"
      @change="
        FORM_COMPONENT_TYPES.has(widget.type) &&
        (isEditMode
          ? handleWidgetEvent('change', $event)
          : handlePreviewEvent('change', $event))
      "
      @focus="
        INPUT_COMPONENT_TYPES.has(widget.type) &&
        (isEditMode ? handleWidgetEvent('focus') : handlePreviewEvent('focus'))
      "
      @blur="
        INPUT_COMPONENT_TYPES.has(widget.type) &&
        (isEditMode ? handleWidgetEvent('blur') : handlePreviewEvent('blur'))
      "
      @click="
        isEditMode &&
        CLICKABLE_TYPES.has(widget.type) &&
        handleWidgetEvent('click')
      "
    >
      <!-- FormValidate：有 field + validationRules Hrs包裹 el-form-item -->
      <el-form-item
        v-if="needsFormItem"
        :label="widget.label"
        :prop="widget.field"
        :rules="widget.validationRules"
      >
        <WidgetErrorBoundary
          v-if="resolvedComponent"
          :widget-type="widget.type"
          :widget-id="widget.id"
        >
          <component :is="resolvedComponent" :widget="widget" />
        </WidgetErrorBoundary>
      </el-form-item>
      <WidgetErrorBoundary
        v-else-if="resolvedComponent"
        :widget-type="widget.type"
        :widget-id="widget.id"
      >
        <component :is="resolvedComponent" :widget="widget" />
      </WidgetErrorBoundary>
    </div>
  </template>
</template>
