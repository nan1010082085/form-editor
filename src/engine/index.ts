/**
 * engine — Event引擎统一出口
 */
export {
  executeEventAction,
  triggerWidgetEvent,
  evaluateCondition,
  setTriggerLabelProvider,
  EVENT_TRIGGER_I18N_KEYS,
  type EventExecutionContext,
} from "./eventEngine";
