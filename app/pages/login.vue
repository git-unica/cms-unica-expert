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
  if (!state.username)
    errors.push({ path: 'username', message: 'Email không để trống' })
  if (!state.password)
    errors.push({ path: 'password', message: 'Mật khẩu không để trống' })
  return errors
}
const authStore = useAuthStore()
const { isLogin } = storeToRefs(authStore)
const username = ref()
const password = ref()

if (isLogin.value) navigateTo('/')

const { fetch } = useNestSession()
const { status, execute: login } = useFetch(`/api/v1/auth/login`, {
  method: 'POST',
  headers: useRequestHeaders(['cookie']),
  credentials: 'include',
  immediate: false,
  lazy: true,
  body: { username, password },
  onResponse: async ({ response }) => {
    if (response.ok) {
      await fetch()
      await authStore.getUserInfo()
      navigateTo('/')
    }
  },
  onResponseError({ response }) {
    Notiflix.Notify.failure(response._data?.message ?? 'Có lỗi khi đăng nhập')
  }
})

const onLogin = async (data: { username: string, password: string }) => {
  username.value = data.username
  password.value = data.password
  await login()
}
</script>

<template>
  <section class="h-dvh flex items-center px-2 md:px-0">
    <UAuthForm
      :fields="fields"
      :loading="status === 'pending'"
      :submit-button="{
        label: status === 'pending' ? 'Đang xử lý' : 'Tiếp tục'
      }"
      :validate="validate"
      align="top"
      class="mx-auto"
      icon="i-heroicons-user-circle"
      title="Đăng nhập"
      @submit="onLogin"
    />
  </section>
</template>

<style scoped></style>
