<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import SchemaRender from "./SchemaRender.vue";
import type { Widget, PreviewBreakpoint } from "../../widgets/base/types";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
// FgDialog import removed — internal dialog rendered inline below
import type { PartialWidget } from "../../widgets/base/types";
import type {
  FormGridContext,
  FormData,
  FormFieldValue,
  SchemaAction,
  FormGridProps,
  LoadApiConfig,
  FormGridLocale,
} from "./types";
import {
  FORM_GRID_CONTEXT_KEY,
  FORM_GRID_FORM_KEY,
  FORM_GRID_API_KEY,
  ACTION_EMIT_KEY,
  FORM_GRID_LINKAGE_KEY,
  FORM_GRID_T_KEY,
  FORM_GRID_READONLY_KEY,
  FORM_GRID_READONLY_FIELDS_KEY,
  FORM_GRID_EDITABLE_FIELDS_KEY,
  EVENT_CONTEXT_KEY,
  DIALOG_REGISTRY_KEY,
  FORM_REGISTRY_KEY,
  GRID_ENGINE_CONTEXT_KEY,
  PREVIEW_BREAKPOINT_KEY,
} from "./types";
import type { DialogRegistry, FormRegistry, GridEngineContext } from "./types";
import type { EventExecutionContext } from "./types";
import { useLinkage } from "@/composables/useLinkage";
import { useFormData } from "@/composables/useFormData";
import { useLifecycle } from "@/composables/useLifecycle";
import { useLocale } from "@/composables/useLocale";
import { useLogger } from "@/composables/useLogger";
import { useGridEngine } from "@/composables/useGridEngine";
import { WIDGET_SURFACE_KEY } from "@/widgets/base/widgetMock";
import { fetchRuntimeUrl } from "@/api/runtimeApi";
import { triggerWidgetEvent } from "@/engine/eventEngine";
import {
  collectSchemaFormData,
  applySchemaFormData,
  validateSchemaFields,
} from "@/utils/schemaFormData";
import styles from "./style.module.scss";

const logger = useLogger("WidgetRenderer");

/** Element Plus Language包Map */
const epLocaleMap: Record<FormGridLocale, typeof zhCn> = {
  "zh-CN": zhCn,
  "en-US": en,
};

const props = defineProps<
  FormGridProps & {
    /** Edit器模式：EnableContainer拖放Region（Sprint 11） */
    editable?: boolean;
    /** 是否正在拖拽中（Sprint 11） */
    isDragging?: boolean;
    /** 只读模式：Disable所有FormInput, Hide内部Button（文件Column表保留） */
    readonly?: boolean;
    /** partial 模式下只读的FieldColumn表 */
    readonlyFields?: string[];
    /** partial 模式下可Edit的FieldColumn表（与 readonlyFields 二选一） */
    editableFields?: string[];
    /** Grid Edit模式：点击选中Widget */
    editorSelectable?: boolean;
    /** 预览断点（发布态自适应用, Default desktop） */
    previewBreakpoint?: PreviewBreakpoint;
  }
>();

const isAbsoluteLayout = computed(() => props.layout === "absolute");

const {
  templateColumns: gridTemplateColumns,
  gap: gridGap,
  columns: gridColumns,
  containerWidth: gridContainerWidth,
  getChildGridColumn,
  connect: connectGrid,
  disconnect: disconnectGrid,
} = useGridEngine(
  () => props.canvasConfig?.gridLayout,
  () => (props.schema ?? []) as Widget[],
);

const gridColumnGap = computed(
  () => props.canvasConfig?.gridLayout?.columnGap ?? 8,
);

provide(GRID_ENGINE_CONTEXT_KEY, {
  columns: gridColumns,
  columnGap: gridColumnGap,
  containerWidth: gridContainerWidth,
} satisfies GridEngineContext);

const flowContainerStyle = computed(() => ({
  width: "100%",
  minHeight: "100%",
  display: "grid",
  gridTemplateColumns: gridTemplateColumns.value || "1fr",
  gap: gridGap.value,
  boxSizing: "border-box" as const,
}));

/** 绝对定位模式下, 计算ContainerStyle（画布尺寸 + Background + 包围盒） */
const absoluteContainerStyle = computed(() => {
  if (!isAbsoluteLayout.value) return undefined;
  const cc = props.canvasConfig;
  const wUnit = cc?.widthUnit ?? "px";
  const hUnit = cc?.heightUnit ?? "px";
  const canvasWidth = cc?.width ?? 1920;
  const canvasHeight = cc?.height ?? 1080;
  let maxRight = 0;
  let maxBottom = 0;
  function walk(items: PartialWidget[]) {
    for (const item of items) {
      const pos = item.position;
      if (pos) {
        const pwUnit = pos.wUnit ?? "px";
        const phUnit = pos.hUnit ?? "px";
        const w = pwUnit === "%" ? (canvasWidth * pos.w) / 100 : (pos.w ?? 0);
        const h = phUnit === "%" ? (canvasHeight * pos.h) / 100 : (pos.h ?? 0);
        maxRight = Math.max(maxRight, (pos.x ?? 0) + w);
        maxBottom = Math.max(maxBottom, (pos.y ?? 0) + h);
      }
      if (item.children?.length) walk(item.children);
    }
  }
  walk(props.schema);

  const style: Record<string, string | number> = {
    position: "relative",
    width: wUnit === "%" ? `${canvasWidth}%` : `${canvasWidth}px`,
  };
  if (hUnit === "%") {
    style.height = `${canvasHeight}%`;
  } else {
    style.minHeight = `${Math.max(maxBottom, canvasHeight)}px`;
  }
  if (cc?.backgroundColor) style.backgroundColor = cc.backgroundColor;
  if (cc?.padding) style.padding = cc.padding;
  if (cc?.zoom && cc.zoom !== 100) style.transform = `scale(${cc.zoom / 100})`;
  return style;
});

const emit = defineEmits<{
  submit: [data: FormData];
  "validate-error": [errors: Record<string, unknown>];
  action: [action: SchemaAction];
  "open-dialog": [
    config: {
      title: string;
      width?: string;
      schema?: PartialWidget[];
      initialData?: FormData;
    },
  ];
  "container-drop": [
    payload: { parentPath: number[]; index: number; dragDataRaw: string },
  ];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

// ---- Dialog state ----
const dialogMode = computed(() => props.dialogMode ?? "internal");
const dialogVisible = ref(false);
const dialogTitle = ref("");
const dialogWidth = ref<string | undefined>(undefined);
const dialogSchema = ref<PartialWidget[] | undefined>(undefined);
const dialogInitialData = ref<FormData | undefined>(undefined);

function openDialog(config: {
  title: string;
  width?: string;
  schema?: PartialWidget[];
  initialData?: FormData;
}) {
  if (dialogMode.value === "external") {
    // 外部模式：仅Notification父Component, 不接管Dialog渲染
    emit("open-dialog", config);
    return;
  }
  dialogTitle.value = config.title;
  dialogWidth.value = config.width;
  dialogSchema.value = config.schema;
  dialogInitialData.value = config.initialData;
  dialogVisible.value = true;
  emit("open-dialog", config);
}

function handleDialogConfirm(_data: FormData) {
  dialogVisible.value = false;
  // Re-emit so parent can handle dialog result
  emit("action", {
    type: "dialog",
    dialogTitle: dialogTitle.value,
    dialogSchema: dialogSchema.value,
  } as unknown as SchemaAction);
}

function handleDialogCancel() {
  dialogVisible.value = false;
}

// ---- FormData管理（抽取自 useFormData） ----
const {
  formData,
  getFormData: getFlowFormData,
  setFormData: setFlowFormData,
  resetFields: resetFlowFields,
  validate: baseValidate,
  initFormData,
} = useFormData(formRef);

// ---- 生命week期钩子 ----
const { executeBeforeSubmit, executeAfterLoad } = useLifecycle(
  props.lifecycle,
  formData,
);

// ---- 上下文注入 ----
const context: FormGridContext = {
  user: props.user ?? {
    id: "",
    name: "",
    deptId: "",
    deptName: "",
    roles: [],
    permissions: [],
  },
  request: props.request ?? { token: "", headers: {}, baseUrl: "" },
  global: props.global ?? { dictMap: {}, config: {} },
};
provide(FORM_GRID_CONTEXT_KEY, context);
provide(FORM_GRID_FORM_KEY, formData);

// 注入 FormGrid API 给子Component（如 FgToolbarButtons、FgSteps）使用
provide(FORM_GRID_API_KEY, {
  validate,
  validateField,
  getFormData,
  resetFields,
});

// 注入 action emit 函数, 消除中间层Event转发
provide(ACTION_EMIT_KEY, (event: string, payload?: unknown) => {
  if (event === "action") {
    emit("action", payload as SchemaAction);
  } else if (event === "submit") {
    emit("submit", payload as FormData);
  } else if (event === "open-dialog") {
    const config = payload as {
      title: string;
      width?: string;
      schema?: PartialWidget[];
      initialData?: FormData;
    };
    openDialog(config);
    // emit 已由 openDialog 内部处理（根据 dialogMode 决定）
  }
});

// 变量上下文（画布级变量 + 从 schema 树收集所有 widget.variables）
const runtimeVariables = ref<Record<string, unknown>>({});

const variablesContext = computed(() => {
  const vars: Record<string, unknown> = { ...(props.boardVariables ?? {}) };
  function collect(items: PartialWidget[]) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item.variables?.length) {
        for (const v of item.variables) {
          vars[v.name] = v.defaultValue;
        }
      }
      if (item.children?.length) collect(item.children);
    }
  }
  collect(props.schema);
  // 合并运RowHrs修改的变量
  Object.assign(vars, runtimeVariables.value);
  return vars;
});

// ComponentExposed Value收集（由子Componentpassed provide 注入）
const exposedContext = ref<Record<string, Record<string, unknown>>>({});

/** 注册ComponentExposed Value（由子Component调用） */
function registerExposed(widgetId: string, state: Record<string, unknown>) {
  exposedContext.value = { ...exposedContext.value, [widgetId]: state };
}

/** 注销ComponentExposed Value */
function unregisterExposed(widgetId: string) {
  const { [widgetId]: _, ...rest } = exposedContext.value;
  exposedContext.value = rest;
}

// 提供Exposed Value注册接口
provide("registerExposed", registerExposed);
provide("unregisterExposed", unregisterExposed);
provide("variablesContext", variablesContext);
provide("exposedContext", exposedContext);
provide("setBoardVariable", (name: string, value: unknown) => {
  runtimeVariables.value = { ...runtimeVariables.value, [name]: value };
});

// LinkageStatus（支持 variables 和 exposed 引用）
const { stateMap: linkageStateMap } = useLinkage(
  props.schema,
  formData,
  variablesContext,
  exposedContext,
);
provide(FORM_GRID_LINKAGE_KEY, linkageStateMap);

provide(WIDGET_SURFACE_KEY, "runtime");

// ---- 响应式断点（发布态自适应） ----
const previewBreakpointRef = computed<PreviewBreakpoint>(
  () => props.previewBreakpoint ?? "desktop",
);
provide(PREVIEW_BREAKPOINT_KEY, previewBreakpointRef);

// ---- Dialog注册表（WidgetNode 注册 dialog 回调, eventContext.openDialog 消费） ----
const dialogRegistry: DialogRegistry = new Map();
const lastOpenedDialogId = ref<string | undefined>(undefined);
provide(DIALOG_REGISTRY_KEY, dialogRegistry);

// ---- Form注册表（FgForm 注册 validate API, absolute LayoutAggregate submit/validate） ----
const formRegistry: FormRegistry = new Map();
provide(FORM_REGISTRY_KEY, formRegistry);

// 只读模式注入（使用 toRef 保持响应式）
const readonlyRef = computed(() => props.readonly ?? false);
provide(FORM_GRID_READONLY_KEY, readonlyRef);

// partial 模式：Field级只读控制
const readonlyFieldsRef = computed(() => props.readonlyFields);
provide(FORM_GRID_READONLY_FIELDS_KEY, readonlyFieldsRef);
const editableFieldsRef = computed(() => props.editableFields);
provide(FORM_GRID_EDITABLE_FIELDS_KEY, editableFieldsRef);

// ---- 运RowHrsEventExecute上下文 ----

/** 递归查找 schema 树中的 widget */
function findWidgetInSchema(
  items: PartialWidget[],
  id: string,
): Widget | undefined {
  for (const item of items) {
    if (item.id === id) return item as Widget;
    if (item.children?.length) {
      const found = findWidgetInSchema(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

const eventContext: EventExecutionContext = {
  findWidget: (id: string) => findWidgetInSchema(props.schema, id),
  updateWidget: (id: string, patch: Partial<Widget>) => {
    const widget = findWidgetInSchema(props.schema, id);
    if (widget) Object.assign(widget, patch);
  },
  openDialog: (target: string) => {
    // 优先passed注册表Open WidgetNode 渲染的 EnhancedDialog
    const handler = dialogRegistry.get(target);
    if (handler) {
      lastOpenedDialogId.value = target;
      handler(true);
      return;
    }
    // 降级：使用 WidgetRenderer 内置 dialog Component
    const widget = findWidgetInSchema(props.schema, target);
    if (widget?.type === "dialog") {
      openDialog({
        title:
          (widget.props?.title as string) ||
          widget.label ||
          t("dialog.defaultTitle"),
        width: (widget.props?.width as string) || "600px",
        schema: widget.children as PartialWidget[] | undefined,
      });
    }
  },
  closeDialog: () => {
    // Close注册表中最近Open的 dialog
    if (lastOpenedDialogId.value) {
      const handler = dialogRegistry.get(lastOpenedDialogId.value);
      if (handler) handler(false);
      lastOpenedDialogId.value = undefined;
    }
    dialogVisible.value = false;
  },
  submitForm: () => {
    submit();
  },
  validateForm: async () => validate(),
  resetForm: () => {
    resetFields();
  },
  getFormData: () => getFormData(),
  emit: (eventName: string, payload?: unknown) => {
    emit("action", {
      type: "emit",
      eventName,
      eventPayload: payload,
    } as SchemaAction);
  },
  confirm: async (message: string) => {
    await ElMessageBox.confirm(message, t("confirm.title"), {
      confirmButtonText: t("confirm.ok"),
      cancelButtonText: t("confirm.cancel"),
      type: "warning",
    });
  },
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
    const handler = exposedContext.value[targetId]?.[eventName];
    if (typeof handler === "function") {
      void (handler as () => void | Promise<void>)();
    }
    const widget = findWidgetInSchema(props.schema, targetId);
    if (widget) {
      triggerWidgetEvent(widget, eventName, eventContext);
    }
    emit("action", {
      type: "trigger-event",
      target: targetId,
      event: eventName,
    } as SchemaAction);
  },
};
provide(EVENT_CONTEXT_KEY, eventContext);

// Build defaultValue map from schema tree for reset-fields linkage
function collectDefaultValues(items: PartialWidget[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const item of items) {
    if (item.field && item.defaultValue !== undefined) {
      map.set(item.field, item.defaultValue);
    }
    if (item.children?.length) {
      const childMap = collectDefaultValues(item.children);
      childMap.forEach((v, k) => map.set(k, v));
    }
  }
  return map;
}

const defaultValuesMap = computed(() => collectDefaultValues(props.schema));

function findWidgetByField(
  items: PartialWidget[],
  field: string,
): PartialWidget | undefined {
  for (const item of items) {
    if (item.field === field) return item;
    if (item.children?.length) {
      const found = findWidgetByField(item.children, field);
      if (found) return found;
    }
  }
  return undefined;
}

function collectSetValueFields(items: PartialWidget[]): Set<string> {
  const fields = new Set<string>();
  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.field && item.linkages?.some((l) => l.type === "set-value")) {
        fields.add(item.field);
      }
      if (item.children?.length) walk(item.children);
    }
  }
  walk(items);
  return fields;
}

const setValueLinkageFields = computed(() =>
  collectSetValueFields(props.schema),
);

// Apply set-value linkage targetValue → formData + widget.defaultValue (absolute layout)
let setValuePending = false;
watch(
  linkageStateMap,
  (map) => {
    if (setValuePending) return;
    const setValueFields = setValueLinkageFields.value;
    let hasUpdates = false;
    for (const [field, state] of map) {
      if (!setValueFields.has(field)) continue;
      const valueToApply =
        state.targetValue !== undefined ? state.targetValue : state.elseValue;
      if (valueToApply === undefined) continue;
      if (formData[field] !== valueToApply) {
        formData[field] = valueToApply as FormFieldValue;
        hasUpdates = true;
      }
      if (isAbsoluteLayout.value) {
        const widget = findWidgetByField(props.schema, field);
        if (widget && widget.defaultValue !== valueToApply) {
          widget.defaultValue = valueToApply as FormFieldValue;
          hasUpdates = true;
        }
      }
    }
    if (hasUpdates) {
      setValuePending = true;
      Promise.resolve().then(() => {
        setValuePending = false;
      });
    }
  },
  { deep: true },
);

// Apply reset-fields effects from linkage state (deferred to avoid render-cycle writes)
let resetFieldsPending = false;
watch(
  linkageStateMap,
  (map) => {
    if (resetFieldsPending) return;
    const defaults = defaultValuesMap.value;
    let hasResets = false;
    for (const [, state] of map) {
      if (state.resetFields?.length) {
        for (const targetField of state.resetFields) {
          const dv = defaults.get(targetField);
          if (formData[targetField] !== dv) {
            formData[targetField] = (dv ?? undefined) as FormFieldValue;
            hasResets = true;
          }
        }
      }
    }
    if (hasResets) {
      resetFieldsPending = true;
      Promise.resolve().then(() => {
        resetFieldsPending = false;
      });
    }
  },
  { deep: true },
);

// ---- 国际化 ----
const currentLocale = computed(() => props.locale ?? "zh-CN");
const { t } = useLocale(currentLocale);
provide(FORM_GRID_T_KEY, t);

// Element Plus Language包（按需Map, 避免全量加载）
const epLocale = computed(() => epLocaleMap[currentLocale.value]);

/**
 * 对 API BackData应用FieldMap
 * 将 API Back的Field nameTransform为 formData 中的Field name
 */
function applyFieldMap(
  data: Record<string, unknown>,
  fieldMap?: Record<string, string>,
): FormData {
  if (!fieldMap) return data as FormData;
  const mapped: FormData = {};
  for (const [apiField, formField] of Object.entries(fieldMap)) {
    if (apiField in data) {
      mapped[formField] = data[apiField] as FormData[string];
    }
  }
  return mapped;
}

/**
 * passed loadApi 加载Data并回填到 formData
 * 流程：请求 → transformAfterLoad → FieldMap → 合并 → Trigger onAfterLoad
 */
async function loadApiData(config: LoadApiConfig): Promise<void> {
  loading.value = true;
  try {
    const method = config.method ?? "get";
    const res = await fetchRuntimeUrl(method, config.url, config.params);

    // 假设 API Back { code: 0, data: Record<string, any> }
    let rawData: Record<string, unknown> = {};
    if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      rawData = (obj.data ?? obj) as Record<string, unknown>;
    }

    // transformAfterLoad: 加载后DataTransform（在FieldMap之前）
    let transformedData: FormData;
    if (props.transformAfterLoad) {
      try {
        transformedData = await props.transformAfterLoad(rawData);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t("message.transformFailed");
        logger.warn("transformAfterLoad TransformFailed, falling back to raw data:", msg);
        // 降级：使用原始Data
        transformedData = applyFieldMap(rawData, config.fieldMap);
        setFormData(transformedData);
        await executeAfterLoad(formData);
        return;
      }
    } else {
      // 无Transform：直接使用原始Data
      transformedData = rawData as FormData;
    }

    // 应用FieldMap并合并到 formData
    const mappedData = applyFieldMap(transformedData, config.fieldMap);
    setFormData(mappedData);

    // Trigger onAfterLoad 钩子
    await executeAfterLoad(formData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("message.loadFailed");
    logger.error("loadApi:", msg);
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

// ---- 初始化 ----
onMounted(async () => {
  // 1. 从 schema 初始化Default value
  initFormData(props.schema);
  if (isAbsoluteLayout.value) {
    Object.assign(formData, collectSchemaFormData(props.schema));
  }

  // 2. loadApi 回填（覆盖 defaultValue）
  if (props.loadApi) {
    await loadApiData(props.loadApi);
  }

  // 3. Grid 引擎连接Container（获取Width计算Column数）
  if (!isAbsoluteLayout.value) {
    await nextTick();
    const formEl = formRef.value?.$el as HTMLElement | undefined;
    connectGrid(formEl ?? null);
  }
});

onUnmounted(() => {
  disconnectGrid();
});

watch(
  () => props.schema,
  (val) => {
    initFormData(val);
    if (isAbsoluteLayout.value) {
      Object.assign(formData, collectSchemaFormData(val));
    }
  },
  { deep: true },
);

// ---- 统一 API ----

/** absolute Layout：Aggregate所有 FgForm Validate + schema FieldRule */
async function validateAbsoluteForms(): Promise<boolean> {
  for (const [, api] of formRegistry) {
    api.syncFromWidgets();
    await api.validate();
  }
  await validateSchemaFields(props.schema);
  return true;
}

/** absolute Layout：Reset所有已注册Form */
function resetAbsoluteForms(): void {
  for (const [, api] of formRegistry) {
    api.resetFields();
  }
}

/** Validate整个Form（带 validate-error Event上报） */
async function validate(): Promise<boolean> {
  if (isAbsoluteLayout.value) {
    return validateAbsoluteForms().catch((errors): never => {
      emit("validate-error", errors as Record<string, unknown>);
      throw errors;
    });
  }
  return baseValidate().catch((errors): never => {
    emit("validate-error", errors as Record<string, unknown>);
    throw errors;
  });
}

/** Validate指定Field */
async function validateField(fields?: string | string[]): Promise<boolean> {
  return formRef.value?.validateField(fields) ?? true;
}

/** 清除Validate结果 */
function clearValidate(fields?: string | string[]) {
  formRef.value?.clearValidate(fields);
}

/** 获取指定Field的ValidateErrorInfo */
function getFieldError(field: string): string | undefined {
  const fields = formRef.value?.fields;
  if (!fields) return undefined;
  const target = fields.find((f: { prop?: unknown }) => f.prop === field);
  return target?.validateMessage || undefined;
}

/** 滚动到指定Field */
function scrollToField(field: string) {
  formRef.value?.scrollToField(field);
}

/** 获取FormData副本 */
function getFormData(): FormData {
  if (isAbsoluteLayout.value) {
    return collectSchemaFormData(props.schema);
  }
  return getFlowFormData();
}

/** 合并SettingsFormData */
function setFormData(data: FormData) {
  if (isAbsoluteLayout.value) {
    applySchemaFormData(props.schema, data);
    for (const [, api] of formRegistry) {
      api.syncFromWidgets();
    }
    Object.assign(formData, data);
    return;
  }
  setFlowFormData(data);
}

/** ResetFormField */
function resetFields() {
  if (isAbsoluteLayout.value) {
    resetAbsoluteForms();
    initFormData(props.schema);
    Object.assign(formData, collectSchemaFormData(props.schema));
    return;
  }
  resetFlowFields();
}

/** SubmitForm（Validate + 钩子 + DataTransform后Trigger submit Event） */
async function submit() {
  // 1. onBeforeSubmit 钩子可阻止Submit
  const allowed = await executeBeforeSubmit();
  if (!allowed) return;

  // 2. FormValidate
  const valid = await validate();
  if (!valid) return;

  // 3. Submit前DataTransform
  let submitData = getFormData();
  if (props.transformBeforeSubmit) {
    try {
      submitData = await props.transformBeforeSubmit(submitData);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("message.transformFailed");
      logger.error("transformBeforeSubmit:", msg);
      ElMessage.error(msg);
      return;
    }
  }

  // 4. TriggerSubmitEvent
  emit("submit", submitData);
}

defineExpose({
  getFormData,
  setFormData,
  validate,
  validateField,
  resetFields,
  clearValidate,
  getFieldError,
  scrollToField,
  submit,
  formData,
});
</script>

<template>
  <el-config-provider :locale="epLocale">
    <div
      v-loading="loading"
      :class="styles.fg"
      :style="isAbsoluteLayout ? absoluteContainerStyle : flowContainerStyle"
    >
      <!-- 绝对定位模式：与Edit器画布一致, 保留 position 坐标 -->
      <template v-if="isAbsoluteLayout">
        <SchemaRender :widgets="schema as Widget[]" mode="preview" />
      </template>

      <!-- Grid Layout模式：CSS Grid + span 系统 -->
      <el-form v-else ref="formRef" :model="formData" :style="flowContainerStyle" :class="styles.fgGrid">
        <template v-for="(item, idx) in schema" :key="idx">
          <div :style="{ gridColumn: getChildGridColumn(idx) }">
            <ErrorBoundary
              v-if="!item.hidden"
              :node-type="item.type"
              :node-field="item.field"
              :node-path="String(idx)"
            >
              <SchemaRender
                :schema="item"
                :form-data="formData"
                :editable="editable"
                :is-dragging="isDragging"
                :readonly="readonly"
                :editor-selectable="editorSelectable"
                :path="[idx]"
                @container-drop="emit('container-drop', $event)"
              />
            </ErrorBoundary>
          </div>
        </template>
      </el-form>

      <!-- Built-in dialog (internal mode only): renders dialogSchema from button actions -->
      <el-dialog
        v-if="dialogMode === 'internal'"
        v-model:visible="dialogVisible"
        :title="dialogTitle"
        :width="dialogWidth ?? '600px'"
        append-to-body
        @close="handleDialogCancel"
      >
        <el-form v-if="dialogSchema?.length" :model="formData">
          <SchemaRender
            v-for="(item, dIdx) in dialogSchema"
            :key="dIdx"
            :schema="item"
            :form-data="formData"
            :path="[dIdx]"
          />
        </el-form>
        <template #footer>
          <el-button @click="handleDialogCancel">{{
            t("dialog.cancel")
          }}</el-button>
          <el-button type="primary" @click="handleDialogConfirm">{{
            t("dialog.confirm")
          }}</el-button>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>
