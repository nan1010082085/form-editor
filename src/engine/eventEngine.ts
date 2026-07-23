/**
 * eventEngine — 事件引擎
 *
 * 解析 WidgetEvent，执行 SchemaEventAction。
 * 纯逻辑层，不依赖 Vue 组件或 Store，通过 EventExecutionContext 注入运行时能力。
 */
import type { Widget, SchemaEventAction, FormFieldValue } from '../widgets/base/types'
import { getWidget } from '../widgets/registry'
import { useLogger } from '@/composables/useLogger'
import { checkSecurity } from '@/utils/expression'
import { apiClient, createSubmission } from '@/utils/apiClient'
import { startFlow, terminateFlow } from '@/api/dataApi'

const logger = useLogger('EventEngine')

/** 格式化部件名：按钮 #abc123 */
function formatWidget(widget: Widget): string {
  const reg = getWidget(widget.type)
  const name = reg?.displayName ?? widget.type
  return `${name} #${widget.id}`
}

function formatTarget(targetId: string, ctx: EventExecutionContext): string {
  const w = ctx.findWidget(targetId)
  return w ? formatWidget(w) : `#${targetId}`
}

/** i18n key 映射：trigger → editor.eventEngine.* */
const TRIGGER_I18N_KEYS: Record<string, string> = {
  click: 'editor.eventEngine.triggerClick',
  change: 'editor.eventEngine.triggerChange',
  'chart-click': 'editor.eventEngine.triggerChartClick',
  focus: 'editor.eventEngine.triggerFocus',
  blur: 'editor.eventEngine.triggerBlur',
  submit: 'editor.eventEngine.triggerSubmit',
  close: 'editor.eventEngine.triggerClose',
  open: 'editor.eventEngine.triggerOpen',
  confirm: 'editor.eventEngine.triggerConfirm',
  cancel: 'editor.eventEngine.triggerCancel',
  refresh: 'editor.eventEngine.triggerRefresh',
  'api-success': 'editor.eventEngine.triggerApiSuccess',
  'api-error': 'editor.eventEngine.triggerApiError',
  mounted: 'editor.eventEngine.triggerMounted',
}

/** 外部注入的翻译函数（由 Vue 层通过 setTriggerLabelProvider 设置） */
let _t: ((key: string) => string) | undefined

/** 设置触发器标签翻译提供者（编辑器初始化时调用） */
export function setTriggerLabelProvider(t: (key: string) => string): void {
  _t = t
}

function getTriggerLabel(trigger: string): string {
  const key = TRIGGER_I18N_KEYS[trigger]
  if (key && _t) return _t(key)
  return trigger
}

/** 事件执行上下文 — 由编辑器或运行时提供 */
export interface EventExecutionContext {
  /** 查找 widget（编辑器用 widgetStore.findWidget，运行时用 schema 树查找） */
  findWidget: (id: string) => Widget | undefined
  /** 更新 widget 属性 */
  updateWidget: (id: string, patch: Partial<Widget>) => void
  /** 打开弹窗 */
  openDialog: (target: string) => void
  /** 关闭弹窗 */
  closeDialog: () => void
  /** 提交表单 */
  submitForm: () => void
  /** 校验表单（可选，运行时提供） */
  validateForm?: () => Promise<boolean>
  /** 重置表单 */
  resetForm: () => void
  /** 获取表单数据 */
  getFormData: () => Record<string, unknown>
  /** 自定义事件 emit */
  emit: (eventName: string, payload?: unknown) => void
  /** 确认对话框（返回 Promise，reject 表示取消） */
  confirm?: (message: string) => Promise<void>
  /** 变量上下文 */
  variables?: Record<string, unknown>
  /** 设置变量值 */
  setVariable?: (name: string, value: unknown) => void
  /** 获取变量值 */
  getVariable?: (name: string) => unknown
  /** 组件暴露值上下文 */
  exposed?: Record<string, Record<string, unknown>>
  /** 触发目标组件的指定事件 */
  triggerEvent?: (targetId: string, eventName: string) => void
  /** 表格行上下文（高级表格行按钮/链接事件） */
  row?: Record<string, unknown>
  rowIndex?: number
  selectedRows?: Record<string, unknown>[]
  selectedCount?: number
  tableData?: Record<string, unknown>[]
  /** 图表点击事件上下文 */
  chartEvent?: {
    dataIndex: number
    name: string
    value: unknown
    seriesName: string
    data: Record<string, unknown>
  }
  /** 图表联动处理回调（由运行时注入，供 chart-linkage action 调用） */
  handleChartLinkage?: (
    sourceWidgetId: string,
    chartEvent: {
      dataIndex: number
      name: string
      value: unknown
      seriesName: string
      data: Record<string, unknown>
    },
    ruleId?: string,
  ) => void
}

/**
 * 从对象按点路径读取值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/**
 * 解析单个 {{...}} 模板段
 */
function resolveTemplateSegment(path: string, ctx: EventExecutionContext): string {
  if (path.startsWith('row.') && ctx.row) {
    return String(getNestedValue(ctx.row, path.slice(4)) ?? '')
  }
  if (path.startsWith('formData.')) {
    return String(getNestedValue(ctx.getFormData(), path.slice(9)) ?? '')
  }
  if (path.startsWith('variables.') && ctx.variables) {
    return String(getNestedValue(ctx.variables, path.slice(10)) ?? '')
  }
  if (ctx.variables && path in ctx.variables) {
    return String(ctx.variables[path] ?? '')
  }
  return String(getNestedValue({ ...ctx.getFormData(), ...(ctx.variables ?? {}), row: ctx.row }, path) ?? '')
}

/**
 * 解析事件参数中的上下文引用：formData.xxx、row.xxx、{{row.xxx}}、URL 内联 {{variables.xxx}}
 */
function resolveContextString(text: string, ctx: EventExecutionContext): string {
  const trimmed = text.trim()
  if (trimmed.includes('{{')) {
    return trimmed.replace(/\{\{(.+?)\}\}/g, (_, inner: string) => resolveTemplateSegment(inner.trim(), ctx))
  }
  const templateMatch = trimmed.match(/^\{\{(.+)\}\}$/)
  if (templateMatch) {
    return resolveTemplateSegment(templateMatch[1].trim(), ctx)
  }
  if (trimmed.startsWith('formData.')) {
    return String(getNestedValue(ctx.getFormData(), trimmed.slice(9)) ?? '')
  }
  if (trimmed.startsWith('row.') && ctx.row) {
    return String(getNestedValue(ctx.row, trimmed.slice(4)) ?? '')
  }
  return text
}

/**
 * 解析上下文引用并保留原值类型（供 post-message 等结构化消息使用）。
 *
 * 规则：
 * - 整体形如 "formData.xxx" / "row.xxx" / "variables.xxx" / "{{xxx}}" -> 返回原始值（number/object/...）
 * - 含内联 {{...}} 的文本 -> 按文本模板替换（输出 string）
 * - 普通文本 -> 原样返回
 */
function resolveContextValue(text: string, ctx: EventExecutionContext): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('formData.')) {
    return getNestedValue(ctx.getFormData(), trimmed.slice(9))
  }
  if (trimmed.startsWith('row.') && ctx.row) {
    return getNestedValue(ctx.row, trimmed.slice(4))
  }
  if (trimmed.startsWith('variables.') && ctx.variables) {
    return getNestedValue(ctx.variables, trimmed.slice(10))
  }
  const templateMatch = trimmed.match(/^\{\{(.+)\}\}$/)
  if (templateMatch) {
    const inner = templateMatch[1].trim()
    if (inner.startsWith('formData.')) return getNestedValue(ctx.getFormData(), inner.slice(9))
    if (inner.startsWith('row.') && ctx.row) return getNestedValue(ctx.row, inner.slice(4))
    if (inner.startsWith('variables.') && ctx.variables) return getNestedValue(ctx.variables, inner.slice(10))
  }
  return resolveContextString(text, ctx)
}

function resolveStringRecord(
  record: Record<string, string>,
  ctx: EventExecutionContext,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    result[key] = resolveContextString(value, ctx)
  }
  return result
}

/**
 * 执行单个事件动作。
 *
 * @param action - 事件动作定义
 * @param ctx - 执行上下文
 */
export async function executeEventAction(
  action: SchemaEventAction,
  ctx: EventExecutionContext,
): Promise<void> {
  switch (action.type) {
    case 'show': {
      if (!action.target) break
      const target = ctx.findWidget(action.target)
      if (target) ctx.updateWidget(action.target, { hidden: false })
      logger.event(`显示: ${formatTarget(action.target, ctx)}`)
      break
    }
    case 'hide': {
      if (!action.target) break
      const target = ctx.findWidget(action.target)
      if (target) ctx.updateWidget(action.target, { hidden: true })
      logger.event(`隐藏: ${formatTarget(action.target, ctx)}`)
      break
    }
    case 'open-dialog': {
      if (action.target) {
        ctx.openDialog(action.target)
        logger.event(`打开弹窗: ${formatTarget(action.target, ctx)}`)
      }
      break
    }
    case 'close-dialog': {
      ctx.closeDialog()
      logger.event('关闭弹窗')
      break
    }
    case 'switch-tab': {
      if (!action.target) break
      const target = ctx.findWidget(action.target)
      if (target && target.type === 'tabs') {
        ctx.updateWidget(action.target, {
          props: { ...target.props, activeKey: action.value },
        })
      }
      logger.event(`切换页签: ${formatTarget(action.target, ctx)} → ${action.value}`)
      break
    }
    case 'set-value': {
      if (action.target) {
        const targetWidget = ctx.findWidget(action.target)
        if (targetWidget) {
          ctx.updateWidget(action.target, { defaultValue: action.value as FormFieldValue })
        }
        logger.event(`赋值: ${formatTarget(action.target, ctx)} = ${action.value}`)
      }
      break
    }
    case 'submit': {
      ctx.submitForm()
      logger.event('提交表单')
      break
    }
    case 'reset': {
      ctx.resetForm()
      logger.event('重置表单')
      break
    }
    case 'emit': {
      ctx.emit('custom', action.value)
      logger.event(`触发自定义事件: ${action.value}`)
      break
    }
    case 'set-variable': {
      if (action.variable && ctx.setVariable) {
        const resolved =
          typeof action.value === 'string'
            ? resolveContextString(action.value, ctx)
            : action.value
        ctx.setVariable(action.variable, resolved)
        logger.event(`设置变量: ${action.variable} = ${resolved}`)
      }
      break
    }
    case 'trigger-event': {
      if (action.target && action.event && ctx.triggerEvent) {
        ctx.triggerEvent(action.target, action.event)
        logger.event(`触发组件事件: ${formatTarget(action.target, ctx)}.${action.event}`)
      }
      break
    }
    case 'post-message': {
      if (action.message) {
        const data = resolveMessageData(action.message, ctx)
        // 安全考虑：使用当前页面的 origin 而非 '*'
        // 如果需要跨域通信，应配置具体的 targetOrigin
        window.parent.postMessage(data, window.location.origin)
        logger.event('发送消息:', data)
      }
      break
    }
    case 'close-tab': {
      window.close()
      logger.event('关闭标签页')
      break
    }
    case 'copy': {
      if (action.text) {
        const text = resolveTextValue(action.text, ctx)
        await navigator.clipboard.writeText(text)
        logger.event(`复制到剪贴板: ${text}`)
      }
      break
    }
    case 'refresh': {
      if (action.target && ctx.triggerEvent) {
        ctx.triggerEvent(action.target, 'refresh')
        logger.event(`刷新: ${formatTarget(action.target, ctx)}`)
      }
      break
    }
    case 'api': {
      if (action.apiUrl) {
        const method = action.apiMethod ?? 'post'
        // apiParams='formData' 时把整个表单数据作为请求体/查询参数；
        // 与 actionExecutor、server 通用 data 路由（直接取 body）保持一致，
        // 不再额外包 { data: ... }，否则下游收到 { data: { ... } } 与契约不符。
        const params: unknown = action.apiParams === 'formData' ? ctx.getFormData() : action.apiParams
        logger.api(`请求: ${method} ${action.apiUrl}`)
        try {
          const response = await apiClient.requestUrl<unknown>(method, action.apiUrl, params)
          logger.api(`响应成功: ${action.apiUrl}`, response)
          ctx.emit('api-success', { url: action.apiUrl, response })
        } catch (err) {
          logger.warn(`响应失败: ${action.apiUrl}`, err)
          ctx.emit('api-error', { url: action.apiUrl, error: String(err) })
        }
      }
      break
    }
    case 'submitSubmission': {
      if (!action.schemaId) {
        logger.warn('submitSubmission: 缺少 schemaId')
        break
      }
      if (ctx.validateForm) {
        const valid = await ctx.validateForm()
        if (!valid) {
          logger.warn('submitSubmission: 表单校验未通过')
          break
        }
      }
      const data = ctx.getFormData()
      logger.api(`提交表单: schemaId=${action.schemaId}`)
      try {
        const response = await createSubmission(action.schemaId, data)
        logger.api('提交成功', response)
        ctx.emit('submission-created', { schemaId: action.schemaId, response })
        if (action.definitionId) {
          const flowResponse = await startFlow(action.definitionId, {
            submissionId: response.id,
            ...action.variables,
          })
          ctx.emit('flow-started', { definitionId: action.definitionId, response: flowResponse })
        }
      } catch (err) {
        logger.warn('submitSubmission 失败', err)
        ctx.emit('api-error', { action: 'submitSubmission', schemaId: action.schemaId, error: String(err) })
      }
      break
    }
    case 'navigate': {
      if (action.navigatePath) {
        logger.event(`跳转: ${action.navigatePath}`)
        ctx.emit('navigate', {
          path: action.navigatePath,
          query: action.navigateQuery ? resolveStringRecord(action.navigateQuery, ctx) : undefined,
        })
      }
      break
    }
    case 'startFlow': {
      if (!action.definitionId) break
      logger.api(`发起流程: definitionId=${action.definitionId}`)
      try {
        const response = await startFlow(action.definitionId, action.variables ?? {})
        logger.api('流程发起成功', response)
        ctx.emit('flow-started', { definitionId: action.definitionId, response })
      } catch (err) {
        logger.warn(`流程发起失败: definitionId=${action.definitionId}`, err)
        ctx.emit('flow-error', { action: 'startFlow', definitionId: action.definitionId, error: String(err) })
      }
      break
    }
    case 'endFlow': {
      if (!action.instanceId) break
      logger.api(`结束流程: instanceId=${action.instanceId}`)
      try {
        const response = await terminateFlow(action.instanceId, action.reason)
        logger.api('流程结束成功', response)
        ctx.emit('flow-ended', { instanceId: action.instanceId, response })
      } catch (err) {
        logger.warn(`流程结束失败: instanceId=${action.instanceId}`, err)
        ctx.emit('flow-error', { action: 'endFlow', instanceId: action.instanceId, error: String(err) })
      }
      break
    }
    case 'exportData': {
      if (!action.apiUrl) {
        logger.warn('exportData: 缺少 apiUrl')
        break
      }
      const url = resolveContextString(action.apiUrl, ctx)
      const method = action.apiMethod ?? 'get'
      logger.api(`导出: ${method} ${url}`)
      try {
        await triggerFileDownload(url, method, action.exportFileName)
        logger.api(`导出成功: ${url}`)
        ctx.emit('export-success', { url })
      } catch (err) {
        logger.warn(`导出失败: ${url}`, err)
        ctx.emit('export-error', { url, error: String(err) })
      }
      break
    }
    case 'chart-linkage': {
      if (ctx.chartEvent && ctx.handleChartLinkage) {
        // 从事件上下文中获取源 widget ID
        // chart-linkage action 的 target 字段存储源 widget ID
        const sourceWidgetId = action.target ?? ''
        ctx.handleChartLinkage(
          sourceWidgetId,
          ctx.chartEvent,
          action.chartLinkageRuleId,
        )
        logger.event(`图表联动: #${sourceWidgetId}`)
      } else if (!ctx.handleChartLinkage) {
        logger.warn('chart-linkage: handleChartLinkage 回调未注入')
      }
      break
    }
  }
}

/**
 * 解析消息数据中的 formData.xxx / row.xxx / variables.xxx 引用。
 *
 * 与 resolveContextString（文本模板，输出 string）不同，本函数保留原值类型：
 * 字符串若整体是一个上下文引用（如 "formData.id"），解析后还原为原始值
 * （number/boolean/object 等），否则按文本模板替换内联 {{...}} 段。
 */
function resolveMessageData(
  message: Record<string, unknown>,
  ctx: EventExecutionContext,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(message)) {
    if (typeof value === 'string') {
      result[key] = resolveContextValue(value, ctx)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * 解析文本中的 formData.xxx / row.xxx 引用
 */
function resolveTextValue(text: string, ctx: EventExecutionContext): string {
  return resolveContextString(text, ctx)
}

function parseContentDispositionFilename(header: string | null): string | undefined {
  if (!header) return undefined
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) return decodeURIComponent(utf8Match[1])
  const plainMatch = header.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1]
}

async function triggerFileDownload(url: string, method: 'get' | 'post', fileName?: string): Promise<void> {
  const baseUrl = apiClient.getBaseUrl()
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  const headers: Record<string, string> = {}
  const token = apiClient.getTokenValue()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(fullUrl, { method, headers })
  if (!response.ok) {
    const json = await response.json().catch(() => null)
    throw new Error(json?.error?.message ?? `Export failed (${response.status})`)
  }

  const blob = await response.blob()
  const downloadName = fileName
    ?? parseContentDispositionFilename(response.headers.get('Content-Disposition'))
    ?? 'export.csv'
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = downloadName
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

/**
 * 触发 Widget 上匹配的事件，并依次执行其动作链。
 *
 * @param widget - 目标 Widget
 * @param trigger - 触发事件名（click / change / close 等）
 * @param ctx - 执行上下文
 */
export async function triggerWidgetEvent(
  widget: Widget,
  trigger: string,
  ctx: EventExecutionContext,
  eventTarget?: string,
): Promise<void> {
  if (!widget.events?.length) return
  const widgetLabel = formatWidget(widget)
  const triggerLabel = getTriggerLabel(trigger)
  logger.event(`触发: ${widgetLabel} [${triggerLabel}]`)

  // 构建完整的表达式上下文
  const context: Record<string, unknown> = {
    ...ctx.getFormData(),
    ...(ctx.variables ?? {}),
    ...(ctx.row ? { row: ctx.row } : {}),
    ...(ctx.rowIndex !== undefined ? { rowIndex: ctx.rowIndex } : {}),
    ...(ctx.selectedCount !== undefined ? { selectedCount: ctx.selectedCount } : {}),
  }

  for (const event of widget.events) {
    if (event.trigger !== trigger) continue
    // 匹配事件目标：事件未指定 target 则匹配所有，指定了则必须一致
    if (event.eventTarget && event.eventTarget !== eventTarget) continue

    // 条件判断
    if (event.condition) {
      const result = evaluateCondition(event.condition, context, ctx.exposed)
      logger.rule(`条件: "${event.condition}" → ${result ? '通过' : '不通过'}`)
      if (!result) continue
    }

    // 确认提示（使用 UI 库的 confirm，而非浏览器原生）
    if (event.confirm) {
      if (!ctx.confirm) {
        logger.warn('confirm dialog requested but ctx.confirm is not provided')
        continue
      }
      try {
        await ctx.confirm(event.confirm)
      } catch {
        // 用户取消
        continue
      }
    }

    // 执行动作链
    for (const action of event.actions) {
      try {
        await executeEventAction(action, ctx)
      } catch (err) {
        logger.warn(`action "${action.type}" failed:`, err)
      }
    }
  }
}

/**
 * 条件表达式求值 — 委托给 expression.ts 安全引擎。
 *
 * 复用 utils/expression 的安全检查（blocklist + 长度限制），
 * 保持原有 API：context 的 key 作为形参、expression 作为函数体。
 *
 * @param expression - 条件表达式字符串
 * @param context - 变量上下文（formData + variables 展平）
 * @param exposed - 组件暴露值上下文
 * @returns 表达式求值结果
 */
export function evaluateCondition(
  expression: string,
  context: Record<string, unknown>,
  exposed?: Record<string, Record<string, unknown>>,
): boolean {
  if (!expression || typeof expression !== 'string') return false
  if (expression.length > 500) return false

  const securityError = checkSecurity(expression)
  if (securityError) {
    logger.warn(`Blocked unsafe expression: ${expression} (${securityError})`)
    return false
  }

  try {
    // 使用 with(env) 让表达式可以直接引用表单字段名（如 status、lock），
    // 同时支持 values.xxx、variables.xxx、exposed.xxx 命名空间访问。
    const env = { ...context, values: context, variables: context, exposed: exposed ?? {} }
    const fn = new Function(
      'env',
      `with(env) { return (${expression}) }`,
    )
    return Boolean(fn(env))
  } catch {
    logger.warn(`Expression evaluation failed: ${expression}`)
    return false
  }
}
