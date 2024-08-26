<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { IResponsePagination, Role, User } from '~/types'

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const toast = useToast()
const emit = defineEmits(['close'])
const props = defineProps<{ roles: Role[] }>()

const selectRoles = computed(() => props.roles.map(role => ({ id: role._id, name: role.name })))

const state = reactive({
  roles: [],
  email: undefined
})

// https://ui.nuxt.com/components/form
const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.email) errors.push({ path: 'email', message: 'Email không được để trống' })
  if (state.roles.length === 0) errors.push({ path: 'role', message: 'Vui lòng chọn ít nhất 1 vai trò' })
  return errors
}

async function onSubmit(event: FormSubmitEvent<any>) {
  const users = await $fetch<IResponsePagination<User>>(`/api/v1/users`, {
    credentials: 'include',
    query: {
      keyword: event.data.email
    },
    headers: { Authorization: `Bearer ${accessToken.value}` }
  })

  if (users.meta.itemCount === 0) {
    toast.add({ title: 'Tài khoản không tồn tại trong hệ thống', color: 'red' })
    return
  }

  const existUser = users.data.find(u => u.email === event.data.email)

  if (!existUser) {
    toast.add({ title: 'Tài khoản không tồn tại trong hệ thống', color: 'red' })
    return
  }

  await $fetch(`/api/v1/users/${existUser._id}/roles`, {
    method: 'PATCH',
    body: {
      roles: event.data.roles
    },
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    onResponse({ response }) {
      if (response.ok) {
        toast.add({ title: 'Đã mời thành công', color: 'green' })
      } else {
        toast.add({ title: 'Mời thất bại', color: 'red' })
      }
    }
  })

  emit('close', existUser)
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['submit']"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormGroup
      label="Email"
      name="email"
    >
      <UInput
        v-model="state.email"
        autofocus
        placeholder="john.doe@example.com"
        type="email"
      />
    </UFormGroup>

    <UFormGroup
      label="Vai trò"
      name="role"
    >
      <USelectMenu
        v-model="state.roles"
        :options="selectRoles"
        :ui-menu="{ select: 'capitalize', option: { base: 'capitalize' } }"
        multiple
        option-attribute="name"
        placeholder="Lựa chọn vai trò"
        value-attribute="id"
      />
    </UFormGroup>

    <div class="flex justify-end gap-3">
      <UButton
        color="gray"
        label="Huỷ"
        variant="ghost"
        @click="emit('close')"
      />
      <UButton
        color="black"
        label="Lưu"
        type="submit"
      />
    </div>
  </UForm>
</template>
