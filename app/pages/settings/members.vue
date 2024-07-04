<script lang="ts" setup>
import type { Role } from '~/types'
import { ERole } from '~/enums/role.enum'

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const q = ref()
const isInviteModalOpen = ref(false)

const { data: roles } = useFetch<Role[]>('/v1/admin/roles/list', {
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` }
})

const managerRoles = computed(() => roles.value?.filter(role => Object.values(ERole).includes(role.name)))
</script>

<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardSection
      :ui="{ container: 'lg:sticky top-2' }"
      description="Mời thành viên mới bằng địa chỉ email."
      orientation="horizontal"
      title="Quản lý truy cập"
    >
      <template #links>
        <UButton
          color="black"
          label="Thêm người"
          @click="isInviteModalOpen = true"
        />
      </template>

      <UCard
        :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }"
        class="min-w-0"
      >
        <template #header>
          <UInput
            v-model="q"
            autofocus
            icon="i-heroicons-magnifying-glass"
            placeholder="Tìm kiếm nhân viên"
          />
        </template>

        <SettingsMembersList
          :keyword="q"
          :roles="managerRoles"
        />
      </UCard>
    </UDashboardSection>

    <UDashboardModal
      v-model="isInviteModalOpen"
      :ui="{ width: 'sm:max-w-md' }"
      description="Invite new members by email address"
      title="Invite people"
    >
      <SettingsAddMembersForm @close="isInviteModalOpen = false" />
    </UDashboardModal>
  </UDashboardPanelContent>
</template>
