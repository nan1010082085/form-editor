/**
 * Schema 树表单数据收集/回填
 *
 * absolute 布局下字段值存储在 widget.defaultValue，
 * WidgetRenderer 通过此工具聚合 submit/getFormData/setFormData。
 */
import type { FormItemRule } from 'element-plus'
import type { PartialWidget } from '@/widgets/base/types'
import type { FormData } from '@/components/WidgetRenderer/types'

function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function validateFieldRules(field: string, value: unknown, rules: FormItemRule[]): void {
  for (const rule of rules) {
    if (rule.required && isEmptyFieldValue(value)) {
      const message = typeof rule.message === 'string' ? rule.message : `${field} is required`
      throw { [field]: [{ message, field }] }
    }
  }
}

/** 递归收集 schema 树中所有 field → defaultValue */
export function collectSchemaFormData(items: PartialWidget[]): FormData {
  const data: FormData = {}

  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.field) {
        data[item.field] = item.defaultValue as FormData[string]
      }
      if (item.children?.length) {
        walk(item.children)
      }
    }
  }

  walk(items)
  return data
}

/** 将外部数据回填到 schema 树对应 field 的 defaultValue */
export function applySchemaFormData(items: PartialWidget[], data: FormData): void {
  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.field && item.field in data) {
        item.defaultValue = data[item.field]
      }
      if (item.children?.length) {
        walk(item.children)
      }
    }
  }

  walk(items)
}

/** 递归收集指定 form 容器 id 下的字段值（formId 绑定场景） */
export function collectFormIdValues(items: PartialWidget[], formId: string): FormData {
  const data: FormData = {}

  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.formId === formId && item.field) {
        data[item.field] = item.defaultValue as FormData[string]
      }
      if (item.children?.length) {
        walk(item.children)
      }
    }
  }

  walk(items)
  return data
}

/** 校验 schema 树中带 validationRules 的字段（absolute 布局聚合校验） */
export async function validateSchemaFields(items: PartialWidget[]): Promise<boolean> {
  const errors: Record<string, Array<{ message: string; field: string }>> = {}

  function walk(list: PartialWidget[]) {
    for (const item of list) {
      if (item.field && item.validationRules?.length) {
        try {
          validateFieldRules(item.field, item.defaultValue, item.validationRules as FormItemRule[])
        } catch (fieldErrors) {
          Object.assign(errors, fieldErrors as Record<string, Array<{ message: string; field: string }>>)
        }
      }
      if (item.children?.length) {
        walk(item.children)
      }
    }
  }

  walk(items)
  if (Object.keys(errors).length > 0) {
    throw errors
  }
  return true
}
