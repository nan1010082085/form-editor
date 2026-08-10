/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/utils/apiClient";
import {
  formatApiError,
  resolveApiErrorMessage,
} from "@/utils/resolveApiErrorMessage";

vi.mock("@/locales", () => ({
  tt: (key: string) => {
    const map: Record<string, string> = {
      "editor.apiErrors.UNAUTHORIZED": "未授权，请重新登录",
      "editor.apiErrors.FORBIDDEN": "无权限执行此操作",
      "editor.apiErrors.NOT_FOUND": "资源不存在",
      "editor.apiErrors.BAD_REQUEST": "请求参数错误",
      "editor.apiErrors.VALIDATION_ERROR": "数据校验失败",
      "editor.apiErrors.INTERNAL_ERROR": "服务器内部错误",
      "editor.apiErrors.unexpected": "发生未知错误",
    };
    return map[key] ?? key;
  },
}));

describe("resolveApiErrorMessage", () => {
  it("maps known codes to i18n and appends server message", () => {
    const err = new ApiError("username is required", 400, {
      code: "BAD_REQUEST",
      message: "username is required",
    });
    expect(formatApiError(err)).toBe("请求参数错误: username is required");
    expect(resolveApiErrorMessage(err)).toBe(
      "请求参数错误: username is required",
    );
  });

  it("appends validation details when present", () => {
    const err = new ApiError("Validation failed", 400, {
      code: "VALIDATION_ERROR",
      details: [{ path: "email", message: "invalid" }],
    });
    expect(formatApiError(err)).toBe(
      "数据校验失败: Validation failed (email: invalid)",
    );
  });

  it("keeps [CODE] prefix for unknown codes", () => {
    const err = new ApiError("rate limited", 429, { code: "RATE_LIMIT" });
    expect(formatApiError(err)).toBe("[RATE_LIMIT] rate limited");
  });

  it("falls back for plain Error / unknown", () => {
    expect(resolveApiErrorMessage(new Error("boom"))).toBe("boom");
    expect(resolveApiErrorMessage("x")).toBe("发生未知错误");
  });
});
