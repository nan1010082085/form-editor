/**
 * FormData管理 composable
 *
 * 从 FormGrid/index.vue 中抽取的 formData 核心逻辑：
 * - 初始化（从 schema 递归提取Default value）
 * - getFormData / setFormData
 * - resetFields / validate
 *
 * 设计要点：
 * 1. reactive formData 作为单一Data源
 * 2. 初始化逻辑递归遍历 schema 树（含 children）
 * 3. validate / resetFields 依赖外部传入的 FormInstance ref
 */
import { reactive, type Ref } from "vue";
import type { FormInstance } from "element-plus";
import type {
  PartialWidget,
  FormData,
} from "@/components/WidgetRenderer/types";

export interface UseFormDataReturn {
  /** 响应式FormData对象 */
  formData: FormData;
  /** 获取FormData副本 */
  getFormData: () => FormData;
  /** 合并SettingsFormData */
  setFormData: (data: FormData) => void;
  /** ResetFormField */
  resetFields: () => void;
  /** Validate整个Form */
  validate: () => Promise<boolean>;
  /** 从 schema 初始化Default value */
  initFormData: (schema: PartialWidget[]) => void;
}

/**
 * 递归遍历 schema 树, 提取Default value并初始化 formData
 */
function applyDefaults(schema: PartialWidget[], formData: FormData): void {
  for (const item of schema) {
    if (item.field && item.defaultValue !== undefined) {
      formData[item.field] = item.defaultValue;
    } else if (item.field && !(item.field in formData)) {
      switch (item.type) {
        case "checkbox":
          formData[item.field] = [];
          break;
        case "number":
          formData[item.field] = undefined;
          break;
        default:
          formData[item.field] = undefined;
      }
    }
    if (item.children) {
      applyDefaults(item.children, formData);
    }
  }
}

/**
 * useFormData — FormData管理
 *
 * @param formRef - el-form 实例 ref, 用于 validate / resetFields
 * @returns formData 及Action方法
 */
export function useFormData(
  formRef: Ref<FormInstance | undefined>,
): UseFormDataReturn {
  const formData = reactive<FormData>({});

  /** 从 schema 初始化Default value */
  function initFormData(schema: PartialWidget[]) {
    applyDefaults(schema, formData);
  }

  /** 获取FormData（浅拷贝） */
  function getFormData(): FormData {
    return { ...formData };
  }

  /** SettingsFormData（合并到现有Data） */
  function setFormData(data: FormData) {
    Object.assign(formData, data);
  }

  /** ResetFormField */
  function resetFields() {
    formRef.value?.resetFields();
  }

  /** Validate整个Form */
  async function validate(): Promise<boolean> {
    return await formRef.value!.validate();
  }

  return {
    formData,
    getFormData,
    setFormData,
    resetFields,
    validate,
    initFormData,
  };
}
