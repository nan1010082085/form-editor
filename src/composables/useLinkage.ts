/**
 * FieldLinkage composable
 * 支持 visible / disabled / required / options 四种LinkageType
 *
 * 设计要点：
 * 1. 递归遍历 schema 收集所有带 linkages 的节点
 * 2. 按 watchFields 建立依赖图, 批量合并 watch
 * 3. condition 支持函数和字符串表达式两种模式
 * 4. DFS 检测循环依赖, 发现后降级处理
 */
import {
  computed,
  toValue,
  type ComputedRef,
  type MaybeRefOrGetter,
} from "vue";
import type {
  PartialWidget,
  FormData,
  FormFieldValue,
  SchemaLinkage,
  LinkageState,
} from "@/components/WidgetRenderer/types";
import { useLogger } from "@/composables/useLogger";
import { checkSecurity } from "@/utils/expression";

const logger = useLogger("Linkage");

/** 收集到的Linkage节点Info */
interface LinkageEntry {
  /** Field name（schema.field） */
  field: string;
  /** 该Field的所有LinkageConfig */
  linkages: SchemaLinkage[];
}

/** 依赖图：field -> 它所依赖的 watchFields 集合 */
type DependencyGraph = Map<string, Set<string>>;

/**
 * 递归遍历 schema 树, 收集所有带 linkages 的节点
 */
function collectLinkageEntries(schema: PartialWidget[]): LinkageEntry[] {
  const entries: LinkageEntry[] = [];

  function walk(items: PartialWidget[]) {
    for (const item of items) {
      if (item.field && item.linkages?.length) {
        entries.push({ field: item.field, linkages: item.linkages });
      }
      if (item.children) {
        walk(item.children);
      }
    }
  }

  walk(schema);
  return entries;
}

/**
 * 构建依赖图
 * key: LinkageField, value: 它所监听的Field集合
 */
function buildDependencyGraph(entries: LinkageEntry[]): DependencyGraph {
  const graph: DependencyGraph = new Map();

  for (const entry of entries) {
    const deps = new Set<string>();
    for (const linkage of entry.linkages) {
      for (const watchField of linkage.watchFields) {
        deps.add(watchField);
      }
    }
    graph.set(entry.field, deps);
  }

  return graph;
}

/**
 * DFS 检测循环依赖
 * Back所有存在循环的Field集合
 */
function detectCycles(graph: DependencyGraph): Set<string> {
  const cyclicFields = new Set<string>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(field: string): boolean {
    if (inStack.has(field)) return true;
    if (visited.has(field)) return false;

    visited.add(field);
    inStack.add(field);

    const deps = graph.get(field);
    if (deps) {
      for (const dep of deps) {
        // 只有当 dep 也在图中（也是LinkageField）Hrs才需要检测
        if (graph.has(dep) && dfs(dep)) {
          cyclicFields.add(field);
          cyclicFields.add(dep);
        }
      }
    }

    inStack.delete(field);
    return false;
  }

  for (const field of graph.keys()) {
    if (!visited.has(field)) {
      dfs(field);
    }
  }

  return cyclicFields;
}

/**
 * 编译字符串表达式为求Value函数
 * 沙箱限制：仅允许访问 values、variables、exposed 对象的Property
 */
function compileCondition(
  expression: string,
): (
  values: Record<string, FormFieldValue>,
  variables?: Record<string, unknown>,
  exposed?: Record<string, Record<string, unknown>>,
) => boolean {
  // 安全检查：阻止危险表达式（与 eventEngine 共享 blocklist）
  const securityError = checkSecurity(expression);
  if (securityError) {
    logger.warn(`Blocked unsafe expression: ${expression} (${securityError})`);
    return () => false;
  }

  try {
    // 使用 with(env) 让表达式可以直接引用FormField name（如 status、lock）, 
    // 同Hrs支持 values.xxx、variables.xxx、exposed.xxx 命名空间访问。
    const fn = new Function("env", `with(env) { return (${expression}); }`);
    return (
      values: Record<string, FormFieldValue>,
      variables?: Record<string, unknown>,
      exposed?: Record<string, Record<string, unknown>>,
    ): boolean => {
      try {
        const env = {
          ...values,
          ...variables,
          values,
          variables: variables ?? {},
          exposed: exposed ?? {},
        };
        return Boolean(fn(env));
      } catch {
        logger.rule(`Condition expression evaluation failed: "${expression}"`);
        return false;
      }
    };
  } catch {
    logger.rule(`ConditionExpression compilation failed: "${expression}"`);
    return () => false;
  }
}

/**
 * 对单个LinkageConfig求Value
 */
function evaluateCondition(
  linkage: SchemaLinkage,
  formData: FormData,
  variables?: Record<string, unknown>,
  exposed?: Record<string, Record<string, unknown>>,
): boolean {
  const values: Record<string, FormFieldValue> = {};
  for (const field of linkage.watchFields) {
    values[field] = formData[field];
  }

  if (typeof linkage.condition === "function") {
    try {
      return linkage.condition(values);
    } catch {
      logger.rule(`Condition function evaluation failed`);
      return false;
    }
  }

  return compileCondition(linkage.condition)(values, variables, exposed);
}

/**
 * DefaultLinkageStatus
 */
const DEFAULT_STATE: LinkageState = {
  visible: true,
  disabled: false,
  required: false,
};

/**
 * useLinkage composable
 *
 * @param schema - Form schema 定义
 * @param formData - 响应式FormData（reactive 对象、ref or getter）
 * @param variables - 可选的变量上下文（供Condition表达式使用）
 * @param exposed - 可选的ComponentExposed Value上下文（供Condition表达式使用）
 * @returns stateMap - 所有LinkageField的StatusMap
 */
export function useLinkage(
  schema: PartialWidget[],
  formData: MaybeRefOrGetter<FormData>,
  variables?: MaybeRefOrGetter<Record<string, unknown>>,
  exposed?: MaybeRefOrGetter<Record<string, Record<string, unknown>>>,
): { stateMap: ComputedRef<Map<string, LinkageState>> } {
  // 收集所有Linkage节点（静态, 不依赖 formData）
  const entries = computed(() => collectLinkageEntries(schema));

  // 构建依赖图
  const dependencyGraph = computed(() => buildDependencyGraph(entries.value));

  // 检测循环依赖
  const cyclicFields = computed(() => detectCycles(dependencyGraph.value));

  // 计算LinkageStatusMap
  // passed在 computed 内部读取 formData[watchField] 建立响应式依赖
  // 当任何 watchField 的Value变化Hrs, 此 computed 会自动重算
  const stateMap = computed<Map<string, LinkageState>>(() => {
    const currentFormData = toValue(formData);
    const currentVariables = variables ? toValue(variables) : undefined;
    const currentExposed = exposed ? toValue(exposed) : undefined;
    const currentEntries = entries.value;
    const cyclic = cyclicFields.value;
    const map = new Map<string, LinkageState>();

    for (const entry of currentEntries) {
      // 循环依赖的Field降级为DefaultStatus
      if (cyclic.has(entry.field)) {
        map.set(entry.field, { ...DEFAULT_STATE });
        continue;
      }

      const state: LinkageState = { ...DEFAULT_STATE };

      for (const linkage of entry.linkages) {
        // 读取 watchFields 建立响应式依赖
        for (const watchField of linkage.watchFields) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          currentFormData[watchField];
        }

        const result = evaluateCondition(
          linkage,
          currentFormData,
          currentVariables,
          currentExposed,
        );
        logger.rule(
          `${entry.field} [${linkage.type}]: "${linkage.condition}" → ${result}`,
        );

        switch (linkage.type) {
          case "visible":
            state.visible = result;
            if (!result && linkage.elseValue !== undefined) {
              state.elseValue = linkage.elseValue;
            }
            break;
          case "disabled":
            state.disabled = result;
            break;
          case "required":
            state.required = result;
            break;
          case "options":
            if (result) {
              if (linkage.thenOptions) {
                state.options = linkage.thenOptions;
              }
              if (linkage.thenApi) {
                state.optionsApi = linkage.thenApi;
              }
            } else if (linkage.elseValue !== undefined) {
              state.elseValue = linkage.elseValue;
            }
            break;
          case "set-value":
            if (result) {
              if (linkage.valueSource) {
                state.targetValue = currentFormData[linkage.valueSource];
              } else if (linkage.thenValue !== undefined) {
                state.targetValue = linkage.thenValue;
              }
            } else if (linkage.elseValue !== undefined) {
              state.elseValue = linkage.elseValue;
            }
            break;
          case "reset-fields":
            if (result && linkage.targetFields?.length) {
              state.resetFields = [...linkage.targetFields];
            } else {
              state.resetFields = undefined;
            }
            break;
        }
      }

      map.set(entry.field, state);
    }

    return map;
  });

  return { stateMap };
}
