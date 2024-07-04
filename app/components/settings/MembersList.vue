<script lang="ts" setup>
import type { IResponsePagination, Role, User } from '~/types'

const props = defineProps<{ roles?: Role[], keyword?: string }>()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const keyword = computed(() => props.keyword)
const isEditModalOpen = ref(false)
const editMember = ref<User>()

function getItems(member: User) {
  return [[{
    label: 'Sửa',
    click: () => {
      editMember.value = member
      isEditModalOpen.value = true
    }
  }, {
    label: 'Xoá',
    labelClass: 'text-red-500 dark:text-red-400',
    click: () => console.log('Remove', member)
  }]]
}

const queryRoles = computed(() => props.roles?.map(role => role._id))

const { data: members } = useFetch<IResponsePagination<User>>('v1/users', {
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` },
  query: {
    keyword,
    'filter[roles][]': queryRoles
  }
})

const findRole = (id: string) => {
  return props.roles.find(role => role._id === id)
}
</script>

<template>
  <ul
    v-if="members"
    class="divide-y divide-gray-200 dark:divide-gray-800"
    role="list"
  >
    <li
      v-for="(member, index) in members.data"
      :key="index"
      class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6"
    >
      <div class="flex items-center gap-3 min-w-0">
        <UAvatar
          :src="member.avatar"
          size="md"
        />

        <div class="text-sm min-w-0">
          <p class="text-gray-900 dark:text-white font-medium truncate">
            {{ member.full_name }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 truncate">
            {{ member.username }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UKbd
          v-for="mr in member.roles"
          :key="mr"
        >
          {{ findRole(mr).name }}
        </UKbd>

        <UDropdown
          :items="getItems(member)"
          position="bottom-end"
        >
          <UButton
            color="gray"
            icon="i-heroicons-ellipsis-vertical"
            variant="ghost"
          />
        </UDropdown>
      </div>
    </li>
  </ul>
  <UDashboardModal
    v-model="isEditModalOpen"
    :ui="{ width: 'sm:max-w-md' }"
    description="Mỗi nhân viên có thể có nhiều vai trò đồng thời"
    title="Phân vai trò nhân viên"
  >
    <!-- ~/components/settings/MembersForm.vue -->
    <SettingsEditMembersForm
      :member="editMember"
      :roles="props.roles"
      @close="isEditModalOpen = false"
    />
  </UDashboardModal>
</template>
