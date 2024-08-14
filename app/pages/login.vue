<script lang="ts" setup>
import Notiflix from 'notiflix'
import { definePageMeta } from '#imports'
import type { FormError } from '#ui/types'

definePageMeta({
  layout: 'blank'
})
const fields = [
  {
    name: 'username',
    type: 'email',
    label: 'Email',
    placeholder: 'Nhập địa chỉ email'
  },
  {
    name: 'password',
    type: 'password',
    label: 'Mật khẩu',
    placeholder: 'Nhập mật khẩu'
  }
]
const validate = (state: any) => {
  const errors: FormError[] = []
  if (!state.username) errors.push({ path: 'username', message: 'Email không để trống' })
  if (!state.password) errors.push({ path: 'password', message: 'Mật khẩu không để trống' })
  return errors
}
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const username = ref()
const password = ref()

const { status, execute } = useFetch(`v1/auth/login`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken.value}`
  },
  credentials: 'include',
  baseURL: config.public.apiUrl,
  immediate: false,
  lazy: true,
  body: { username, password },
  onResponse: async ({ response }) => {
    if (response.ok) {
      await authStore.getUserInfo()
      await navigateTo('/')
    }
  },
  onResponseError({ response }) {
    Notiflix.Notify.failure(response._data?.message ?? 'Có lỗi khi đăng nhập')
  }
})

const onLogin = async (data: { username: string, password: string }) => {
  username.value = data.username
  password.value = data.password
  execute()
}
</script>

<template>
  <section class="h-dvh flex items-center px-2 md:px-0">
    <UAuthForm
      :fields="fields"
      :loading="status === 'pending'"
      :submit-button="{ label: status === 'pending' ? 'Đang xử lý' : 'Tiếp tục' }"
      :validate="validate"
      align="top"
      class="mx-auto"
      icon="i-heroicons-user-circle"
      title="Đăng nhập"
      @submit="onLogin"
    />
  </section>
</template>

<style scoped>

</style>
