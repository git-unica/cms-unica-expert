<script lang="ts" setup>
import type { IResponsePagination, Role, User } from '~/types'

const toast = useToast()
const props = withDefaults(defineProps<{ roles?: Role[], keyword?: string, haveNewMember?: boolean }>(), { haveNewMember: false })
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken, user } = storeToRefs(authStore)
const keyword = computed(() => props.keyword)
const isEditModalOpen = ref(false)
const editMember = ref<User>()
const confirmDeleteMember = ref(false)
const removeMember = ref<User>()
const deleting = ref(false)
const page = ref(1)

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
    click: () => {
      removeMember.value = member
      confirmDeleteMember.value = true
    }
  }]]
}

const queryRoles = computed(() => props.roles?.map(role => role._id))

const { data: members, status: statusMembers, refresh: refreshMembers } = useFetch<IResponsePagination<User>>('v1/users', {
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` },
  query: {
    keyword,
    page,
    'filter[roles][]': queryRoles
  }
})

watch(() => props.haveNewMember, () => refreshMembers())

const findRole = (id: string) => {
  return props.roles.find(role => role._id === id)
}

const onDelete = async () => {
  deleting.value = true
  await $fetch(`v1/users/${removeMember.value._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    onResponse({ response }) {
      if (response.ok) {
        if (removeMember.value._id === user.value._id) {
          authStore.logout()
          navigateTo('/')
        }

        const idx = members.value.data.findIndex(m => m._id === removeMember.value._id)
        members.value.data.splice(idx, 1)
        members.value.meta.itemCount--
        members.value.meta.pageCount--

        toast.add({ icon: 'i-heroicons-check-circle', title: `Tài khoản ${removeMember.value.full_name} đã xoá`, color: 'green' })
        removeMember.value = undefined
      } else {
        toast.add({ title: `Có lỗi khi xoá tài khoản`, color: 'red' })
      }
    }
  })
  deleting.value = false
}

const onCloseEditModal = (requireRefresh: boolean) => {
  isEditModalOpen.value = false
  editMember.value = undefined

  if (requireRefresh === true) refreshMembers()
}
</script>

<template>
  <template v-if="statusMembers === 'success' && members">
    <ul
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
    <div class="my-2 flex justify-center">
      <UPagination
        v-model="page"
        :page-count="members.meta.take"
        :total="members.meta.itemCount"
      />
    </div>
  </template>
  <UDashboardModal
    v-if="editMember"
    v-model="isEditModalOpen"
    :ui="{ width: 'sm:max-w-md' }"
    description="Mỗi nhân viên có thể có nhiều vai trò đồng thời"
    title="Phân vai trò nhân viên"
  >
    <SettingsEditMembersForm
      :member="editMember"
      :roles="props.roles"
      @close="onCloseEditModal"
    />
  </UDashboardModal>
  <UDashboardModal
    v-if="removeMember"
    v-model="confirmDeleteMember"
    :close-button="null"
    :description="`Bạn có chắc rằng bạn muốn xóa tài khoản ${removeMember.full_name} chứ?`"
    :ui="{
      icon: {
        base: 'text-red-500 dark:text-red-400'
      } as any,
      footer: {
        base: 'ml-16'
      } as any
    }"
    icon="i-heroicons-exclamation-circle"
    prevent-close
    title="Xoá tài khoản"
  >
    <template #footer>
      <UButton
        :loading="deleting"
        color="red"
        label="Xoá"
        @click="onDelete"
      />
      <UButton
        color="white"
        label="Huỷ"
        @click="confirmDeleteMember = false"
      />
    </template>
  </UDashboardModal>
</template>
