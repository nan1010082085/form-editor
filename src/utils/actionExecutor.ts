/**
 * Action Execute器
 * 顺序ExecuteButtonAction链, 支持Confirm、API 调用、Route跳转等
 */
import { ElMessage, ElMessageBox } from "element-plus";
import type { SchemaAction, FormData } from "@/components/WidgetRenderer/types";
import { apiClient } from "./apiClient";
import { useLogger } from "@/composables/useLogger";
import { tt } from "@/locales";

const logger = useLogger("ActionExecutor");

/** Action Execute上下文 */
export interface ActionContext {
  emit: (event: string, payload?: unknown) => void;
  validate: () => Promise<boolean>;
  getFormData: () => FormData;
  resetFields: () => void;
  router?: {
    push: (to: { path: string; query?: Record<string, string> }) => void;
  };
  openDialog?: (config: {
    title: string;
    width?: string;
    schema?: SchemaAction["dialogSchema"];
  }) => void;
  triggerUpload?: () => void;
}

/** ExecuteAction链 */
export async function executeActions(
  actions: SchemaAction[],
  context: ActionContext,
): Promise<void> {
  for (const action of actions) {
    if (action.disabled) continue;

    // Confirm提示
    if (action.confirm) {
      try {
        await ElMessageBox.confirm(action.confirm, tt("editor.common.info"), {
          confirmButtonText: tt("editor.common.confirm"),
          cancelButtonText: tt("editor.common.cancel"),
          type: "warning",
        });
      } catch {
        return; // User cancelled, breaking chain
      }
    }

    try {
      await executeAction(action, context);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : tt("editor.common.failed");
      ElMessage.error(message);
      return; // Error break
    }
  }
}

/** Execute单个Action */
async function executeAction(
  action: SchemaAction,
  context: ActionContext,
): Promise<void> {
  switch (action.type) {
    case "emit":
      context.emit(action.eventName ?? "action", action.eventPayload);
      break;

    case "validate":
      await context.validate();
      break;

    case "submit":
      await context.validate();
      context.emit("submit", context.getFormData());
      break;

    case "reset":
      context.resetFields();
      break;

    case "dialog":
      context.openDialog?.({
        title: action.dialogTitle ?? "",
        width: action.dialogWidth,
        schema: action.dialogSchema,
      });
      break;

    case "upload":
      context.triggerUpload?.();
      break;

    case "navigate":
      if (action.navigatePath) {
        context.router?.push({
          path: action.navigatePath,
          query: action.navigateQuery,
        });
      }
      break;

    case "api": {
      if (!action.apiUrl) throw new Error("API URL not configured");
      const method = action.apiMethod ?? "post";
      const params =
        action.apiParams === "formData"
          ? context.getFormData()
          : action.apiParams;
      const res = await apiClient.requestRaw<unknown>(
        method,
        action.apiUrl,
        params,
      );
      context.emit("api-response", res);
      break;
    }

    default:
      logger.warn("Unknown action type:", (action as { type: string }).type);
  }
}
