<script lang="ts" setup>
import { Notify } from 'notiflix'
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
const isLoading = ref(false)
const authStore = useAuthStore()

const onLogin = async (data: { username: string, password: string }) => {
  isLoading.value = true
  const res = await useLogin(data.username, data.password)
  if ('access_token' in res && 'refresh_token' in res) {
    authStore.setAccessToken(res.access_token)
    authStore.setRefreshToken(res.refresh_token)
    await authStore.getUserInfo()
    await navigateTo('/')
  } else {
    Notify.warning(res.data['message'] ?? 'Có lỗi khi đăng nhập')
  }
  isLoading.value = false
}
</script>

<template>
  <section class="h-dvh flex items-center">
    <UAuthForm
      :fields="fields"
      :loading="isLoading"
      :submit-button="{ label: isLoading ? 'Đang xử lý' : 'Tiếp tục' }"
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
