/** 节点Type枚举 */
import type { InjectionKey, ComputedRef, Ref } from "vue";
import type { FormItemRule } from "element-plus";
import type {
  SchemaType,
  PreviewBreakpoint,
  FormFieldValue,
  DictItem,
} from "../../widgets/base/types";
export type { SchemaType, PreviewBreakpoint, FormFieldValue, DictItem };

/** 响应式 span Config — 断点定义与 Element Plus 一致 */
export interface ResponsiveSpan {
  /** < 576px */
  xs?: number;
  /** >= 576px */
  sm?: number;
  /** >= 768px */
  md?: number;
  /** >= 992px */
  lg?: number;
  /** >= 1200px */
  xl?: number;
  /** >= 1600px */
  xxl?: number;
}

/** FormData对象 */
export type FormData = Record<string, FormFieldValue>;

/** User上下文 */
export interface UserContext {
  id: string;
  name: string;
  deptId: string;
  deptName: string;
  roles: string[];
  /** Permission码Column表, 如 ['flow:design', 'flow:approve'] */
  permissions: string[];
  [key: string]: unknown;
}

/** 请求上下文 */
export interface RequestContext {
  token: string;
  headers: Record<string, string>;
  baseUrl: string;
  [key: string]: unknown;
}

/** 全局Config上下文 */
export interface GlobalContext {
  /** Data字典Map */
  dictMap: Record<string, DictItem[]>;
  /** 全局Config */
  config: Record<string, unknown>;
  [key: string]: unknown;
}

/** FormGrid 上下文 */
export interface FormGridContext {
  user: UserContext;
  request: RequestContext;
  global: GlobalContext;
}

/** 上下文注入 Key */
export const FORM_GRID_CONTEXT_KEY: InjectionKey<FormGridContext> =
  Symbol("FormGridContext");

/** FormData注入 Key */
export const FORM_GRID_FORM_KEY: InjectionKey<FormData> =
  Symbol("FormGridFormData");

/** EventAction emit 函数Type */
export type ActionEmitFn = (event: string, payload?: unknown) => void;

/** Action注入 Key — 用于消除中间层Event转发 */
export const ACTION_EMIT_KEY: InjectionKey<ActionEmitFn> = Symbol("ActionEmit");

/** FormGrid API 注入 Key */
export interface FormGridApi {
  validate: () => Promise<boolean>;
  validateField: (fields?: string | string[]) => Promise<boolean>;
  getFormData: () => FormData;
  resetFields: () => void;
}

/** FormGrid API 注入 Key */
export const FORM_GRID_API_KEY: InjectionKey<FormGridApi> =
  Symbol("FormGridApi");

/** Form国际化Language */
export type FormGridLocale = "zh-CN" | "en-US";

/** 翻译函数Type */
export type TranslateFn = (
  key: string,
  params?: Record<string, unknown>,
) => string;

import type {
  PartialWidget,
  LinkageType,
  SchemaLinkage,
  LinkageState,
} from "../../widgets/base/types";
export type { PartialWidget, LinkageType, SchemaLinkage, LinkageState };

/** FormGrid Component Props 定义 */
export interface FormGridProps {
  /** Widget 定义Column表（支持完整 Widget or schema 形态的 PartialWidget） */
  schema: PartialWidget[];
  /**
   * Layout模式
   * - 'flow'（Default）：流式Layout, 使用 WidgetNode 渲染（忽略 position）
   * - 'absolute'：绝对定位, 使用 SchemaNode 渲染（保留 position, 与Edit器画布一致）
   */
  layout?: "flow" | "absolute";
  /** User上下文 */
  user?: FormGridContext["user"];
  /** 请求上下文 */
  request?: FormGridContext["request"];
  /** 全局Config */
  global?: FormGridContext["global"];
  /** 生命week期钩子Config */
  lifecycle?: FormLifecycleConfig;
  /** API Data加载Config — 用于Edit场景的Data回填 */
  loadApi?: LoadApiConfig;
  /** 国际化Language, Default 'zh-CN' */
  locale?: FormGridLocale;
  /**
   * Submit前DataTransform
   * 在 onBeforeSubmit 钩子和FormValidatepassed后、emit('submit') 前Execute
   * 抛错Hrs终止Submit流程
   */
  transformBeforeSubmit?: (formData: FormData) => FormData | Promise<FormData>;
  /**
   * 加载后DataTransform
   * 在 loadApi DataBack后、applyFieldMap 前Execute
   * 抛错Hrs使用原始Data降级
   */
  transformAfterLoad?: (
    rawData: Record<string, unknown>,
  ) => FormData | Promise<FormData>;
  /**
   * Dialog管理模式
   * - 'internal'（Default）：FormGrid 内部管理Dialog生命week期（Open/Close）, FgDialog 内置渲染
   * - 'external'：FormGrid 仅passed @open-dialog EventNotification父Component, 由父Component管理Dialog
   *   用于预览页、跨ComponentDialogLinkage等场景
   */
  dialogMode?: "internal" | "external";
  /** 画布级变量 — 从 boardStore 传入, 与 widget.variables 合并后供Event/LinkageCondition使用 */
  boardVariables?: Record<string, unknown>;
  /** 画布Config — 绝对定位模式下用于计算Container尺寸和BackgroundStyle；含 layoutMode */
  canvasConfig?: Partial<import("../../widgets/base/types").CanvasConfig>;
}

/** 动态Data请求Config — 从 widgets/base/types 统一Export */
import type { SchemaApiConfig } from "../../widgets/base/types";
export type { SchemaApiConfig };

/** ButtonActionType */
export type ActionType =
  | "emit"
  | "dialog"
  | "upload"
  | "submit"
  | "reset"
  | "navigate"
  | "api"
  | "validate"
  | "confirm"
  | "trigger-event";

/** emit Action的 payload — 可以是任意可序Column化Value */
export type ActionPayload =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

/** ButtonAction定义 */
export interface SchemaAction {
  type: ActionType;
  label?: string;
  confirm?: string; // Confirm prompt before execution
  disabled?: boolean;
  // emit
  eventName?: string;
  eventPayload?: ActionPayload;
  // dialog
  dialogTitle?: string;
  dialogWidth?: string;
  dialogSchema?: PartialWidget[];
  // api
  apiUrl?: string;
  apiMethod?: "get" | "post";
  apiParams?: Record<string, unknown> | "formData";
  // navigate
  navigatePath?: string;
  navigateQuery?: Record<string, string>;
  // trigger-event
  target?: string;
  event?: string;
}

/** ButtonConfig */
export interface SchemaButtonConfig {
  text: string;
  buttonType?: "" | "primary" | "success" | "warning" | "danger" | "info";
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  actions?: SchemaAction[];
}

/** Element Plus FormValidation rules — 使用官方Type */
export type SchemaRules = FormItemRule[];

/** 通用Component props — 用 unknown 约束, 消费方按Type断言 */
export type ComponentProps = Record<string, unknown>;

/** LinkageStatus注入 Key */
export const FORM_GRID_LINKAGE_KEY: InjectionKey<
  ComputedRef<Map<string, LinkageState>>
> = Symbol("FormGridLinkage");

/**
 * Grid 引擎上下文（Edit态 resize → gridSpan 反算）
 */
export interface GridEngineContext {
  columns: ComputedRef<number>;
  columnGap: ComputedRef<number>;
  containerWidth: Ref<number>;
}

export const GRID_ENGINE_CONTEXT_KEY: InjectionKey<GridEngineContext> =
  Symbol("GridEngineContext");

/** 国际化翻译函数注入 Key */
export const FORM_GRID_T_KEY: InjectionKey<TranslateFn> =
  Symbol("FormGridTranslate");

/** 只读模式注入 Key — DisableFormInput、Hide内部Button */
export const FORM_GRID_READONLY_KEY: InjectionKey<ComputedRef<boolean>> =
  Symbol("FormGridReadonly");

/** partial 模式下只读FieldColumn表注入 Key */
export const FORM_GRID_READONLY_FIELDS_KEY: InjectionKey<
  ComputedRef<string[] | undefined>
> = Symbol("FormGridReadonlyFields");

/** partial 模式下可EditFieldColumn表注入 Key */
export const FORM_GRID_EDITABLE_FIELDS_KEY: InjectionKey<
  ComputedRef<string[] | undefined>
> = Symbol("FormGridEditableFields");

/** EventExecute上下文注入 Key — 运RowHrsEvent引擎 */
import type { EventExecutionContext } from "../../engine/eventEngine";
export type { EventExecutionContext };
export const EVENT_CONTEXT_KEY: InjectionKey<EventExecutionContext> = Symbol(
  "EventExecutionContext",
);

/** Dialog注册表 — WidgetNode 注册 dialog 的Open/Close回调, eventContext.openDialog 消费 */
export type DialogRegistry = Map<string, (visible: boolean) => void>;
export const DIALOG_REGISTRY_KEY: InjectionKey<DialogRegistry> =
  Symbol("DialogRegistry");

/** 绝对Layout下 FgForm 注册 API, 供 WidgetRenderer Aggregate validate/submit */
export interface RegisteredFormApi {
  validate: () => Promise<boolean>;
  resetFields: () => void;
  syncFromWidgets: () => void;
}

export type FormRegistry = Map<string, RegisteredFormApi>;
export const FORM_REGISTRY_KEY: InjectionKey<FormRegistry> =
  Symbol("FormRegistry");

/**
 * 生命week期钩子Config
 * 支持函数or字符串表达式两种模式（与 linkage.condition 共享沙箱模式）
 */
export interface FormLifecycleConfig {
  /** Form挂载后Trigger（仅一次） */
  onFormMount?: string | ((formData: FormData) => void | Promise<void>);
  /** 任意FieldValue变化HrsTrigger（300ms 防抖, 初始化阶段不Trigger） */
  onFieldChange?:
    | string
    | ((
        field: string,
        value: FormFieldValue,
        formData: FormData,
      ) => void | Promise<void>);
  /** Submit前Validate钩子, Back false 可阻止Submit */
  onBeforeSubmit?:
    | string
    | ((formData: FormData) => boolean | Promise<boolean>);
  /** loadApi Data回填完成后Trigger */
  onAfterLoad?: string | ((formData: FormData) => void | Promise<void>);
}

/**
 * API Data加载Config — 用于"Edit已有Data"场景
 * onMounted Hrs自动请求并回填 formData
 */
export interface LoadApiConfig {
  /** 接口地址 */
  url: string;
  /** 请求方法, Default get */
  method?: "get" | "post";
  /** 额外请求Params */
  params?: Record<string, unknown>;
  /**
   * FieldMap：API BackField name → formData Field name
   * 例如 { 'user_name': 'name', 'dept_id': 'department' }
   * 未指定Hrs直接使用 API Back的原始Field name
   */
  fieldMap?: Record<string, string>;
}

/** List API configuration for search-list component */
export interface ListApiConfig {
  url: string;
  method?: "get" | "post";
  extraParams?: Record<string, unknown>;
  pageParam?: string; // default: 'pageNum'
  sizeParam?: string; // default: 'pageSize'
  dataPath?: string; // optional; falls back to data|list|rows|items|records
  totalPath?: string; // default: 'total', supports dot notation
  immediate?: boolean; // default: true
  resetOnSearch?: boolean; // default: true
}

/** Search field definition for inline search forms */
export interface SearchFieldSchema {
  type:
    | "input"
    | "number"
    | "select"
    | "radio"
    | "checkbox"
    | "date"
    | "date-range";
  field: string;
  label?: string;
  span?: number;
  placeholder?: string;
  options?: DictItem[];
  api?: SchemaApiConfig;
  defaultValue?: FormFieldValue;
  props?: Record<string, unknown>;
}

/** Search list column schema — extends TableColumnSchema with display render modes */
export interface SearchListColumnSchema {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: boolean | "left" | "right";
  sortable?: boolean;
  align?: "left" | "center" | "right";
  options?: DictItem[];
  api?: SchemaApiConfig;
  render?: "text" | "tooltip" | "tag" | "link" | "badge" | "image" | "custom";
  colorMap?: Record<string, string>;
  tooltipField?: string;
  linkEvent?: string;
  imageWidth?: number;
  renderFn?: string;
}

/** Search list row action button configuration */
export interface SearchListRowAction {
  label: string;
  buttonType?: "" | "primary" | "success" | "warning" | "danger" | "info";
  type: "emit" | "api" | "navigate" | "dialog";
  emitEvent?: string;
  apiUrl?: string;
  apiMethod?: "get" | "post" | "put" | "delete";
  confirm?: string;
  visibleOn?: string;
  disabledOn?: string;
  icon?: string;
  // navigate
  navigatePath?: string;
  navigateQuery?: Record<string, string>;
  // dialog
  dialogTitle?: string;
  dialogWidth?: string;
  dialogSchema?: PartialWidget[];
}

/** 可Edit表格Column Schema — FgEditableTable 专用 */
export interface EditableTableColumn {
  /** Field name, 对应RowData的 key */
  prop: string;
  /** Column标题 */
  label: string;
  /** FormComponentType */
  type: "input" | "number" | "select" | "date" | "textarea";
  /** 占位文本 */
  placeholder?: string;
  /** Column width度 (CSS Value, 如 "200px") */
  width?: string;
  /** select Type的静态Options */
  options?: DictItem[];
  /** select Type的动态 API Config */
  api?: SchemaApiConfig;
  /** Validation rules */
  rules?: SchemaRules;
  /** Required */
  required?: boolean;
}

/** 表格Column Schema 定义 — 支持Row内Edit */
export interface TableColumnSchema {
  /** Field name, 对应RowData的 key */
  prop: string;
  /** Column标题 */
  label: string;
  /** ColumnType — 决定Edit态渲染的Component */
  type?: "text" | "input" | "number" | "select" | "date";
  /** Column width度 */
  width?: string | number;
  /** MinColumn width度 */
  minWidth?: string | number;
  /** Fixed column */
  fixed?: boolean | "left" | "right";
  /** 是否可Sort */
  sortable?: boolean;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** select Type的静态Options */
  options?: DictItem[];
  /** select Type的动态 API Config */
  api?: SchemaApiConfig;
  /** Edit态Validation rules */
  rules?: SchemaRules;
  /** 是否可Edit, Default true */
  editable?: boolean;
}

/** 表格RowActionConfig */
export interface TableRowAction {
  /** ActionType */
  type: "add" | "delete" | "copy";
  /** Button文本 */
  label?: string;
  /** DeleteAction的Confirm提示文案 */
  confirm?: string;
}

/** ComponentStyleConfig — 由 PropertyPanel StyleConfig tab 驱动 */
export interface ComponentStyle {
  width?: string;
  height?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  backgroundColor?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
  boxShadow?: string;
  opacity?: number;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  customClass?: string;
}

/** 遥测回调接口 — S20 */
export interface FormGridTelemetry {
  /** ErrorBoundary 捕获Render ErrorHrs调用 */
  onRenderError?: (info: {
    type: string;
    field?: string;
    path?: string;
    error: Error;
  }) => void;
  /** API OptionsLoad failedHrs调用 */
  onApiError?: (info: { url: string; error: string }) => void;
  /** Schema ValidateFailedHrs调用 */
  onSchemaError?: (info: { errors: unknown[]; count: number }) => void;
}

/** 响应式断点注入 Key — 预览/发布模式下的当前断点 */
export const PREVIEW_BREAKPOINT_KEY: InjectionKey<Ref<PreviewBreakpoint>> =
  Symbol("PreviewBreakpoint");
