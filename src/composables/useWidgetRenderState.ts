/**
 * useWidgetRenderState — Widget 渲染Status消费
 *
 * 供 Widget Component注入Rule引擎计算的渲染Status, 
 * 并将静态 props 与动态RuleOutput合并。
 *
 * 用法：
 * ```ts
 * const { isDisabled, isRequired } = useWidgetRenderState()
 * // 在Template中：:disabled="isDisabled"
 * ```
 */
import { inject, computed } from "vue";
import { widgetDataKey, widgetRenderStateKey } from "../widgets/base/types";
import type { WidgetRenderState } from "../widgets/base/types";
import {
  FORM_GRID_READONLY_KEY,
  FORM_GRID_READONLY_FIELDS_KEY,
  FORM_GRID_EDITABLE_FIELDS_KEY,
} from "../components/WidgetRenderer/types";

/** 默认渲染Status（Widget 不在 SchemaNode 中渲染Hrs的兜底） */
const DEFAULT_STATE: WidgetRenderState = {
  visible: true,
  disabled: false,
  required: false,
};

export function useWidgetRenderState() {
  const widgetData = inject(widgetDataKey)!;
  const renderState = inject(
    widgetRenderStateKey,
    computed(() => DEFAULT_STATE),
  );

  // 全局只读模式
  const globalReadonly = inject(
    FORM_GRID_READONLY_KEY,
    computed(() => false),
  );

  // partial 模式：Field级只读控制
  const readonlyFields = inject(
    FORM_GRID_READONLY_FIELDS_KEY,
    computed(() => undefined),
  );
  const editableFields = inject(
    FORM_GRID_EDITABLE_FIELDS_KEY,
    computed(() => undefined),
  );

  /**
   * 判断当前Field是否因 partial 模式而只读
   *
   * 优先级：
   * 1. 全局 readonly → All只读
   * 2. editableFields Config → 未在Column表中的Field只读
   * 3. readonlyFields Config → 在Column表中的Field只读
   */
  const isPartialReadonly = computed(() => {
    if (globalReadonly.value) return true;
    const field = widgetData.value.field;
    if (!field) return false;

    // editableFields 模式：只有Column表中的Field可Edit
    if (editableFields.value !== undefined) {
      return !editableFields.value.includes(field);
    }
    // readonlyFields 模式：Column表中的Field只读
    if (readonlyFields.value !== undefined) {
      return readonlyFields.value.includes(field);
    }
    return false;
  });

  /** 最终 disabled = 静态 props.disabled OR Rule引擎 disabled OR partial 只读 */
  const isDisabled = computed(
    () =>
      ((widgetData.value.props?.disabled as boolean) ?? false) ||
      renderState.value.disabled ||
      isPartialReadonly.value,
  );

  /** 最终 required = 静态 validationRules.required OR Rule引擎 required */
  const isRequired = computed(() => renderState.value.required);

  return {
    renderState,
    isDisabled,
    isRequired,
  };
}
