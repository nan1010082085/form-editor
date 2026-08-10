/**
 * 将 Widget Data源 URL 中的 {{variables.xxx}} / {{xxx}} Placeholder替换为运RowHrs变量Value。
 */
export function resolveWidgetUrl(
  url: string,
  variables: Record<string, unknown> = {},
): string {
  return url.replace(/\{\{(?:variables\.)?(\w+)\}\}/g, (_, name: string) => {
    const val = variables[name];
    if (val === undefined || val === null) return "";
    return encodeURIComponent(String(val));
  });
}
