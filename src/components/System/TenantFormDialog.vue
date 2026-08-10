<script setup lang="ts">
/**
 * TenantFormDialog — 创建/Edit租户Dialog
 *
 * 支持 name, code, status, maxUsers, features Field。
 * Edit模式下传入 initialData 预填Form。
 */
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { useTenantStore } from "@/stores/tenant";
import type {
  TenantItem,
  TenantStatus,
  TenantCreatePayload,
  TenantUpdatePayload,
} from "@/types/tenant";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./TenantFormDialog.module.scss";

const props = defineProps<{
  visible: boolean;
  initialData?: TenantItem | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [];
}>();

const tenantStore = useTenantStore();
const { t } = useI18n();

const isEditing = computed(() => !!props.initialData);
const dialogTitle = computed(() =>
  isEditing.value
    ? t("editor.tenantForm.editTitle")
    : t("editor.tenantForm.createTitle"),
);
const submitting = ref(false);

const form = ref({
  name: "",
  code: "",
  status: "active" as TenantStatus,
  maxUsers: 100,
  features: [] as string[],
});

const featuresInput = ref("");

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.initialData) {
        form.value = {
          name: props.initialData.name,
          code: props.initialData.code,
          status: props.initialData.status,
          maxUsers: props.initialData.config.maxUsers,
          features: [...props.initialData.config.features],
        };
        featuresInput.value = props.initialData.config.features.join(", ");
      } else {
        form.value = {
          name: "",
          code: "",
          status: "active",
          maxUsers: 100,
          features: [],
        };
        featuresInput.value = "";
      }
    }
  },
);

function parseFeatures(): string[] {
  return featuresInput.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t("editor.tenantForm.nameRequired"));
    return;
  }
  if (!form.value.code.trim()) {
    ElMessage.warning(t("editor.tenantForm.codeRequired"));
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(form.value.code)) {
    ElMessage.warning(t("editor.tenantForm.codePattern"));
    return;
  }

  const features = parseFeatures();

  submitting.value = true;
  try {
    if (isEditing.value && props.initialData) {
      const payload: TenantUpdatePayload = {
        name: form.value.name,
        code: form.value.code,
        status: form.value.status,
        config: {
          maxUsers: form.value.maxUsers,
          features,
        },
      };
      const result = await tenantStore.updateTenant(
        props.initialData.id,
        payload,
      );
      if (result) {
        ElMessage.success(t("editor.tenantForm.updateSuccess"));
        emit("update:visible", false);
        emit("saved");
      } else {
        ElMessage.error(
          tenantStore.error || t("editor.tenantForm.updateFailed"),
        );
      }
    } else {
      const payload: TenantCreatePayload = {
        name: form.value.name,
        code: form.value.code,
        status: form.value.status,
        config: {
          maxUsers: form.value.maxUsers,
          features,
        },
      };
      const result = await tenantStore.createTenant(payload);
      if (result) {
        ElMessage.success(t("editor.tenantForm.createSuccess"));
        emit("update:visible", false);
        emit("saved");
      } else {
        ElMessage.error(
          tenantStore.error || t("editor.tenantForm.createFailed"),
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
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item :label="t('editor.tenantForm.fieldName')" required>
        <el-input
          v-model="form.name"
          :placeholder="t('editor.tenantForm.fieldNamePlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="t('editor.tenantForm.fieldCode')" required>
        <el-input
          v-model="form.code"
          :placeholder="t('editor.tenantForm.fieldCodePlaceholder')"
          maxlength="50"
          :disabled="isEditing"
        />
      </el-form-item>

      <el-form-item :label="t('editor.tenantForm.fieldStatus')">
        <el-select v-model="form.status" :class="styles.fullWidth">
          <el-option
            :label="t('editor.tenantForm.statusActive')"
            value="active"
          />
          <el-option
            :label="t('editor.tenantForm.statusInactive')"
            value="inactive"
          />
          <el-option
            :label="t('editor.tenantForm.statusSuspended')"
            value="suspended"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('editor.tenantForm.fieldMaxUsers')">
        <el-input-number
          v-model="form.maxUsers"
          :min="1"
          :max="100000"
          :step="10"
          :class="styles.fullWidth"
        />
      </el-form-item>

      <el-form-item :label="t('editor.tenantForm.fieldFeatures')">
        <el-input
          v-model="featuresInput"
          :placeholder="t('editor.tenantForm.featuresPlaceholder')"
        />
        <div :class="styles.featuresHint">
          {{ t("editor.tenantForm.featuresHint") }}
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div :class="styles.footer">
        <el-button @click="handleClose">{{
          t("editor.common.cancel")
        }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{
            isEditing
              ? t("editor.tenantForm.saveBtn")
              : t("editor.tenantForm.createBtn")
          }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
