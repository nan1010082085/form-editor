/**
 * 统一解析 API 错误文案
 *
 * 常见业务 code 优先映射 i18n, 并附带服务端 message / validation details, 
 * 避免调用方只用固定文案吞掉服务端细节。
 */
import { ApiError } from "@/utils/apiClient";
import { tt } from "@/locales";

/** 服务端 error 对象中可能挂载的校验细节 */
type ValidationIssue = { path?: string; message?: string };

/** ApiError.details 可能形态 */
type ApiErrorDetails =
  | {
      details?: ValidationIssue[];
      message?: string;
      code?: string;
    }
  | ValidationIssue[]
  | undefined;

/** 常见业务码 → i18n key */
const API_ERROR_CODE_I18N: Record<string, string> = {
  UNAUTHORIZED: "editor.apiErrors.UNAUTHORIZED",
  FORBIDDEN: "editor.apiErrors.FORBIDDEN",
  NOT_FOUND: "editor.apiErrors.NOT_FOUND",
  BAD_REQUEST: "editor.apiErrors.BAD_REQUEST",
  VALIDATION_ERROR: "editor.apiErrors.VALIDATION_ERROR",
  INTERNAL_ERROR: "editor.apiErrors.INTERNAL_ERROR",
};

/**
 * 从 ApiError.details 提取 code 与校验 issues
 *
 * @param details - ApiError.details
 */
function parseApiErrorDetails(details: unknown): {
  code: string;
  issues: ValidationIssue[];
} {
  const raw = details as ApiErrorDetails;
  if (Array.isArray(raw)) {
    return { code: "", issues: raw };
  }
  if (raw && typeof raw === "object") {
    return {
      code: typeof raw.code === "string" ? raw.code : "",
      issues: Array.isArray(raw.details) ? raw.details : [],
    };
  }
  return { code: "", issues: [] };
}

/**
 * 将校验 issues 拼成可读片段
 *
 * @param issues - 校验项
 */
function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues
    .map((item) =>
      item.path ? `${item.path}: ${item.message ?? ""}` : (item.message ?? ""),
    )
    .filter(Boolean)
    .join("; ");
}

/**
 * 将 ApiError 格式化为用户可读文案（含 code i18n + 服务端细节）
 *
 * @param e - ApiError
 */
export function formatApiError(e: ApiError): string {
  const { code, issues } = parseApiErrorDetails(e.details);
  const detailsPart = formatValidationIssues(issues);
  const serverMsg = e.message?.trim() ?? "";
  const localizedKey = code ? API_ERROR_CODE_I18N[code] : undefined;
  const localized = localizedKey ? tt(localizedKey) : "";

  if (localized) {
    const detailSuffix = detailsPart
      ? serverMsg
        ? `${serverMsg} (${detailsPart})`
        : detailsPart
      : serverMsg;
    if (!detailSuffix || detailSuffix === localized) {
      return localized;
    }
    return `${localized}: ${detailSuffix}`;
  }

  const codePrefix = code ? `[${code}] ` : "";
  if (detailsPart) {
    return `${codePrefix}${serverMsg} (${detailsPart})`;
  }
  return `${codePrefix}${serverMsg}`;
}

/**
 * 将任意抛错统一为用户可读文案
 *
 * @param e - 捕获的未知错误
 */
export function resolveApiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return formatApiError(e);
  if (e instanceof Error) return e.message;
  return tt("editor.apiErrors.unexpected");
}
