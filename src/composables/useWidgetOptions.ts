/**
 * useWidgetOptions — 从 widget store 提取所有Widget ID 生成OptionsColumn表
 *
 * 用于Property面板中需要选择Widget ID 的场景（如Linkage targetFields、Event绑定等）。
 * 返回响应式 options 数组, store 变化Hrs自动Update。
 * ContainerType从 registry 动态获取, 支持CreateWidget自动适配。
 */
import { computed } from "vue";
import { useWidgetStore } from "@/stores/widget";
import type { Widget } from "@/widgets/base/types";
import { useAllContainerTypes } from "@/composables/useConstant";

export interface WidgetOption {
  label: string;
  value: string;
}

function flattenWidgets(list: Widget[]): WidgetOption[] {
  const result: WidgetOption[] = [];
  for (const w of list) {
    if (w.field) {
      const label = w.label || w.name || w.field || w.type;
      result.push({ label: `${label}（${w.field}）`, value: w.field });
    }
    if (w.children?.length) {
      result.push(...flattenWidgets(w.children));
    }
  }
  return result;
}

/** FormFieldType（有 field Property） */
function hasField(w: Widget): boolean {
  return !!w.field;
}

export function useWidgetOptions() {
  const widgetStore = useWidgetStore();

  const widgetOptions = computed(() => flattenWidgets(widgetStore.widgets));

  /** 所有ComponentOptions（含无 field 的Component, 按 ID 选择） */
  const allWidgetOptions = computed(() => {
    const result: WidgetOption[] = [];
    function collect(list: Widget[]) {
      for (const w of list) {
        const label = w.label || w.name || w.type;
        result.push({ label: `${label}（${w.id}）`, value: w.id });
        if (w.children?.length) collect(w.children);
      }
    }
    collect(widgetStore.widgets);
    return result;
  });

  /** 可Show/Hide的Component（非根级Container, 动态获取ContainerType） */
  const showHideOptions = computed(() => {
    const containerTypes = useAllContainerTypes();
    const result: WidgetOption[] = [];
    function collect(list: Widget[], isRoot: boolean) {
      for (const w of list) {
        // 跳过根级Container
        if (isRoot && containerTypes.has(w.type)) {
          if (w.children?.length) collect(w.children, false);
          continue;
        }
        const label = w.label || w.name || w.type;
        result.push({ label: `${label}（${w.id}）`, value: w.id });
        if (w.children?.length) collect(w.children, false);
      }
    }
    collect(widgetStore.widgets, true);
    return result;
  });

  /** 可Open的DialogComponent（动态获取 dialog Type） */
  const dialogOptions = computed(() => {
    const result: WidgetOption[] = [];
    function collect(list: Widget[]) {
      for (const w of list) {
        if (w.type === "dialog") {
          const label = w.label || w.name || w.type;
          result.push({ label: `${label}（${w.id}）`, value: w.id });
        }
        if (w.children?.length) collect(w.children);
      }
    }
    collect(widgetStore.widgets);
    return result;
  });

  /** 可切换页签的 tabs Component（动态获取 tabs Type） */
  const tabsOptions = computed(() => {
    const result: WidgetOption[] = [];
    function collect(list: Widget[]) {
      for (const w of list) {
        if (w.type === "tabs") {
          const label = w.label || w.name || w.type;
          result.push({ label: `${label}（${w.id}）`, value: w.id });
        }
        if (w.children?.length) collect(w.children);
      }
    }
    collect(widgetStore.widgets);
    return result;
  });

  /** 可SettingsValue的FormFieldComponent */
  const setValueOptions = computed(() => {
    const result: WidgetOption[] = [];
    function collect(list: Widget[]) {
      for (const w of list) {
        if (hasField(w)) {
          const label = w.label || w.name || w.field || w.type;
          result.push({ label: `${label}（${w.field}）`, value: w.id });
        }
        if (w.children?.length) collect(w.children);
      }
    }
    collect(widgetStore.widgets);
    return result;
  });

  /** 可TriggerEvent的Component（排除Container, 动态获取ContainerType） */
  const triggerEventOptions = computed(() => {
    const containerTypes = useAllContainerTypes();
    const result: WidgetOption[] = [];
    function collect(list: Widget[]) {
      for (const w of list) {
        if (!containerTypes.has(w.type)) {
          const label = w.label || w.name || w.type;
          result.push({ label: `${label}（${w.id}）`, value: w.id });
        }
        if (w.children?.length) collect(w.children);
      }
    }
    collect(widgetStore.widgets);
    return result;
  });

  return {
    widgetOptions,
    allWidgetOptions,
    showHideOptions,
    dialogOptions,
    tabsOptions,
    setValueOptions,
    triggerEventOptions,
  };
}
