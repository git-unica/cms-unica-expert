<script lang="ts" setup>
const model = defineModel({
  type: Boolean
})

const toast = useToast()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const loading = ref(false)

const onDelete = async () => {
  loading.value = true

  try {
    const res = await $fetch.raw(`/api/v1/users/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      credentials: 'include'
    })

    if (res.ok) {
      await authStore.logout()
      await navigateTo('login')
    } else {
      toast.add({ icon: 'i-heroicons-check-circle', title: 'Tài khoản chưa được xoá', color: 'red' })
    }
  } catch (e) {
    toast.add({ icon: 'i-heroicons-check-circle', title: 'Có lỗi khi thao tác', color: 'red' })
  }

  model.value = false
  loading.value = false
}
</script>

<template>
  <UDashboardModal
    v-model="model"
    :close-button="null"
    :ui="{
      icon: {
        base: 'text-red-500 dark:text-red-400'
      } as any,
      footer: {
        base: 'ml-16'
      } as any
    }"
    description="Bạn có chắc rằng bạn muốn xóa tài khoản của bạn?"
    icon="i-heroicons-exclamation-circle"
    prevent-close
    title="Xoá tài khoản"
  >
    <template #footer>
      <UButton
        :loading="loading"
        color="red"
        label="Xoá"
        @click="onDelete"
      />
      <UButton
        color="white"
        label="Huỷ"
        @click="model = false"
      />
    </template>
  </UDashboardModal>
</template>
