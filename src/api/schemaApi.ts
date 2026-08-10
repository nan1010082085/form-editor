/**
 * Schema API — Form Schema 相关接口
 *
 * Aggregate schema CRUD、Version管理、Import、Template等接口。
 * 底层委托 utils/apiClient。
 */
export {
  fetchSchemas,
  fetchSchemaById,
  createSchema,
  updateSchema,
  deleteSchema,
  publishSchema,
  fetchPublishedSchema,
  fetchPublishedByPublishId,
  fetchPublishedByCode,
  fetchVersions,
  fetchVersion,
  deleteVersion,
  importSchema,
  fetchTemplates,
  applyTemplate,
  createTemplate,
  deleteTemplate,
} from "@/utils/apiClient";

export type {
  VersionEntry,
  VersionListResponse,
  SchemaImportPayload,
  TemplateCategory,
  TemplateItem,
  TemplateApplyResult,
} from "@/utils/apiClient";
