<script setup lang="ts">
/**
 * FgForm — FormContainer Widget（完整版）
 *
 * 职责：
 * - 包裹 el-form, 提供FormLayout和Validate能力
 * - 渲染子Component（passed slot 接收 SchemaNode 传入的 children）
 * - 收集子ComponentFieldValue、Validate、Submit/Reset
 * - provide Form上下文（formRef + formModel + updateField）给子Component
 * - 集成 useWidgetLifecycle 生命week期钩子
 * - 支持 loadApi 远程Data加载
 */
import {
  inject,
  ref,
  reactive,
  provide,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import type { FormInstance } from "element-plus";
import { widgetDataKey, formContextKey } from "../base/types";
import type { Widget } from "../base/types";
import { FORM_REGISTRY_KEY } from "@/components/WidgetRenderer/types";
import { useWidgetLifecycle } from "@/composables/useWidgetLifecycle";
import { useWorkerRequest } from "@/composables/useWorkerRequest";
import { useLogger } from "@/composables/useLogger";
import { useExposeWidget } from "@/composables/useExposeWidget";
import styles from "./style.module.scss";

const widgetData = inject(widgetDataKey)!;

const emit = defineEmits<{
  submit: [data: Record<string, unknown>];
  "validate-error": [fields: unknown[]];
  reset: [];
  "data-change": [field: string, value: unknown];
}>();

const logger = useLogger("FgForm");

useExposeWidget(() => ({
  get formData() {
    return formModel;
  },
}));

// ---- ElForm ref ----
const formRef = ref<FormInstance>();

// ---- FormData模型 ----
const formModel = reactive<Record<string, unknown>>({});

/** 递归收集所有后代 Widget 的FieldValue到 formModel */
function syncModel(widgets: Widget[]): void {
  for (const w of widgets) {
    if (w.field) {
      formModel[w.field] = w.defaultValue ?? null;
    }
    if (w.children?.length) {
      syncModel(w.children);
    }
  }
}

/** Validate前将 widget.defaultValue Sync到 el-form model */
function syncFromWidgets() {
  syncModel(widgetData.value.children ?? []);
}

/** 监听 children 变化, 保持 formModel 与 widget ValueSync */
watch(
  () => widgetData.value.children,
  (children) => {
    if (children) syncModel(children);
  },
  { immediate: true, deep: true },
);

/** updateField — 子Componentpassed inject(formContextKey) 调用 */
function updateField(field: string, value: unknown) {
  const oldValue = formModel[field];
  formModel[field] = value;
  if (oldValue !== value) {
    emit("data-change", field, value);
  }
}

// ---- Provide Form上下文 ----
provide(formContextKey, { formRef, formModel, updateField });

// ---- 注册到 WidgetRenderer FormAggregate表（absolute Layout） ----
const formRegistry = inject(FORM_REGISTRY_KEY, null);

const { trigger } = useWidgetLifecycle(widgetData, formModel);

onMounted(() => {
  trigger("onMount");
  if (widgetData.value.api) {
    loadRemoteData();
  }
  if (formRegistry && widgetData.value.id) {
    formRegistry.set(widgetData.value.id, {
      validate: async () => {
        syncFromWidgets();
        if (!formRef.value) return true;
        await formRef.value.validate();
        return true;
      },
      resetFields: () => {
        formRef.value?.resetFields();
      },
      syncFromWidgets,
    });
  }
});

onUnmounted(() => {
  trigger("onUnmount");
  if (formRegistry && widgetData.value.id) {
    formRegistry.delete(widgetData.value.id);
  }
});

// ---- loadApi 远程Data加载 ----
async function loadRemoteData() {
  const api = widgetData.value.api;
  if (!api) return;
  const workerRequest = useWorkerRequest();
  try {
    const data = await workerRequest.request({
      url: api.url,
      method: api.method ?? "get",
      params: api.params,
      dataPath: api.dataPath,
    });
    if (data && typeof data === "object") {
      Object.assign(formModel, data);
      await trigger("onAfterLoad");
    }
  } catch (e) {
    logger.error("loadApi failed:", e);
  }
}

// ---- defineExpose ----
defineExpose({
  validate: async () => {
    syncFromWidgets();
    if (!formRef.value) return false;
    await formRef.value.validate();
    return true;
  },
  validateField: (field: string) => formRef.value?.validateField(field),
  clearValidate: (field?: string) => formRef.value?.clearValidate(field),
  resetFields: () => {
    formRef.value?.resetFields();
    emit("reset");
  },
  scrollToField: (field: string) => formRef.value?.scrollToField(field),
  getFormData: () => ({ ...formModel }),
  setFormData: (data: Record<string, unknown>) => {
    Object.assign(formModel, data);
  },
  submit: async () => {
    await trigger("onBeforeSubmit");
    syncFromWidgets();
    const valid = await formRef.value?.validate();
    if (valid) {
      emit("submit", { ...formModel });
    } else {
      emit("validate-error", formRef.value?.fields ?? []);
    }
  },
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formModel"
    :class="styles.formContainer"
    :label-width="(widgetData.props?.labelWidth as string) || '100px'"
    :label-position="
      (widgetData.props?.labelPosition as 'left' | 'right' | 'top') || 'right'
    "
  >
    <slot />
  </el-form>
</template>
