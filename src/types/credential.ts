/**
 * Credential type definitions
 *
 * Aligned with packages/server Credential REST API contract.
 */

export type CredentialType = "api_key" | "basic_auth" | "bearer_token";

/** Credential list item (data field excluded) */
export interface CredentialItem {
  id: string;
  name: string;
  type: CredentialType;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Credential detail (with decrypted data) */
export interface CredentialDetail extends CredentialItem {
  data: Record<string, string>;
}

/** Credential create payload */
export interface CredentialCreatePayload {
  name: string;
  type: CredentialType;
  data: Record<string, string>;
}

/** Credential update payload */
export interface CredentialUpdatePayload {
  name?: string;
  type?: CredentialType;
  data?: Record<string, string>;
}

/** Type display labels */
export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  api_key: "API Key",
  basic_auth: "Basic Auth",
  bearer_token: "Bearer Token",
};

/** Default data fields per credential type */
export const CREDENTIAL_TYPE_FIELDS: Record<CredentialType, string[]> = {
  api_key: ["apiKey"],
  basic_auth: ["username", "password"],
  bearer_token: ["token"],
};

export const CREDENTIAL_TYPE_FIELD_LABELS: Record<string, string> = {
  apiKey: "API Key",
  username: "Username",
  password: "Password",
  token: "Token",
};

/** i18n key per credential type */
const CREDENTIAL_TYPE_I18N_KEYS: Record<CredentialType, string> = {
  api_key: "editor.credential.typeApiKey",
  basic_auth: "editor.credential.typeBasicAuth",
  bearer_token: "editor.credential.typeBearerToken",
};

/** i18n key per credential data field */
const CREDENTIAL_FIELD_I18N_KEYS: Record<string, string> = {
  apiKey: "editor.credential.fieldApiKey",
  username: "editor.credential.fieldUsername",
  password: "editor.credential.fieldPassword",
  token: "editor.credential.fieldToken",
};

/**
 * Resolve localized credential type label; falls back to English constants.
 */
export function getCredentialTypeLabel(
  type: CredentialType,
  t: (key: string) => string,
): string {
  const key = CREDENTIAL_TYPE_I18N_KEYS[type];
  return key ? t(key) : (CREDENTIAL_TYPE_LABELS[type] ?? type);
}

/**
 * Resolve localized credential data field label; falls back to English constants.
 */
export function getCredentialFieldLabel(
  field: string,
  t: (key: string) => string,
): string {
  const key = CREDENTIAL_FIELD_I18N_KEYS[field];
  return key ? t(key) : (CREDENTIAL_TYPE_FIELD_LABELS[field] ?? field);
}
