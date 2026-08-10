import type { InjectionKey, ComputedRef, Ref } from "vue";
import type { FormItemRule } from "element-plus";

// ============================================================
// SchemaType — Component Type Enum
// ============================================================

/** ContainerComponentType */
export type ContainerType =
  | "form"
  | "card"
  | "tabs"
  | "dialog"
  | "single-col"
  | "double-col"
  | "triple-col"
  | "quad-col"
  | "micro-app-container"
  | "row-container";

/** Basic Component Types */
export type BasicType =
  | "input"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "textarea"
  | "richtext"
  | "button"
  | "filter-bar"
  | "sub-form"
  | "progress-bar"
  | "rank-list"
  | "comparison-card"
  | "realtime-clock"
  | "marquee-text"
  | "tab-container"
  | "form-steps"
  | "condition-builder"
  | "treemap"
  | "upload"
  | "switch"
  | "slider"
  | "rate"
  | "table"
  | "title"
  | "divider"
  | "spacer"
  | "toolbar-buttons"
  | "file-list"
  | "transfer"
  | "banner"
  | "tree-layout"
  | "date-time-slot"
  | "time-picker"
  | "cascader"
  | "color-picker"
  | "tag-input"
  | "autocomplete"
  | "descriptions"
  | "advanced-table"
  | "tree-table"
  | "bar-chart"
  | "stacked-bar-chart"
  | "horizontal-bar-chart"
  | "line-chart"
  | "area-chart"
  | "pie-chart"
  | "donut-chart"
  | "scatter-chart"
  | "bubble-chart"
  | "radar"
  | "filled-radar"
  | "gauge"
  | "multi-gauge"
  | "heatmap"
  | "funnel"
  | "compare-funnel"
  | "candlestick"
  | "map"
  | "statistic"
  | "approval-user-picker"
  | "approval-role-picker"
  | "approval-comment"
  | "icon-picker"
  | "tree-select"
  | "permission-tree"
  | "dynamic-detail-table"
  | "qr-scanner";

/** Embedded Components */
export type EmbedType = "iframe" | "micro-app";

/** Business Scenario Components */
export type BusinessType =
  | "crud-list-page"
  | "user-management"
  | "role-management"
  | "user-selector"
  | "flow-timeline"
  | "flow-task-actions"
  | "calendar"
  | "kanban"
  | "adhoc-query"
  | "notification"
  | "auto-refresh"
  | "compliance-checklist";

/** All Component Types — runtime source is widgets/registry, new types only need registerWidget */
export type SchemaType = string;

/** @internal Built-in Widget Type Literal (for docs and fallback) */
export type KnownSchemaType =
  | ContainerType
  | BasicType
  | EmbedType
  | BusinessType;

// ============================================================
// FormFieldValueType
// ============================================================

export type FormFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | Record<string, unknown>
  | Record<string, unknown>[];

// ============================================================
// Dictionary item
// ============================================================

export interface DictItem {
  label: string;
  value: string | number | boolean;
  id?: string | number;
  type?: string;
  children?: DictItem[];
}

// ============================================================
// Validation rules (Element Plus FormItemRule + custom WidgetRule extension)
// ============================================================

/** Extend FormItemRule, supports WidgetRule system watches/condition/actions */
export interface SchemaRule extends FormItemRule {
  watches?: Array<{ type: string; source: string }>;
  condition?: string;
  actions?: Array<{ type: string; config: Record<string, unknown> }>;
}

export type SchemaRules = SchemaRule[];

// ============================================================
// Widget variables
// ============================================================

export interface WidgetVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue?: unknown;
  description?: string;
}

// ============================================================
// EventAction
// ============================================================

/** EventActionType */
export type EventActionType =
  | "show"
  | "hide"
  | "open-dialog"
  | "close-dialog"
  | "switch-tab"
  | "set-value"
  | "submit"
  | "reset"
  | "emit"
  | "set-variable" // Modify user variable
  | "trigger-event" // Trigger specified event on target widget
  | "post-message" // Send postMessage to parent window
  | "close-tab" // Close browser tab
  | "copy" // Copy text to clipboard
  | "refresh" // Refresh target widget data
  | "api" // Call backend API
  | "navigate" // Route navigation
  | "startFlow" // Start workflow
  | "endFlow" // End workflow
  | "submitSubmission" // Validate and submit form data to Submission API
  | "exportData" // Export file download (CSV/Excel etc.)
  | "chart-linkage"; // Chart linkage (drilldown/filter/highlight)

/** EventAction */
export interface SchemaEventAction {
  type: EventActionType;
  /** Target Component ID or Dialog ID */
  target?: string;
  /** Attached value (e.g. which Tab to switch to, emit payload) */
  value?: unknown;
  // ---- set-variable specific ----
  /** Variable name */
  variable?: string;
  // ---- trigger-event specific ----
  /** Event name to trigger */
  event?: string;
  // ---- post-message specific ----
  /** Message content */
  message?: Record<string, unknown>;
  // ---- copy specific ----
  /** Text to copy (supports formData.xxx references) */
  text?: string;
  // ---- api specific ----
  /** API URL */
  apiUrl?: string;
  /** Request method */
  apiMethod?: "get" | "post" | "put" | "delete";
  /** Request params, 'formData' means use FormData */
  apiParams?: Record<string, unknown> | "formData";
  // ---- navigate specific ----
  /** Route path */
  navigatePath?: string;
  /** RouteQueryParams */
  navigateQuery?: Record<string, string>;
  // ---- startFlow specific ----
  /** Workflow definition ID */
  definitionId?: string;
  /** Workflow variables */
  variables?: Record<string, unknown>;
  // ---- endFlow specific ----
  /** Workflow instance ID */
  instanceId?: string;
  /** End reason */
  reason?: string;
  // ---- submitSubmission specific ----
  /** Target Schema ID (sourceId or publishId) */
  schemaId?: string;
  /** exportData specific: download filename (when extension is missing, can be inferred from Content-Disposition) */
  exportFileName?: string;
  // ---- chart-linkage specific ----
  /** ChartLinkageRule ID */
  chartLinkageRuleId?: string;
}

// ============================================================
// Widget Event
// ============================================================

export interface WidgetEvent {
  /** Trigger event name (click / change / close etc.) */
  trigger: string;
  /** Event target (Widget internal element identifier, empty binds to entire Widget) */
  eventTarget?: string;
  /** Execute condition expression */
  condition?: string;
  /** Confirm prompt before execution */
  confirm?: string;
  actions: SchemaEventAction[];
}

/** Event target config — declares child elements in Widget that can bind events */
export interface EventTargetConfig {
  /** Target identifier (third param passed to triggerWidgetEvent) */
  id: string;
  /** ShowName */
  label: string;
  /** Description */
  description?: string;
}

// ============================================================
// Widget Rule
// ============================================================

// ============================================================
// SearchFieldConfig
// ============================================================

/** SearchFieldConfig */
export interface SearchFieldConfig {
  /** Field name (as API query param key) */
  field: string;
  /** ShowLabel */
  label: string;
  /** Search control type */
  type:
    | "input"
    | "select"
    | "date"
    | "date-range"
    | "cascader"
    | "time-picker"
    | "number"
    | "checkbox";
  /** Placeholder text */
  placeholder?: string;
  /** Dropdown options (used when type=select/checkbox) */
  options?: { label: string; value: string | number | boolean }[];
  /** Cascade options (used when type=cascader) */
  cascaderOptions?: {
    label: string;
    value: string | number;
    children?: unknown[];
  }[];
  /** Default value */
  defaultValue?: unknown;
  /** number TypeMinValue */
  min?: number;
  /** number TypeMaxValue */
  max?: number;
  /** number type step */
  step?: number;
}

// ============================================================
// API data source config
// ============================================================

/** Dynamic data request config */
export interface SchemaApiConfig {
  url: string;
  method?: "get" | "post";
  params?: Record<string, unknown>;
  headers?: Record<string, string>; // Custom HTTP request headers
  body?: Record<string, unknown>; // POST body (separate from params which are query params)
  timeout?: number; // Request timeout (ms), default 5000
  dataPath?: string; // dot-notation path to data array (e.g. "result.records"). Falls back to data > list > rows > items > records
  labelKey?: string; // Default 'label'
  valueKey?: string; // Default 'value'
  childrenKey?: string; // Tree data child key (preserve tree structure)
  ttl?: number; // Cache TTL (ms), default 0 = never expires
  immediate?: boolean; // default true, load on mount
  dictCode?: string; // lookup from global.dictMap (priority over url)
  cacheLevel?: "memory" | "indexeddb" | "both"; // Cache strategy, default 'memory'
  enableRetry?: boolean; // Enable retry, default false
  retryCount?: number; // Retry count, default 3, max 5
  /** Reference global DataSourceDefinition ID — after setting, url/method/params fields are ignored */
  dataSourceId?: string;
}

// ============================================================
// LinkageConfig
// ============================================================

/** LinkageType */
export type LinkageType =
  | "visible"
  | "disabled"
  | "required"
  | "options"
  | "set-value"
  | "reset-fields";

/** LinkageConfig */
export interface SchemaLinkage {
  /** LinkageType */
  type: LinkageType;
  /** Watched field list */
  watchFields: string[];
  /** Linkage condition — function or string expression */
  condition: string | ((values: Record<string, FormFieldValue>) => boolean);
  /** Static options when condition is true (options linkage) */
  thenOptions?: DictItem[];
  /** Dynamic API config when condition is true (options linkage) */
  thenApi?: SchemaApiConfig;
  /** Fallback value when condition is false (visible=false, disabled=false etc.) */
  elseValue?: FormFieldValue;
  /** set-value linkage: literal value to set when condition is true */
  thenValue?: FormFieldValue;
  /** set-value linkage: source field to copy value from when condition is true */
  valueSource?: string;
  /** reset-fields linkage: target field list to reset when condition is true */
  targetFields?: string[];
}

/** Field status after linkage calculation */
export interface LinkageState {
  /** Visible */
  visible: boolean;
  /** Whether disabled */
  disabled: boolean;
  /** Required */
  required: boolean;
  /** Static options overridden by options linkage */
  options?: DictItem[];
  /** API config overridden by options linkage */
  optionsApi?: SchemaApiConfig;
  /** elseValue: fallback to this value when linkage condition is false */
  elseValue?: FormFieldValue;
  /** Target value set by set-value linkage */
  targetValue?: FormFieldValue;
  /** reset-fields linkage: target field list to reset when condition is true */
  resetFields?: string[];
}

// ============================================================
// ChartLinkageConfig
// ============================================================

/** Chart linkage trigger mode */
export type ChartLinkageTrigger = "click" | "select" | "hover";

/** ChartLinkageActionType */
export type ChartLinkageAction = "filter" | "drilldown" | "highlight";

/** ChartLinkageRule */
export interface ChartLinkageRule {
  /** Rule ID */
  id: string;
  /** Source chart widget ID (chart that triggers linkage) */
  sourceWidgetId: string;
  /** Trigger mode */
  trigger: ChartLinkageTrigger;
  /** Target chart widget ID list (charts being linked) */
  targetWidgetIds: string[];
  /** Param mapping: source data field -> target filter field */
  paramMapping: Record<string, string>;
  /** LinkageActionType */
  action: ChartLinkageAction;
  /** Drilldown dimension field (for drilldown action) */
  drilldownField?: string;
  /** Drilldown level label (for breadcrumb display) */
  drilldownLabel?: string;
}

/** Chart drilldown history */
export interface DrilldownHistoryEntry {
  /** Drilldown dimension value */
  value: string;
  /** Drilldown dimension field */
  field: string;
  /** ShowLabel */
  label: string;
  /** Filter condition snapshot during drilldown */
  filters: Record<string, unknown>;
}

// ============================================================
// Property panel config type
// ============================================================

/** Config panel type (dialog entry button at bottom of property panel) */
export type ConfigPanelType =
  | "events"
  | "linkages"
  | "api"
  | "variables"
  | "chart-linkages";

/** Basic property shortcut in property panel declaration */
export type BasicPropKey =
  | "field"
  | "label"
  | "defaultValue"
  | "hidden"
  | "options"
  | "validationRules";

/** Property item in property panel declaration (string shortcut or full config object) */
export type PropertyPanelItem =
  | BasicPropKey
  | {
      key: string;
      label: string;
      type: string;
      default?: unknown;
      desc?: string;
      placeholder?: string;
      options?: { label: string; value: string | number | boolean }[];
      fields?: ArrayFieldSchema[];
      itemLabel?: string;
      visibleOn?: string;
    };

/** Property panel declaration */
export interface PropertyPanelConfig {
  basic?: PropertyPanelItem[];
  style?: string[];
  props?: PropertyPanelItem[];
}

/** Widget complete config (object structure exported from config.ts) */
export interface WidgetConfig {
  name: string;
  displayName: string;
  type?: SchemaType; // Component type (variant needs to specify, basic component can omit)
  description: string; // Widget description, used for property panel tooltip
  author?: string; // Widget author
  defaultStyle?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  /** Default position when dragging to canvas (overrides global DEFAULT_POSITION) */
  defaultPosition?: Partial<{
    x: number;
    y: number;
    w: number;
    h: number;
    xUnit: "px" | "%";
    yUnit: "px" | "%";
    wUnit: "px" | "%";
    hUnit: "px" | "%";
    zIndex: number;
  }>;
  propertyPanel?: PropertyPanelConfig;
  configPanels?: ConfigPanelType[];
  /** Event target list — declares child elements in Widget that can independently bind events (supports static array or dynamic function) */
  eventTargets?:
    | EventTargetConfig[]
    | ((widget: Widget) => EventTargetConfig[]);
  /** Component exposed runtime values — for linkage condition expressions to reference exposed.widgetId.xxx */
  exposedValues?: ExposedValueConfig[];
  /** External events Component can receive — triggered by event engine trigger-event action */
  receivableEvents?: ReceivableEventConfig[];
  /** Canvas modes available for this widget. Not declared = both modes available; if declared must include current mode, otherwise component panel hides */
  contexts?: BoardLayoutMode[];
  /** Component icon name (for component panel display) */
  icon?: string;
}

/** Component exposed value config */
export interface ExposedValueConfig {
  /** Reference key, e.g. selectedRows / loading */
  key: string;
  /** ValueType */
  type: "string" | "number" | "boolean" | "object" | "array";
  /** Description */
  description: string;
  /** Example value */
  example?: unknown;
}

/** Component receivable event config */
export interface ReceivableEventConfig {
  /** Event name, e.g. refresh / reset-search */
  name: string;
  /** Description */
  description: string;
  /** ParamsDescription */
  params?: Record<string, string>;
}

/** Generic array editor field declaration */
export interface ArrayFieldSchema {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "switch" | "color";
  options?: { label: string; value: string | number | boolean }[];
  default?: unknown;
  placeholder?: string;
}

// ============================================================
// Widget
// ============================================================

export interface Widget {
  // === Basic identifiers ===
  /** Unique ID (ComponentKey + 5 char random hash) */
  id: string;
  /** Component name (e.g. 'FgInput') */
  name: string;
  /** ComponentType */
  type: SchemaType;

  // === PropertyConfig ===
  /** Form field name */
  field?: string;
  /** ComponentLabel */
  label?: string;
  /** Component specific properties */
  props?: Record<string, unknown>;
  /** Options list */
  options?: DictItem[];
  /** Default value */
  defaultValue?: FormFieldValue;

  // === Position config ===
  position: {
    x: number; // Horizontal position - absolute positioning
    y: number; // Vertical position - absolute positioning
    w: number; // WidthValue
    h: number; // HeightValue
    xUnit?: "px" | "%"; // Horizontal position unit, default px
    yUnit?: "px" | "%"; // Vertical position unit, default px
    wUnit?: "px" | "%"; // Width unit, default px
    hUnit?: "px" | "%"; // Height unit, default px
    zIndex?: number;
  };

  // === Responsive position ===
  /** Override position/size by breakpoint (only effective in preview/publish mode) */
  responsivePosition?: ResponsivePosition;

  // === StyleConfig ===
  /** Component specific styles */
  style?: Record<string, unknown>;

  // === Variables ===
  /** Component internal variables */
  variables?: WidgetVariable[];

  // === Event ===
  /** Component event list */
  events?: WidgetEvent[];

  // === Linkage ===
  /** Component linkage rule list (SchemaLinkage) */
  linkages?: SchemaLinkage[];

  // === ChartLinkage ===
  /** Chart linkage rule list (ChartLinkageRule) */
  chartLinkages?: ChartLinkageRule[];

  // === Runtime status (set by rule engine) ===
  /** Whether component is disabled (rule engine can dynamically set) */
  disabled?: boolean;

  // === Data source ===
  /** API data source config (for dynamic loading of options etc.) */
  api?: SchemaApiConfig;

  // === ValidateRule ===
  /** FormValidateRule（Element Plus FormItemRule） */
  validationRules?: SchemaRules;

  // === Container binding ===
  /** Form container specific: which form container to bind to */
  formId?: string;
  /** Tab container specific: which tab label to bind to */
  tabKey?: string;
  /** Row container specific: which column to bind to */
  colIndex?: number;

  // === Static properties ===
  /** Hidden in design mode */
  hidden?: boolean;
  /** Lock position and size, disable drag/resize */
  locked?: boolean;

  // === Layout properties (used by flow renderer) ===
  /** Grid column span (1-24), used by row-container children */
  span?: number | Record<string, number>;
  /** Grid canvas child column span (0 or unset = 1 column, -1 = fill remaining columns) */
  gridSpan?: number;
  /** Table column merge */
  colspan?: number;
  /** Table row merge */
  rowspan?: number;
  /** CSS Width */
  width?: string;
  /** CSS Height */
  height?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** ShowBorder */
  border?: boolean;

  // === Condition expressions ===
  /** Conditional visible — visible when expression evaluates to true */
  visibleOn?: string;
  /** Conditional disabled — disabled when expression evaluates to true */
  disabledOn?: string;
  /** Conditional required — required when expression evaluates to true */
  requiredOn?: string;

  // === Button config ===
  /** Button text */
  text?: string;
  /** Button type */
  buttonType?: "" | "primary" | "success" | "warning" | "danger" | "info";
  /** Icon */
  icon?: string;
  /** Button action list */
  actions?: Record<string, unknown>[];
  /** Button group config */
  buttons?: Record<string, unknown>[];

  // === Table/Search list ===
  /** List API config */
  listApi?: Record<string, unknown>;
  /** Search field definition */
  searchFields?: Record<string, unknown>[];
  /** Table column definition */
  columns?: Record<string, unknown>[];
  /** Row action button */
  rowActions?: Record<string, unknown>[];

  // === Advanced config ===
  /** BorderHide */
  hideBorder?: string[];
  /** Permission role whitelist */
  permissionRoles?: string[];
  /** Readonly mode */
  readonly?: boolean;
  /** Custom HTML properties */
  customAttrs?: Record<string, string>;

  // === Child components ===
  /** Child widget list (Container component) */
  children?: Widget[];

  // === Lifecycle ===
  /** Widget lifecycle hooks */
  lifecycle?: WidgetLifecycleConfig;
}

/**
 * PartialWidget — Widget schema storage form
 *
 * Same structure as Widget, but id/name/position are optional.
 * Used for API storage, documentation examples, schema import/export etc.
 * Editor will complete it to a full Widget after loading.
 */
export type PartialWidget = Omit<
  Widget,
  "id" | "name" | "position" | "children"
> & {
  id?: string;
  name?: string;
  position?: Widget["position"];
  children?: PartialWidget[];
};

/** Full-width component type set — these components fill the entire row when rendered in grid-col */
export const FULL_WIDTH_TYPES = [
  "table",
  "advanced-table",
  "tree-table",
  "upload",
  "transfer",
  "banner",
  "tree-layout",
  "file-list",
  "descriptions",
  "statistic",
  "bar-chart",
  "stacked-bar-chart",
  "horizontal-bar-chart",
  "line-chart",
  "area-chart",
  "pie-chart",
  "donut-chart",
  "scatter-chart",
  "bubble-chart",
  "radar",
  "filled-radar",
  "gauge",
  "multi-gauge",
  "heatmap",
  "funnel",
  "compare-funnel",
  "candlestick",
  "map",
] as const;

/**
 * Check if component type is full-width component
 * Full-width component span is forced to 24 when rendered in grid-col
 */
export function isFullWidthType(type: SchemaType): boolean {
  return (FULL_WIDTH_TYPES as readonly string[]).includes(type);
}

// ============================================================
// Board (Canvas)
// ============================================================

export type CanvasUnit = "px" | "%";

/** Canvas layout mode: free=absolute positioning free canvas, grid=CSS Grid page layout */
export type BoardLayoutMode = "free" | "grid";

/** Responsive breakpoint (editor preview/publish mode) */
export type PreviewBreakpoint = "desktop" | "tablet" | "mobile";

/** Position/size override for a single breakpoint */
export interface BreakpointPosition {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  xUnit?: "px" | "%";
  yUnit?: "px" | "%";
  wUnit?: "px" | "%";
  hUnit?: "px" | "%";
  zIndex?: number;
  /** Whether hidden at this breakpoint */
  hidden?: boolean;
}

/** Responsive position config — override widget position by breakpoint */
export type ResponsivePosition = Partial<
  Record<PreviewBreakpoint, BreakpointPosition>
>;

/** Free layout whitespace preset */
export type FreeLayoutPreset =
  | "full"
  | "form-narrow"
  | "list-standard"
  | "list-wide"
  | "dashboard-demo";

/** Grid PageTemplate */
export type GridPageTemplate = "form" | "list" | "detail" | "page" | "blank";

/** Free layout content area whitespace */
export interface FreeLayoutOptions {
  /** Content max width (px), center with whitespace when exceeded */
  maxContentWidth?: number;
  /** Horizontal alignment */
  contentAlign?: "left" | "center";
  /** Left/right inner margin, e.g. "24px" */
  marginX?: string;
  /** Enable grid snap */
  snapToGrid?: boolean;
  /** Grid column count (12 or 24), default 24 */
  gridColumns?: number;
  /** Grid row height (px), default 8 */
  gridRowHeight?: number;
}

/** Grid layout options (effective when layoutMode=grid), reference formily Grid */
export interface GridLayoutOptions {
  /** Row gap (px), default 12 */
  rowGap?: number;
  /** Column gap (px), default 8 */
  columnGap?: number;
  /** Max column count, default infinite */
  maxColumns?: number;
  /** Min column count, default 1 */
  minColumns?: number;
  /** Max width per column (px), default infinite (equal distribution) */
  maxWidth?: number;
  /** Min width per column (px), default 100 */
  minWidth?: number;
  /** Whether child nodes auto wrap to new row, default true */
  colWrap?: boolean;
  /** Content area max width (px), center with whitespace when exceeded */
  maxContentWidth?: number;
  /** Horizontal alignment */
  contentAlign?: "left" | "center";
}

/** Publish view adaptive mode */
export type ScaleMode = "fit-width" | "fit-height" | "contain" | "stretch";

export interface CanvasConfig {
  width: number;
  height: number;
  widthUnit?: CanvasUnit;
  heightUnit?: CanvasUnit;
  backgroundColor: string;
  padding: string;
  /** Scale ratio 100-150 */
  zoom: number;
  /** Layout mode, default free (compatible with old Schema) */
  layoutMode?: BoardLayoutMode;
  /** Free layout whitespace (effective when layoutMode=free) */
  freeLayout?: FreeLayoutOptions;
  /** Grid layout options (effective when layoutMode=grid) */
  gridLayout?: GridLayoutOptions;
  /** Grid page template identifier (records creation template when layoutMode=grid) */
  gridTemplate?: GridPageTemplate;
  /** Dashboard theme preset ID (boardThemes.ts) */
  themePreset?: string;
  /** Publish view adaptive mode (only effective in publish/preview) */
  scaleMode?: ScaleMode;
}

export interface BoardVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue?: unknown;
  description?: string;
}

export interface BoardEvent {
  trigger: "mount" | "submit" | "reset" | "custom";
  name?: string;
  actions: SchemaEventAction[];
}

/** Canvas page — each page has independent canvas config and widget collection */
export interface BoardPage {
  /** Page ID */
  id: string;
  /** PageName */
  name: string;
  /** Page level canvas config (overrides Board.canvas) */
  canvas?: Partial<CanvasConfig>;
  /** Page level variables */
  variables?: BoardVariable[];
  /** Page level events */
  events?: BoardEvent[];
  /** Page widget collection */
  widgets: Widget[];
}

export interface Board {
  /** Canvas instance ID */
  id: string;
  /** Canvas name */
  name: string;
  status: "draft" | "published";
  canvas: CanvasConfig;
  variables: BoardVariable[];
  events: BoardEvent[];
  widgets: Widget[];
  /** Multi-page support — when exists, prioritize using pages[currentPageId] widgets */
  pages?: BoardPage[];
  /** Current active page ID */
  currentPageId?: string;
  /** Centrally managed data source definitions */
  dataSources?: import("../../types/dataSource").DataSourceDefinition[];
}

// ============================================================
// Injection Keys
// ============================================================

/** Inject current widget data */
export const widgetDataKey: InjectionKey<ComputedRef<Widget>> =
  Symbol("WidgetData");

/** Inject current widget style config */
export const widgetStyleKey: InjectionKey<
  ComputedRef<Record<string, unknown>>
> = Symbol("WidgetStyle");

// ============================================================
// Widget render status (rule engine output)
// ============================================================

/** Render status computed by rule engine */
export interface WidgetRenderState {
  /** Visible */
  visible: boolean;
  /** Whether disabled */
  disabled: boolean;
  /** Required */
  required: boolean;
}

/** Inject render status computed by rule engine */
export const widgetRenderStateKey: InjectionKey<
  ComputedRef<WidgetRenderState>
> = Symbol("WidgetRenderState");

// ============================================================
// Form context (FgForm provide → SchemaNode inject)
// ============================================================

/** Form context, provided by FgForm to child components */
export interface FormContext {
  /** el-form component reference */
  formRef: Ref<unknown>;
  /** Form data model (field → value), bound to el-form :model */
  formModel: Record<string, unknown>;
  /** Update specified field value (child component calls via inject) */
  updateField: (field: string, value: unknown) => void;
}

/** Inject form context (el-form ref + model) */
export const formContextKey: InjectionKey<FormContext> = Symbol("FormContext");

/** Component exposed value injection key — each component provides its own exposedState */
export const widgetExposedKey: InjectionKey<Record<string, unknown>> =
  Symbol("WidgetExposed");

/** Parsed widget pixel size (consistent with overlay calculation) */
export interface WidgetBounds {
  widthPx: number;
  heightPx: number;
}

/** Current widget parsed size — SchemaNode provide, Widget inject */
export const widgetBoundsKey: InjectionKey<ComputedRef<WidgetBounds>> =
  Symbol("WidgetBounds");

/** Parent container parsed size — used by nested widget for % unit conversion */
export const parentBoundsKey: InjectionKey<ComputedRef<WidgetBounds>> =
  Symbol("ParentBounds");

// ============================================================
// Widget lifecycle
// ============================================================

/** Lifecycle hook: string expression or function */
export type LifecycleHook =
  | string
  | ((ctx: LifecycleContext) => void | Promise<void>);

/** Lifecycle hook config */
export interface WidgetLifecycleConfig {
  onInit?: LifecycleHook;
  onMount?: LifecycleHook;
  onUnmount?: LifecycleHook;
  onDataChange?: LifecycleHook;
  onVisibleChange?: LifecycleHook;
  onBeforeSubmit?: LifecycleHook;
  onAfterLoad?: LifecycleHook;
  onOpen?: LifecycleHook;
  onClose?: LifecycleHook;
}

/** Lifecycle execution context */
export interface LifecycleContext {
  widget: Widget;
  formData: Record<string, unknown>;
  scopes: unknown[];
  field?: string;
  value?: unknown;
  logger: {
    info: (...a: unknown[]) => void;
    warn: (...a: unknown[]) => void;
    error: (...a: unknown[]) => void;
    debug: (...a: unknown[]) => void;
  };
  [key: string]: unknown;
}
