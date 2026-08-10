<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./ForbiddenView.module.scss";

const router = useRouter();
const { t } = useI18n();
</script>

<template>
  <div :class="styles.page">
    <div :class="styles.content">
      <h1 :class="styles.code">403</h1>
      <p :class="styles.message">{{ t('editor.errorPage.forbiddenMessage') }}</p>
      <el-button type="primary" @click="router.push('/instances')">
        {{ t('editor.errorPage.backHome') }}
      </el-button>
    </div>
  </div>
</template>
