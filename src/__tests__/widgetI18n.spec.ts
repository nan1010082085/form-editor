/**
 * usePropertySections 翻译层测试
 *
 * 测试 translateWidgetPropLabel / translateWidgetPropDesc 的翻译逻辑
 */
import { describe, it, expect, vi } from "vitest";

// 模拟翻译函数
function createMockT(translations: Record<string, string>) {
  return (key: string): string => translations[key] ?? key;
}

describe("Widget Property Translation Layer", () => {
  // 模拟 translateWidgetPropLabel 逻辑
  function translateWidgetPropLabel(
    t: (key: string) => string,
    propKey: string,
    fallbackLabel: string,
  ): string {
    const key = `editor.widgetProps.${propKey}`;
    const translated = t(key);
    return translated === key ? fallbackLabel : translated;
  }

  // 模拟 translateWidgetPropDesc 逻辑
  function translateWidgetPropDesc(
    t: (key: string) => string,
    propKey: string,
    fallbackDesc?: string,
  ): string | undefined {
    if (!fallbackDesc) return undefined;
    const key = `editor.widgetProps.${propKey}Desc`;
    const translated = t(key);
    return translated === key ? fallbackDesc : translated;
  }

  describe("translateWidgetPropLabel", () => {
    it("returns translated label when translation exists", () => {
      const t = createMockT({
        "editor.widgetProps.placeholder": "占位文字",
      });

      const result = translateWidgetPropLabel(t, "placeholder", "Placeholder");
      expect(result).toBe("占位文字");
    });

    it("returns fallback label when translation does not exist", () => {
      const t = createMockT({});

      const result = translateWidgetPropLabel(t, "unknown", "Unknown Label");
      expect(result).toBe("Unknown Label");
    });

    it("returns fallback label when translation returns key", () => {
      const t = (key: string) => key; // t() returns key when not found

      const result = translateWidgetPropLabel(t, "custom", "Custom Label");
      expect(result).toBe("Custom Label");
    });

    it("handles common property keys", () => {
      const t = createMockT({
        "editor.widgetProps.clearable": "可清空",
        "editor.widgetProps.disabled": "禁用",
        "editor.widgetProps.readonly": "只读",
        "editor.widgetProps.multiple": "多选",
        "editor.widgetProps.filterable": "可搜索",
      });

      expect(translateWidgetPropLabel(t, "clearable", "Clearable")).toBe(
        "可清空",
      );
      expect(translateWidgetPropLabel(t, "disabled", "Disabled")).toBe("禁用");
      expect(translateWidgetPropLabel(t, "readonly", "Readonly")).toBe("只读");
      expect(translateWidgetPropLabel(t, "multiple", "Multiple")).toBe("多选");
      expect(translateWidgetPropLabel(t, "filterable", "Filterable")).toBe(
        "可搜索",
      );
    });

    it("handles widget-specific property keys", () => {
      const t = createMockT({
        "editor.widgetProps.placeholder": "占位文字",
        "editor.widgetProps.maxlength": "最大长度",
        "editor.widgetProps.showPassword": "密码输入",
      });

      expect(translateWidgetPropLabel(t, "placeholder", "Placeholder")).toBe(
        "占位文字",
      );
      expect(translateWidgetPropLabel(t, "maxlength", "Max Length")).toBe(
        "最大长度",
      );
      expect(translateWidgetPropLabel(t, "showPassword", "Show Password")).toBe(
        "密码输入",
      );
    });
  });

  describe("translateWidgetPropDesc", () => {
    it("returns translated description when translation exists", () => {
      const t = createMockT({
        "editor.widgetProps.placeholderDesc": "输入框占位提示文字",
      });

      const result = translateWidgetPropDesc(
        t,
        "placeholder",
        "Input placeholder text",
      );
      expect(result).toBe("输入框占位提示文字");
    });

    it("returns fallback description when translation does not exist", () => {
      const t = createMockT({});

      const result = translateWidgetPropDesc(
        t,
        "unknown",
        "Unknown description",
      );
      expect(result).toBe("Unknown description");
    });

    it("returns undefined when no fallback description provided", () => {
      const t = createMockT({
        "editor.widgetProps.placeholderDesc": "输入框占位提示文字",
      });

      const result = translateWidgetPropDesc(t, "placeholder");
      expect(result).toBeUndefined();
    });

    it("returns undefined when no fallback and no translation", () => {
      const t = createMockT({});

      const result = translateWidgetPropDesc(t, "unknown");
      expect(result).toBeUndefined();
    });
  });

  describe("Widget displayName translation", () => {
    // 模拟 getWidgetDisplayName 逻辑
    function getWidgetDisplayName(
      t: (key: string) => string,
      type: string,
      fallback: string,
    ): string {
      const key = `editor.widgets.${type}.displayName`;
      const translated = t(key);
      return translated === key ? fallback : translated;
    }

    it("returns translated displayName when translation exists", () => {
      const t = createMockT({
        "editor.widgets.input.displayName": "输入框",
        "editor.widgets.select.displayName": "下拉选择",
        "editor.widgets.card.displayName": "卡片",
      });

      expect(getWidgetDisplayName(t, "input", "Input")).toBe("输入框");
      expect(getWidgetDisplayName(t, "select", "Select")).toBe("下拉选择");
      expect(getWidgetDisplayName(t, "card", "Card")).toBe("卡片");
    });

    it("returns fallback when translation does not exist", () => {
      const t = createMockT({});

      expect(getWidgetDisplayName(t, "custom-widget", "Custom Widget")).toBe(
        "Custom Widget",
      );
    });
  });

  describe("Widget description translation", () => {
    // 模拟 getWidgetDescription 逻辑
    function getWidgetDescription(
      t: (key: string) => string,
      type: string,
      fallback: string,
    ): string {
      const key = `editor.widgets.${type}.description`;
      const translated = t(key);
      return translated === key ? fallback : translated;
    }

    it("returns translated description when translation exists", () => {
      const t = createMockT({
        "editor.widgets.input.description":
          "单行文本输入框，支持 placeholder、清空、禁用等配置",
      });

      expect(getWidgetDescription(t, "input", "Single-line text input")).toBe(
        "单行文本输入框，支持 placeholder、清空、禁用等配置",
      );
    });

    it("returns fallback when translation does not exist", () => {
      const t = createMockT({});

      expect(getWidgetDescription(t, "custom", "Custom description")).toBe(
        "Custom description",
      );
    });
  });
});
