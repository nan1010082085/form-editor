<script setup lang="ts">
/**
 * CredentialFormDialog -- Create/Edit credential dialog
 *
 * Dynamic fields based on credential type.
 * In edit mode, data fields are pre-filled from the server (decrypted).
 */
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "@schema-platform/platform-shared";
import { useCredentialStore } from "@/stores/credential";
import type {
  CredentialDetail,
  CredentialType,
  CredentialCreatePayload,
  CredentialUpdatePayload,
} from "@/types/credential";
import {
  CREDENTIAL_TYPE_FIELDS,
  getCredentialTypeLabel,
  getCredentialFieldLabel,
} from "@/types/credential";
import styles from "./CredentialFormDialog.module.scss";

const props = defineProps<{
  visible: boolean;
  initialData?: CredentialDetail | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [];
}>();

const credentialStore = useCredentialStore();
const { t } = useI18n();

const isEditing = computed(() => !!props.initialData);
const dialogTitle = computed(() =>
  isEditing.value
    ? t("editor.credential.editTitle")
    : t("editor.credential.createTitle"),
);
const submitting = ref(false);

const form = ref({
  name: "",
  type: "api_key" as CredentialType,
  data: {} as Record<string, string>,
});

const credentialTypes: CredentialType[] = [
  "api_key",
  "basic_auth",
  "bearer_token",
];

const typeOptions = computed(() =>
  credentialTypes.map((value) => ({
    value,
    label: getCredentialTypeLabel(value, t),
  })),
);

const currentFields = computed(
  () => CREDENTIAL_TYPE_FIELDS[form.value.type] ?? [],
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.initialData) {
        form.value = {
          name: props.initialData.name,
          type: props.initialData.type,
          data: { ...props.initialData.data },
        };
      } else {
        form.value = {
          name: "",
          type: "api_key",
          data: {},
        };
      }
    }
  },
);

watch(
  () => form.value.type,
  (newType, oldType) => {
    if (newType !== oldType && !isEditing.value) {
      // Reset data fields when type changes (create mode only)
      const fields = CREDENTIAL_TYPE_FIELDS[newType] ?? [];
      const newData: Record<string, string> = {};
      for (const field of fields) {
        newData[field] = "";
      }
      form.value.data = newData;
    }
  },
);

function isPasswordField(field: string): boolean {
  return field === "password" || field === "token" || field === "apiKey";
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t("editor.credential.nameRequired"));
    return;
  }

  // Validate all fields are filled
  for (const field of currentFields.value) {
    if (!form.value.data[field]?.trim()) {
      ElMessage.warning(
        t("editor.credential.fieldRequired", {
          field: getCredentialFieldLabel(field, t),
        }),
      );
      return;
    }
  }

  submitting.value = true;
  try {
    if (isEditing.value && props.initialData) {
      const payload: CredentialUpdatePayload = {
        name: form.value.name,
        type: form.value.type,
        data: form.value.data,
      };
      const result = await credentialStore.updateCredential(
        props.initialData.id,
        payload,
      );
      if (result) {
        ElMessage.success(t("editor.credential.updateSuccess"));
        emit("update:visible", false);
        emit("saved");
      } else {
        ElMessage.error(
          credentialStore.error || t("editor.credential.updateFailed"),
        );
      }
    } else {
      const payload: CredentialCreatePayload = {
        name: form.value.name,
        type: form.value.type,
        data: form.value.data,
      };
      const result = await credentialStore.createCredential(payload);
      if (result) {
        ElMessage.success(t("editor.credential.createSuccess"));
        emit("update:visible", false);
        emit("saved");
      } else {
        ElMessage.error(
          credentialStore.error || t("editor.credential.createFailed"),
        );
      }
    }
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="480px"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    @close="handleClose"
  >
    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item :label="t('editor.credential.fieldName')" required>
        <el-input
          v-model="form.name"
          :placeholder="t('editor.credential.namePlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="t('editor.credential.fieldType')" required>
        <el-select
          v-model="form.type"
          :class="styles.fullWidth"
          :disabled="isEditing"
        >
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <template v-for="field in currentFields" :key="field">
        <el-form-item
          :label="getCredentialFieldLabel(field, t)"
          required
        >
          <el-input
            v-model="form.data[field]"
            :type="isPasswordField(field) ? 'password' : 'text'"
            :placeholder="
              t('editor.credential.enterField', {
                field: getCredentialFieldLabel(field, t),
              })
            "
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div :class="styles.footer">
        <el-button @click="handleClose">{{
          t("editor.common.cancel")
        }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{
            isEditing
              ? t("editor.common.save")
              : t("editor.credential.create")
          }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
