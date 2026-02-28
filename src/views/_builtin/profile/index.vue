<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NGrid, NGi } from 'naive-ui';
import { fetchGetProfile, fetchUpdateProfile, fetchChangePassword } from '@/service/api/system';
import { $t } from '@/locales';

defineOptions({
  name: 'Profile'
});

// Profile form
const profileLoading = ref(false);
const profileForm = ref<Api.System.ProfileUpdateParams>({
  userId: '',
  realName: '',
  phone: ''
});

const profileRules = {
  realName: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  phone: [
    { required: true, message: $t('common.required'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: $t('page.system.user.phoneFormat'), trigger: 'blur' }
  ]
};

const profileFormRef = ref();

// Password form
const passwordLoading = ref(false);
const passwordForm = ref<Api.System.PasswordChangeParams>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordRules = {
  oldPassword: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: $t('common.required'), trigger: 'blur' },
    { min: 6, message: $t('page.system.user.passwordMin'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: $t('common.required'), trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== passwordForm.value.newPassword) {
          return new Error($t('page.system.user.passwordMismatch'));
        }
        return true;
      },
      trigger: 'blur'
    }
  ]
};

const passwordFormRef = ref();

// Display user info
const userInfo = ref<Api.System.Profile>({
  userId: '',
  userName: '',
  realName: '',
  phone: '',
  role: '',
  status: 1
});

async function getProfile() {
  profileLoading.value = true;
  const { data, error } = await fetchGetProfile();
  if (!error && data) {
    userInfo.value = data;
    profileForm.value = {
      userId: data.userId,
      realName: data.realName,
      phone: data.phone
    };
  }
  profileLoading.value = false;
}

async function handleUpdateProfile() {
  await profileFormRef.value?.validate();
  profileLoading.value = true;
  const { error } = await fetchUpdateProfile(profileForm.value);
  profileLoading.value = false;
  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    getProfile();
  }
}

async function handleChangePassword() {
  await passwordFormRef.value?.validate();
  passwordLoading.value = true;
  const { error } = await fetchChangePassword(passwordForm.value);
  passwordLoading.value = false;
  if (!error) {
    window.$message?.success($t('page.system.user.passwordChangeSuccess'));
    // Reset form
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
}

onMounted(() => {
  getProfile();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <NCard :title="$t('page.system.profile.title')" :bordered="false" size="small" class="card-wrapper">
      <NGrid :cols="24" :x-gap="24">
        <NGi :span="12">
          <NCard :title="$t('page.system.profile.basicInfo')" size="small" class="mb-16px">
            <NForm
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-placement="left"
              label-width="80"
            >
              <NFormItem :label="$t('page.system.user.userName')" path="userName">
                <NInput :value="userInfo.userName" disabled />
              </NFormItem>
              <NFormItem :label="$t('page.system.user.realName')" path="realName">
                <NInput v-model:value="profileForm.realName" :placeholder="$t('common.pleaseInput')" />
              </NFormItem>
              <NFormItem :label="$t('page.system.user.phone')" path="phone">
                <NInput v-model:value="profileForm.phone" :placeholder="$t('common.pleaseInput')" />
              </NFormItem>
              <NFormItem :label="$t('page.system.user.role')" path="role">
                <NInput :value="userInfo.role" disabled />
              </NFormItem>
              <NFormItem>
                <NButton type="primary" :loading="profileLoading" @click="handleUpdateProfile">
                  {{ $t('common.save') }}
                </NButton>
              </NFormItem>
            </NForm>
          </NCard>
        </NGi>
        <NGi :span="12">
          <NCard :title="$t('page.system.profile.changePassword')" size="small">
            <NForm
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-placement="left"
              label-width="100"
            >
              <NFormItem :label="$t('page.system.user.oldPassword')" path="oldPassword">
                <NInput
                  v-model:value="passwordForm.oldPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.pleaseInput')"
                />
              </NFormItem>
              <NFormItem :label="$t('page.system.user.newPassword')" path="newPassword">
                <NInput
                  v-model:value="passwordForm.newPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.pleaseInput')"
                />
              </NFormItem>
              <NFormItem :label="$t('page.system.user.confirmPassword')" path="confirmPassword">
                <NInput
                  v-model:value="passwordForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('common.pleaseInput')"
                />
              </NFormItem>
              <NFormItem>
                <NButton type="primary" :loading="passwordLoading" @click="handleChangePassword">
                  {{ $t('page.system.profile.changePassword') }}
                </NButton>
              </NFormItem>
            </NForm>
          </NCard>
        </NGi>
      </NGrid>
    </NCard>
  </div>
</template>

<style scoped></style>