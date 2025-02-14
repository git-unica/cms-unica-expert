<script lang="ts" setup>
import { format } from 'date-fns'
import type { AffiliateLevel, IResponsePagination, User } from '~/types'
import { ERole } from '~/enums/role.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  }, {
    key: 'full_name',
    label: 'Họ tên'
  }, {
    key: 'email',
    label: 'Email'
  },
  {
    key: 'created_at',
    label: 'Ngày tham gia',
    sortable: true
  },
  {
    key: 'phone',
    label: 'Số điện thoại'
  }
]

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const q = ref()
const keyword = refDebounced(q, 500)
const selected = ref<User[]>([])
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const sortTable = ref({ column: '_id', direction: 'desc' } as const)
const input = ref<{ input: HTMLInputElement }>()
const isNewUserModalOpen = ref(false)
const page = ref(1)
const query = reactive({
  keyword,
  page,
  'filter[sale_id]': [ERole.Admin, ERole.Support, ERole.Accountant].some(role => user.value?.roles.includes(role)) ? undefined : user.value?._id,
  'sort[_id]': -1
})
const errorMsg = ref()

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

watch(sortTable, (newValue) => {
  for (const key in query) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (/^sort\[/.test(key)) delete query[key]
  }

  query[`sort[${newValue.column}]`] = newValue.direction === 'desc' ? -1 : 1
})

const { data: users, status } = await useFetch<IResponsePagination<User>>('/api/v1/users', {
  query,
  headers: useRequestHeaders(['cookie']),
  lazy: true,
  default: () => ({
    meta: {
      page: 0,
      take: 10,
      itemCount: 0,
      pageCount: 0,
      hasPreviousPage: false,
      hasNextPage: false
    },
    data: []
  }),
  onResponseError({ response }) {
    errorMsg.value = response._data?.message ?? ''
  }
})

const affLevelOptions = ref([])
const { data: allAffLevel } = useLazyFetch<AffiliateLevel[]>(`/api/v1/affiliate-level`)

watchEffect(() => {
  if (allAffLevel.value) {
    affLevelOptions.value = allAffLevel.value.map(a => ({ name: a.name, value: a._id }))
  }
})

function onSelect(row: User) {
  const index = selected.value.findIndex(item => item._id === row._id)
  if (index === -1) {
    selected.value.push(row)
  } else {
    selected.value.splice(index, 1)
  }
}

defineShortcuts({
  '/': () => {
    input.value?.input?.focus()
  }
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="users.meta.itemCount"
        title="Thành viên"
      >
        <template #right>
          <UInput
            ref="input"
            v-model="q"
            autocomplete="off"
            class="hidden lg:block"
            icon="i-heroicons-funnel"
            placeholder="Tìm kiếm thành viên..."
            @keydown.esc="$event.target.blur()"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UInput>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <USelectMenu
            v-model="selectedColumns"
            :options="defaultColumns"
            class="hidden lg:block"
            icon="i-heroicons-adjustments-horizontal-solid"
            multiple
          >
            <template #label>
              Hiển thị
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>

      <UDashboardModal
        v-model="isNewUserModalOpen"
        :ui="{ width: 'sm:max-w-md' }"
        description="Add a new user to your database"
        title="New user"
      >
        <!-- ~/components/users/UsersForm.vue -->
        <UsersForm @close="isNewUserModalOpen = false" />
      </UDashboardModal>

      <UTable
        v-model="selected"
        v-model:sort="sortTable"
        :columns="columns"
        :loading="status === 'pending'"
        :rows="users.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
        @select="onSelect"
      >
        <template #[`full_name-data`]="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="row.full_name"
              :src="row.avatar"
              size="xs"
            />

            <NuxtLink
              :to="`${config.public.frontendUrl}/@${row.username ?? row._id}`"
              class="text-gray-900 dark:text-white font-medium"
            >{{ row.full_name }}
            </NuxtLink>
          </div>
        </template>
        <template #[`created_at-data`]="{ row }">
          {{ format(row.created_at, 'dd/MM/yyyy') }}
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? 'Không có thành viên' }}</span>
          </div>
        </template>
      </UTable>
      <UDivider />
      <div
        v-if="users.meta.itemCount > 0"
        class="my-2 mx-auto"
      >
        <UPagination
          v-model="page"
          :page-count="users.meta.take"
          :total="users.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
