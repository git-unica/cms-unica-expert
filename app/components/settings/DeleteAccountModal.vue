<script lang="ts" setup>
const model = defineModel({
  type: Boolean
})

const toast = useToast()

const loading = ref(false)

function onDelete() {
  loading.value = true

  setTimeout(() => {
    loading.value = false
    toast.add({ icon: 'i-heroicons-check-circle', title: 'Tài khoản của bạn đã xoá', color: 'red' })
    model.value = false
  }, 2000)
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
