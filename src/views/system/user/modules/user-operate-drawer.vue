<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateUser, fetchGetUserInfo, fetchUpdateUser } from '@/service/api/system';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'UserOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.User | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { loading, startLoading, endLoading } = useLoading();
const { loading: deptLoading, startLoading: startDeptLoading, endLoading: endDeptLoading } = useLoading();
const { validate, restoreValidation } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增用户',
    edit: '编辑用户'
  };
  return titles[props.operateType];
});

type Model = Api.System.UserOperateParams;

const model = ref<Model>(createDefaultModel());

const roleOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);

function createDefaultModel(): Model {
  return {
    userName: '',
    realName: '',
    phone: '',
    password: '',
    status: '0',
    role: ''
  };
}

type RuleKey = Extract<keyof Model, 'userName' | 'realName' | 'password' | 'status' | 'phone' | 'role'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  userName: [createRequiredRule('请输入用户名')],
  realName: [createRequiredRule('请输入姓名')],
  password: [{ ...patternRules.pwd, required: props.operateType === 'add' }],
  phone: [patternRules.phone],
  status: [createRequiredRule('请选择状态')],
  role: [{ ...createRequiredRule('请选择角色'), type: 'array' }]
};

async function getUserInfo(id: CommonType.IdType = '') {
  startLoading();
  const { error, data } = await fetchGetUserInfo(id);
  if (!error) {
    model.value.role = data.role;
  }
  endLoading();
}

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();

  if (props.operateType === 'add') {
    getUserInfo();
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    startDeptLoading();
    Object.assign(model.value, jsonClone(props.rowData));
    model.value.password = '';
    getUserInfo(props.rowData.userId);
    endDeptLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { userId, userName, realName, phone, password, status, role } =
    model.value;

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateUser({
      userName,
      password,
      realName,
      phone,
      status,
      role,
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateUser({
      userId,
      userName,
      realName,
      phone,
      status,
      role
    });
    if (error) return;
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm :model="model" :rules="rules">
          <NFormItem :label="$t('page.system.user.realName')" path="realName">
            <NInput v-model:value="model.realName" :placeholder="'请输入姓名'" />
          </NFormItem>
          <NFormItem :label="'电话号码'" path="phone">
            <NInput v-model:value="model.phone" :placeholder="'请输入电话号码'" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" :label="$t('page.system.user.userName')" path="userName">
            <NInput v-model:value="model.userName" :placeholder="'请输入用户名称'" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" :label="'密码'" path="password">
            <NInput
              v-model:value="model.password"
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'off' }"
              :placeholder="'请输入密码'"
            />
          </NFormItem>

          <NFormItem :label="'角色'" path="roleIds">
            <NSelect
              v-model:value="model.role"
              :loading="loading"
              :options="roleOptions"
              multiple
              clearable
              placeholder="请选择角色"
            />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.status')" path="status">
            <NSelect
              v-model:value="model.status"
              :options="[
                {
                  label: '正常',
                  value: '0'
                },
                {
                  label: '停用',
                  value: '1'
                }
              ]"
            />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
