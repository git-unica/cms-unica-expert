<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import type { Role, User } from '~/types'

const toast = useToast()
const emit = defineEmits(['close'])
const props = defineProps<{ member: User, roles: Role[] }>()
const member = ref(props.member)
const selectRoles = computed(() => props.roles.map(role => ({ id: role._id, name: role.name })))
const requestRefreshMembers = ref(false)

async function onSubmit(event: FormSubmitEvent<User>) {
  await $fetch(`/api/v1/users/${event.data._id}/roles`, {
    method: 'PATCH',
    body: {
      roles: event.data.roles
    },
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        if (event.data.roles.length === 0) {
          requestRefreshMembers.value = true
          toast.add({ title: `${event.data.full_name} đã không còn vai trò nào trong hệ thống`, color: 'green' })
        } else
          toast.add({ title: 'Đã cập nhật thông tin thành công', color: 'green' })
      } else {
        toast.add({ title: 'Cập nhật thông tin thất bại', color: 'red' })
      }
    }
  })

  emit('close', requestRefreshMembers.value)
}
</script>

<template>
  <UForm
    :state="member"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormGroup
      label="Họ tên"
      name="full_name"
    >
      <UInput
        v-model="member.full_name"
        disabled
      />
    </UFormGroup>
    <UFormGroup
      label="Email"
      name="email"
    >
      <UInput
        v-model="member.email"
        disabled
        placeholder="Ví dụ: john.doe@example.com"
        type="email"
      />
    </UFormGroup>

    <UFormGroup
      label="Vai trò"
      name="role"
    >
      <USelectMenu
        v-model="member.roles"
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

<style scoped>

</style>
