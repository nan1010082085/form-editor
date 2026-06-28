/**
 * mockApi — 本地 Mock API 层
 *
 * 当 VITE_USE_MOCK=true 时，替换真实 API 客户端，
 * 返回本地假数据，无需后端服务即可调试设计器。
 *
 * 使用方式：在 .env.development 中设置 VITE_USE_MOCK=true
 */
import type {
  SchemaListItem,
  SchemaDetail,
  PaginatedResponse,
  PublishedSchemaItem,
  SchemaCreatePayload,
  SchemaUpdatePayload,
} from '@/types/api'

// ---- 内存存储 ----

const MOCK_SCHEMAS = new Map<string, SchemaListItem>()
const MOCK_PUBLISHED = new Map<string, PublishedSchemaItem>()

// ---- Mock API 实现 ----

let idCounter = 100

function genId(): string {
  return `mock-${Date.now().toString(36)}-${(idCounter++).toString(36)}`
}

function delay(ms = 50): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function mockFetchSchemas(options?: {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<SchemaListItem>> {
  await delay()
  let items = Array.from(MOCK_SCHEMAS.values())

  if (options?.search) {
    const q = options.search.toLowerCase()
    items = items.filter((s) => s.name.toLowerCase().includes(q))
  }
  if (options?.type) {
    items = items.filter((s) => s.type === options.type)
  }

  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const start = (page - 1) * pageSize
  const paged = items.slice(start, start + pageSize)

  return {
    items: paged,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

export async function mockFetchSchemaById(id: string): Promise<SchemaDetail> {
  await delay()
  const schema = MOCK_SCHEMAS.get(id)
  if (!schema) throw new Error(`Schema not found: ${id}`)
  return { ...schema, json: schema.json ?? [] }
}

export async function mockCreateSchema(payload: SchemaCreatePayload): Promise<SchemaDetail> {
  await delay()
  const id = genId()
  const now = new Date().toISOString()
  const schema: SchemaListItem = {
    id,
    editId: payload.editId ?? id,
    version: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    name: payload.name,
    type: payload.type,
    status: 'draft',
    json: payload.json,
    createdAt: now,
    updatedAt: now,
  }
  MOCK_SCHEMAS.set(id, schema)
  return { ...schema, json: payload.json }
}

export async function mockUpdateSchema(id: string, payload: SchemaUpdatePayload): Promise<SchemaDetail> {
  await delay()
  const existing = MOCK_SCHEMAS.get(id)
  if (!existing) throw new Error(`Schema not found: ${id}`)

  // 保存前将当前状态存入版本快照
  const now = new Date()
  const newVersion = now.toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const snapshot = {
    version: existing.version || newVersion,
    json: existing.json,
    createdAt: existing.updatedAt || existing.createdAt,
  }
  const existingVersions: any[] = (existing as any).versions ?? []

  const updated: SchemaListItem = {
    ...existing,
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.json !== undefined ? { json: payload.json } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    version: newVersion,
    updatedAt: now.toISOString(),
    versions: [...existingVersions, snapshot],
  } as any
  MOCK_SCHEMAS.set(id, updated)
  return { ...updated, json: updated.json ?? [] }
}

export async function mockDeleteSchema(id: string): Promise<null> {
  await delay()
  MOCK_SCHEMAS.delete(id)
  MOCK_PUBLISHED.delete(id)
  return null
}

export async function mockPublishSchema(id: string, version?: string): Promise<PublishedSchemaItem> {
  await delay()
  const schema = MOCK_SCHEMAS.get(id)
  if (!schema) throw new Error(`Schema not found: ${id}`)

  const editId = schema.editId ?? id
  // 复用已有 publishId，保证发布链接稳定；首次发布才生成新 ID
  const existing = MOCK_PUBLISHED.get(editId)

  // 如果指定了版本，从快照中查找；否则使用当前 schema
  let publishJson = schema.json
  let publishVersion = schema.version ?? '20250101000000'
  if (version && version !== schema.version) {
    const snapshot = (schema as any).versions?.find((v: any) => v.version === version)
    if (snapshot) {
      publishJson = snapshot.json
      publishVersion = snapshot.version
    }
    // mock 无快照时仍使用当前 json，但保留版本号
    publishVersion = version
  }

  const published: PublishedSchemaItem = {
    id: existing?.id ?? genId(),
    sourceId: editId,
    name: schema.name,
    type: schema.type,
    // @ts-ignore - json 格式兼容
    json: (Array.isArray(publishJson) ? publishJson : publishJson?.widgets ?? []) as unknown[],
    publishId: existing?.publishId ?? genId(),
    version: publishVersion,
    publishedAt: new Date().toISOString(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_PUBLISHED.set(editId, published)
  return { ...published }
}

export async function mockFetchPublishedSchema(sourceId: string): Promise<PublishedSchemaItem | null> {
  await delay()
  // 404 is normal — schema not yet published
  return MOCK_PUBLISHED.get(sourceId) ?? null
}

export async function mockFetchPublishedByPublishId(publishId: string): Promise<PublishedSchemaItem | null> {
  await delay()
  for (const item of MOCK_PUBLISHED.values()) {
    if (item.publishId === publishId) return { ...item }
  }
  return null
}

// ================================================================
// 版本管理 Mock
// ================================================================

export async function mockFetchVersions(editId: string, page = 1, pageSize = 10): Promise<{ items: any[]; total: number }> {
  await delay()
  // 按 editId 或 id 查找 schema
  const schema = MOCK_SCHEMAS.get(editId) ?? Array.from(MOCK_SCHEMAS.values()).find(s => s.editId === editId)
  if (!schema) return { items: [], total: 0 }

  const versions: any[] = (schema as any).versions ?? []
  // 当前版本也加入列表
  const allVersions = [
    { version: schema.version, createdAt: schema.updatedAt || schema.createdAt, published: false },
    ...versions.map((v: any) => ({ ...v, published: false })),
  ].reverse() // 最新在前

  // 标记已发布的版本
  const published = MOCK_PUBLISHED.get(schema.editId ?? editId)
  if (published) {
    const pv = allVersions.find(v => v.version === published.version)
    if (pv) pv.published = true
  }

  const start = (page - 1) * pageSize
  const items = allVersions.slice(start, start + pageSize)
  return { items, total: allVersions.length }
}

export async function mockFetchVersion(editId: string, version: string): Promise<any> {
  await delay()
  const schema = MOCK_SCHEMAS.get(editId) ?? Array.from(MOCK_SCHEMAS.values()).find(s => s.editId === editId)
  if (!schema) throw new Error(`Schema not found: ${editId}`)

  // 当前版本
  if (schema.version === version) {
    return { ...schema, json: schema.json ?? [] }
  }

  // 从快照中查找
  const versions: any[] = (schema as any).versions ?? []
  const snapshot = versions.find((v: any) => v.version === version)
  if (snapshot) {
    return { ...schema, version: snapshot.version, json: snapshot.json, createdAt: snapshot.createdAt }
  }

  throw new Error(`Version ${version} not found`)
}

export async function mockDeleteVersion(editId: string, version: string): Promise<null> {
  await delay()
  const schema = MOCK_SCHEMAS.get(editId) ?? Array.from(MOCK_SCHEMAS.values()).find(s => s.editId === editId)
  if (!schema) throw new Error(`Schema not found: ${editId}`)

  const versions: any[] = (schema as any).versions ?? []
  ;(schema as any).versions = versions.filter((v: any) => v.version !== version)
  return null
}
