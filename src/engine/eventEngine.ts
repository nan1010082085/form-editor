/**
 * eventEngine — Event引擎
 *
 * Parse WidgetEvent, Execute SchemaEventAction。
 * 纯逻辑层, 不依赖 Vue Componentor Store, passed EventExecutionContext 注入运RowHrs能力。
 */
import type {
  Widget,
  SchemaEventAction,
  FormFieldValue,
} from "../widgets/base/types";
import { getWidget } from "../widgets/registry";
import { useLogger } from "@/composables/useLogger";
import { checkSecurity } from "@/utils/expression";
import { apiClient, createSubmission } from "@/utils/apiClient";
import { startFlow, terminateFlow } from "@/api/dataApi";

const logger = useLogger("EventEngine");

/** Format widget name: button #abc123 */
function formatWidget(widget: Widget): string {
  const reg = getWidget(widget.type);
  const name = reg?.displayName ?? widget.type;
  return `${name} #${widget.id}`;
}

function formatTarget(targetId: string, ctx: EventExecutionContext): string {
  const w = ctx.findWidget(targetId);
  return w ? formatWidget(w) : `#${targetId}`;
}

/** i18n key mapping: trigger -> editor.eventEngine.* (shared between config dialog and engine) */
export const EVENT_TRIGGER_I18N_KEYS: Record<string, string> = {
  click: "editor.eventEngine.triggerClick",
  change: "editor.eventEngine.triggerChange",
  "chart-click": "editor.eventEngine.triggerChartClick",
  focus: "editor.eventEngine.triggerFocus",
  blur: "editor.eventEngine.triggerBlur",
  submit: "editor.eventEngine.triggerSubmit",
  close: "editor.eventEngine.triggerClose",
  open: "editor.eventEngine.triggerOpen",
  confirm: "editor.eventEngine.triggerConfirm",
  cancel: "editor.eventEngine.triggerCancel",
  refresh: "editor.eventEngine.triggerRefresh",
  "api-success": "editor.eventEngine.triggerApiSuccess",
  "api-error": "editor.eventEngine.triggerApiError",
  mounted: "editor.eventEngine.triggerMounted",
};

/** @deprecated Use EVENT_TRIGGER_I18N_KEYS */
const TRIGGER_I18N_KEYS = EVENT_TRIGGER_I18N_KEYS;

/** Externally injected translation function (set by Vue layer via setTriggerLabelProvider) */
let _t: ((key: string) => string) | undefined;

/** Set trigger label translation provider (called during editor initialization) */
export function setTriggerLabelProvider(t: (key: string) => string): void {
  _t = t;
}

function getTriggerLabel(trigger: string): string {
  const key = TRIGGER_I18N_KEYS[trigger];
  if (key && _t) return _t(key);
  return trigger;
}

/** Event execution context — provided by editor or runtime */
export interface EventExecutionContext {
  /** Find widget (editor uses widgetStore.findWidget, runtime uses schema tree) */
  findWidget: (id: string) => Widget | undefined;
  /** Update widget property */
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  /** Open dialog */
  openDialog: (target: string) => void;
  /** Close dialog */
  closeDialog: () => void;
  /** Submit form */
  submitForm: () => void;
  /** Validate form (optional, provided by runtime) */
  validateForm?: () => Promise<boolean>;
  /** Reset form */
  resetForm: () => void;
  /** Get form data */
  getFormData: () => Record<string, unknown>;
  /** Custom event emit */
  emit: (eventName: string, payload?: unknown) => void;
  /** Confirm dialog (returns Promise, reject means cancel) */
  confirm?: (message: string) => Promise<void>;
  /** Variable context */
  variables?: Record<string, unknown>;
  /** Set variable value */
  setVariable?: (name: string, value: unknown) => void;
  /** Get variable value */
  getVariable?: (name: string) => unknown;
  /** Widget exposed values context */
  exposed?: Record<string, Record<string, unknown>>;
  /** Trigger specified event on target widget */
  triggerEvent?: (targetId: string, eventName: string) => void;
  /** Table row context (advanced table row button/link events) */
  row?: Record<string, unknown>;
  rowIndex?: number;
  selectedRows?: Record<string, unknown>[];
  selectedCount?: number;
  tableData?: Record<string, unknown>[];
  /** Chart click event context */
  chartEvent?: {
    dataIndex: number;
    name: string;
    value: unknown;
    seriesName: string;
    data: Record<string, unknown>;
  };
  /** Chart linkage handler callback (injected by runtime, called by chart-linkage action) */
  handleChartLinkage?: (
    sourceWidgetId: string,
    chartEvent: {
      dataIndex: number;
      name: string;
      value: unknown;
      seriesName: string;
      data: Record<string, unknown>;
    },
    ruleId?: string,
  ) => void;
}

/**
 * 从对象按点路径读取Value
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Parse单个 {{...}} Template段
 */
function resolveTemplateSegment(
  path: string,
  ctx: EventExecutionContext,
): string {
  if (path.startsWith("row.") && ctx.row) {
    return String(getNestedValue(ctx.row, path.slice(4)) ?? "");
  }
  if (path.startsWith("formData.")) {
    return String(getNestedValue(ctx.getFormData(), path.slice(9)) ?? "");
  }
  if (path.startsWith("variables.") && ctx.variables) {
    return String(getNestedValue(ctx.variables, path.slice(10)) ?? "");
  }
  if (ctx.variables && path in ctx.variables) {
    return String(ctx.variables[path] ?? "");
  }
  return String(
    getNestedValue(
      { ...ctx.getFormData(), ...(ctx.variables ?? {}), row: ctx.row },
      path,
    ) ?? "",
  );
}

/**
 * ParseEventParams中的上下文引用：formData.xxx、row.xxx、{{row.xxx}}、URL 内联 {{variables.xxx}}
 */
function resolveContextString(
  text: string,
  ctx: EventExecutionContext,
): string {
  const trimmed = text.trim();
  if (trimmed.includes("{{")) {
    return trimmed.replace(/\{\{(.+?)\}\}/g, (_, inner: string) =>
      resolveTemplateSegment(inner.trim(), ctx),
    );
  }
  const templateMatch = trimmed.match(/^\{\{(.+)\}\}$/);
  if (templateMatch) {
    return resolveTemplateSegment(templateMatch[1].trim(), ctx);
  }
  if (trimmed.startsWith("formData.")) {
    return String(getNestedValue(ctx.getFormData(), trimmed.slice(9)) ?? "");
  }
  if (trimmed.startsWith("row.") && ctx.row) {
    return String(getNestedValue(ctx.row, trimmed.slice(4)) ?? "");
  }
  return text;
}

/**
 * Parse上下文引用并保留原ValueType（供 post-message 等结构化Message使用）。
 *
 * Rule：
 * - 整体形如 "formData.xxx" / "row.xxx" / "variables.xxx" / "{{xxx}}" -> Back原始Value（number/object/...）
 * - 含内联 {{...}} 的文本 -> 按文本Template替换（Output string）
 * - 普通文本 -> 原样Back
 */
function resolveContextValue(
  text: string,
  ctx: EventExecutionContext,
): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("formData.")) {
    return getNestedValue(ctx.getFormData(), trimmed.slice(9));
  }
  if (trimmed.startsWith("row.") && ctx.row) {
    return getNestedValue(ctx.row, trimmed.slice(4));
  }
  if (trimmed.startsWith("variables.") && ctx.variables) {
    return getNestedValue(ctx.variables, trimmed.slice(10));
  }
  const templateMatch = trimmed.match(/^\{\{(.+)\}\}$/);
  if (templateMatch) {
    const inner = templateMatch[1].trim();
    if (inner.startsWith("formData."))
      return getNestedValue(ctx.getFormData(), inner.slice(9));
    if (inner.startsWith("row.") && ctx.row)
      return getNestedValue(ctx.row, inner.slice(4));
    if (inner.startsWith("variables.") && ctx.variables)
      return getNestedValue(ctx.variables, inner.slice(10));
  }
  return resolveContextString(text, ctx);
}

function resolveStringRecord(
  record: Record<string, string>,
  ctx: EventExecutionContext,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = resolveContextString(value, ctx);
  }
  return result;
}

/**
 * Execute单个EventAction。
 *
 * @param action - EventAction定义
 * @param ctx - Execute上下文
 */
export async function executeEventAction(
  action: SchemaEventAction,
  ctx: EventExecutionContext,
): Promise<void> {
  switch (action.type) {
    case "show": {
      if (!action.target) break;
      const target = ctx.findWidget(action.target);
      if (target) ctx.updateWidget(action.target, { hidden: false });
      logger.event(`Show: ${formatTarget(action.target, ctx)}`);
      break;
    }
    case "hide": {
      if (!action.target) break;
      const target = ctx.findWidget(action.target);
      if (target) ctx.updateWidget(action.target, { hidden: true });
      logger.event(`Hide: ${formatTarget(action.target, ctx)}`);
      break;
    }
    case "open-dialog": {
      if (action.target) {
        ctx.openDialog(action.target);
        logger.event(`Open dialog: ${formatTarget(action.target, ctx)}`);
      }
      break;
    }
    case "close-dialog": {
      ctx.closeDialog();
      logger.event("Close dialog");
      break;
    }
    case "switch-tab": {
      if (!action.target) break;
      const target = ctx.findWidget(action.target);
      if (target && target.type === "tabs") {
        ctx.updateWidget(action.target, {
          props: { ...target.props, activeKey: action.value },
        });
      }
      logger.event(
        `Switch tab: ${formatTarget(action.target, ctx)} → ${action.value}`,
      );
      break;
    }
    case "set-value": {
      if (action.target) {
        const targetWidget = ctx.findWidget(action.target);
        if (targetWidget) {
          ctx.updateWidget(action.target, {
            defaultValue: action.value as FormFieldValue,
          });
        }
        logger.event(
          `Assign: ${formatTarget(action.target, ctx)} = ${action.value}`,
        );
      }
      break;
    }
    case "submit": {
      ctx.submitForm();
      logger.event("Submit form");
      break;
    }
    case "reset": {
      ctx.resetForm();
      logger.event("Reset form");
      break;
    }
    case "emit": {
      ctx.emit("custom", action.value);
      logger.event(`Emit event: ${action.value}`);
      break;
    }
    case "set-variable": {
      if (action.variable && ctx.setVariable) {
        const resolved =
          typeof action.value === "string"
            ? resolveContextString(action.value, ctx)
            : action.value;
        ctx.setVariable(action.variable, resolved);
        logger.event(`Set variable: ${action.variable} = ${resolved}`);
      }
      break;
    }
    case "trigger-event": {
      if (action.target && action.event && ctx.triggerEvent) {
        ctx.triggerEvent(action.target, action.event);
        logger.event(
          `Trigger event: ${formatTarget(action.target, ctx)}.${action.event}`,
        );
      }
      break;
    }
    case "post-message": {
      if (action.message) {
        const data = resolveMessageData(action.message, ctx);
        // 安全考虑：使用当前Page的 origin 而非 '*'
        // 如果需要跨域通信, 应Config具体的 targetOrigin
        window.parent.postMessage(data, window.location.origin);
        logger.event("Send message:", data);
      }
      break;
    }
    case "close-tab": {
      window.close();
      logger.event("Close tab");
      break;
    }
    case "copy": {
      if (action.text) {
        const text = resolveTextValue(action.text, ctx);
        await navigator.clipboard.writeText(text);
        logger.event(`Copy to clipboard: ${text}`);
      }
      break;
    }
    case "refresh": {
      if (action.target && ctx.triggerEvent) {
        ctx.triggerEvent(action.target, "refresh");
        logger.event(`Refresh: ${formatTarget(action.target, ctx)}`);
      }
      break;
    }
    case "api": {
      if (action.apiUrl) {
        const method = action.apiMethod ?? "post";
        // apiParams='formData' Hrs把整个FormData作为请求体/QueryParams；
        // 与 actionExecutor、server 通用 data Route（直接取 body）保持一致, 
        // 不再额外包 { data: ... }, 否则下游收到 { data: { ... } } 与契约不符。
        const params: unknown =
          action.apiParams === "formData"
            ? ctx.getFormData()
            : action.apiParams;
        logger.api(`Request: ${method} ${action.apiUrl}`);
        try {
          const response = await apiClient.requestUrl<unknown>(
            method,
            action.apiUrl,
            params,
          );
          logger.api(`Response success: ${action.apiUrl}`, response);
          ctx.emit("api-success", { url: action.apiUrl, response });
        } catch (err) {
          logger.warn(`Response failed: ${action.apiUrl}`, err);
          ctx.emit("api-error", { url: action.apiUrl, error: String(err) });
        }
      }
      break;
    }
    case "submitSubmission": {
      if (!action.schemaId) {
        logger.warn("submitSubmission: missing schemaId");
        break;
      }
      if (ctx.validateForm) {
        const valid = await ctx.validateForm();
        if (!valid) {
          logger.warn("submitSubmission: form validation failed");
          break;
        }
      }
      const data = ctx.getFormData();
      logger.api(`Submit form: schemaId=${action.schemaId}`);
      try {
        const response = await createSubmission(action.schemaId, data);
        logger.api("Submit success", response);
        ctx.emit("submission-created", { schemaId: action.schemaId, response });
        if (action.definitionId) {
          const flowResponse = await startFlow(action.definitionId, {
            submissionId: response.id,
            ...action.variables,
          });
          ctx.emit("flow-started", {
            definitionId: action.definitionId,
            response: flowResponse,
          });
        }
      } catch (err) {
        logger.warn("submitSubmission failed", err);
        ctx.emit("api-error", {
          action: "submitSubmission",
          schemaId: action.schemaId,
          error: String(err),
        });
      }
      break;
    }
    case "navigate": {
      if (action.navigatePath) {
        logger.event(`Navigate: ${action.navigatePath}`);
        ctx.emit("navigate", {
          path: action.navigatePath,
          query: action.navigateQuery
            ? resolveStringRecord(action.navigateQuery, ctx)
            : undefined,
        });
      }
      break;
    }
    case "startFlow": {
      if (!action.definitionId) break;
      logger.api(`Start workflow: definitionId=${action.definitionId}`);
      try {
        const response = await startFlow(
          action.definitionId,
          action.variables ?? {},
        );
        logger.api("Workflow started successfully", response);
        ctx.emit("flow-started", {
          definitionId: action.definitionId,
          response,
        });
      } catch (err) {
        logger.warn(`Workflow start failed: definitionId=${action.definitionId}`, err);
        ctx.emit("flow-error", {
          action: "startFlow",
          definitionId: action.definitionId,
          error: String(err),
        });
      }
      break;
    }
    case "endFlow": {
      if (!action.instanceId) break;
      logger.api(`End workflow: instanceId=${action.instanceId}`);
      try {
        const response = await terminateFlow(action.instanceId, action.reason);
        logger.api("Workflow ended successfully", response);
        ctx.emit("flow-ended", { instanceId: action.instanceId, response });
      } catch (err) {
        logger.warn(`Workflow end failed: instanceId=${action.instanceId}`, err);
        ctx.emit("flow-error", {
          action: "endFlow",
          instanceId: action.instanceId,
          error: String(err),
        });
      }
      break;
    }
    case "exportData": {
      if (!action.apiUrl) {
        logger.warn("exportData: missing apiUrl");
        break;
      }
      const url = resolveContextString(action.apiUrl, ctx);
      const method = action.apiMethod ?? "get";
      logger.api(`Export: ${method} ${url}`);
      try {
        await triggerFileDownload(url, method, action.exportFileName);
        logger.api(`Export successful: ${url}`);
        ctx.emit("export-success", { url });
      } catch (err) {
        logger.warn(`Export failed: ${url}`, err);
        ctx.emit("export-error", { url, error: String(err) });
      }
      break;
    }
    case "chart-linkage": {
      if (ctx.chartEvent && ctx.handleChartLinkage) {
        // 从Event上下文中获取源 widget ID
        // chart-linkage action 的 target Field存储源 widget ID
        const sourceWidgetId = action.target ?? "";
        ctx.handleChartLinkage(
          sourceWidgetId,
          ctx.chartEvent,
          action.chartLinkageRuleId,
        );
        logger.event(`Chart linkage: #${sourceWidgetId}`);
      } else if (!ctx.handleChartLinkage) {
        logger.warn("chart-linkage: handleChartLinkage callback not injected");
      }
      break;
    }
  }
}

/**
 * ParseMessageData中的 formData.xxx / row.xxx / variables.xxx 引用。
 *
 * 与 resolveContextString（文本Template, Output string）不同, 本函数保留原ValueType：
 * 字符串若整体是一个上下文引用（如 "formData.id"）, Parse后还原为原始Value
 * （number/boolean/object 等）, 否则按文本Template替换内联 {{...}} 段。
 */
function resolveMessageData(
  message: Record<string, unknown>,
  ctx: EventExecutionContext,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(message)) {
    if (typeof value === "string") {
      result[key] = resolveContextValue(value, ctx);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Parse文本中的 formData.xxx / row.xxx 引用
 */
function resolveTextValue(text: string, ctx: EventExecutionContext): string {
  return resolveContextString(text, ctx);
}

function parseContentDispositionFilename(
  header: string | null,
): string | undefined {
  if (!header) return undefined;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1];
}

async function triggerFileDownload(
  url: string,
  method: "get" | "post" | "put" | "delete",
  fileName?: string,
): Promise<void> {
  const baseUrl = apiClient.getBaseUrl();
  const fullUrl = url.startsWith("http")
    ? url
    : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  const headers: Record<string, string> = {};
  const token = apiClient.getTokenValue();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(fullUrl, { method, headers });
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(
      json?.error?.message ?? `Export failed (${response.status})`,
    );
  }

  const blob = await response.blob();
  const downloadName =
    fileName ??
    parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ) ??
    "export.csv";
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = downloadName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Trigger Widget 上匹配的Event, 并依次Execute其Action链。
 *
 * @param widget - 目标 Widget
 * @param trigger - TriggerEvent名（click / change / close 等）
 * @param ctx - Execute上下文
 */
export async function triggerWidgetEvent(
  widget: Widget,
  trigger: string,
  ctx: EventExecutionContext,
  eventTarget?: string,
): Promise<void> {
  if (!widget.events?.length) return;
  const widgetLabel = formatWidget(widget);
  const triggerLabel = getTriggerLabel(trigger);
  logger.event(`Trigger: ${widgetLabel} [${triggerLabel}]`);

  // 构建完整的表达式上下文
  const context: Record<string, unknown> = {
    ...ctx.getFormData(),
    ...(ctx.variables ?? {}),
    ...(ctx.row ? { row: ctx.row } : {}),
    ...(ctx.rowIndex !== undefined ? { rowIndex: ctx.rowIndex } : {}),
    ...(ctx.selectedCount !== undefined
      ? { selectedCount: ctx.selectedCount }
      : {}),
  };

  for (const event of widget.events) {
    if (event.trigger !== trigger) continue;
    // 匹配Event目标：Event未指定 target 则匹配所有, 指定了则必须一致
    if (event.eventTarget && event.eventTarget !== eventTarget) continue;

    // Condition判断
    if (event.condition) {
      const result = evaluateCondition(event.condition, context, ctx.exposed);
      logger.rule(`Condition: "${event.condition}" → ${result ? "passed" : "failed"}`);
      if (!result) continue;
    }

    // Confirm提示（使用 UI 库的 confirm, 而非浏览器原生）
    if (event.confirm) {
      if (!ctx.confirm) {
        logger.warn("confirm dialog requested but ctx.confirm is not provided");
        continue;
      }
      try {
        await ctx.confirm(event.confirm);
      } catch {
        // UserCancel
        continue;
      }
    }

    // ExecuteAction链
    for (const action of event.actions) {
      try {
        await executeEventAction(action, ctx);
      } catch (err) {
        logger.warn(`action "${action.type}" failed:`, err);
      }
    }
  }
}

/**
 * Condition表达式求Value — 委托给 expression.ts 安全引擎。
 *
 * 复用 utils/expression 的安全检查（blocklist + 长度限制）, 
 * 保持原有 API：context 的 key 作为形参、expression 作为函数体。
 *
 * @param expression - Condition表达式字符串
 * @param context - Variable context（formData + variables 展平）
 * @param exposed - Widget exposed values context
 * @returns 表达式求Value结果
 */
export function evaluateCondition(
  expression: string,
  context: Record<string, unknown>,
  exposed?: Record<string, Record<string, unknown>>,
): boolean {
  if (!expression || typeof expression !== "string") return false;
  if (expression.length > 500) return false;

  const securityError = checkSecurity(expression);
  if (securityError) {
    logger.warn(`Blocked unsafe expression: ${expression} (${securityError})`);
    return false;
  }

  try {
    // 使用 with(env) 让表达式可以直接引用FormField name（如 status、lock）, 
    // 同Hrs支持 values.xxx、variables.xxx、exposed.xxx 命名空间访问。
    const env = {
      ...context,
      values: context,
      variables: context,
      exposed: exposed ?? {},
    };
    const fn = new Function("env", `with(env) { return (${expression}) }`);
    return Boolean(fn(env));
  } catch {
    logger.warn(`Expression evaluation failed: ${expression}`);
    return false;
  }
}
