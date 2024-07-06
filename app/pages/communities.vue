<script lang="ts" setup>
import type { Community, IResponsePagination } from '~/types'
import { ECommunityStatus, LabelCommunityStatus } from '~/enums/community-status.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  }, {
    key: 'name',
    label: 'Cộng đồng',
    sortable: true
  },
  {
    key: 'status',
    label: 'Trạng thái'
  },
  {
    key: 'created_at',
    label: 'Ngày tạo'
  },
  {
    key: 'action',
    label: 'Hành động'
  }
]

const toast = useToast()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const q = ref()
const keyword = refDebounced(q, 500)
const selected = ref<Community[]>([])
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const sortTable = ref({ column: '_id', direction: 'desc' } as const)
const input = ref<{ input: HTMLInputElement }>()
const page = ref(1)
const filterStatus = ref(ECommunityStatus.NotActivated)
const query = reactive({
  'filter[keyword]': keyword,
  'filter[status]': filterStatus,
  page
})

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))
const statusOptions = computed(() => Object.keys(LabelCommunityStatus).map(key => ({ value: key, name: LabelCommunityStatus[key] })))

watch(sortTable, (newValue) => {
  for (const key in query) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (/^sort\[/.test(key)) delete query[key]
  }

  query[`sort[${newValue.column}]`] = newValue.direction === 'desc' ? -1 : 1
})

const { data: communities, status, refresh } = await useFetch<IResponsePagination<Community>>('/v1/community', {
  query,
  baseURL: config.public.apiUrl
})

function onSelect(row: Community) {
  const index = selected.value.findIndex(item => item._id === row._id)
  if (index === -1) {
    selected.value.push(row)
  } else {
    selected.value.splice(index, 1)
  }
}

const onUpdateStatus = async (row: Community, status: (typeof ECommunityStatus)[keyof typeof ECommunityStatus]) => {
  await $fetch(`/v1/community/${row._id}`, {
    method: 'PATCH',
    baseURL: config.public.apiUrl,
    headers: { Authorization: `Bearer ${accessToken.value}` },
    body: {
      status
    },
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        toast.add({ title: 'Cập nhật trạng thái thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
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
        :badge="communities.meta.itemCount"
        title="Cộng đồng"
      >
        <template #right>
          <UInput
            ref="input"
            v-model="q"
            autocomplete="off"
            class="hidden lg:block"
            icon="i-heroicons-funnel"
            placeholder="Tìm kiếm cộng đồng..."
            @keydown.esc="$event.target.blur()"
          >
            <template #trailing>
              <UKbd value="/" />
            </template>
          </UInput>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <USelect
            v-model="filterStatus"
            :options="statusOptions"
            class="hidden lg:block"
            option-attribute="name"
            placeholder="Trạng thái"
          />
        </template>
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

      <UTable
        v-model="selected"
        v-model:sort="sortTable"
        :columns="columns"
        :loading="status === 'pending'"
        :rows="communities.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
        @select="onSelect"
      >
        <template #[`name-data`]="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="row.name"
              :src="row.icon"
              size="xs"
            />

            <span class="text-gray-900 dark:text-white font-medium">{{ row.name }}</span>
          </div>
        </template>
        <template #[`status-data`]="{ row }">
          {{ LabelCommunityStatus[row.status] }}
        </template>
        <template #[`created_at-data`]="{ row }">
          {{ $dayjs(row.created_at).format('HH:mm DD/MM/YYYY') }}
        </template>
        <template #[`action-data`]="{ row }">
          <UTooltip text="Truy cập cộng đồng">
            <UButton
              :to="`${config.public.frontendUrl}/community/@${row.short_name ?? row._id}`"
              :ui="{ rounded: 'rounded-full' }"
              class="mr-1"
              icon="i-heroicons-link-solid"
              target="_blank"
            />
          </UTooltip>
          <UTooltip
            v-if="row.status === ECommunityStatus.NotActivated"
            text="Chuyển thành Công Khai"
          >
            <UButton
              :ui="{ rounded: 'rounded-full' }"
              color="green"
              icon="i-heroicons-lock-open"
              @click="onUpdateStatus(row, ECommunityStatus.Public)"
            />
          </UTooltip>
          <UTooltip
            v-else
            text="Chuyển thành Chưa kích hoạt"
          >
            <UButton
              :ui="{ rounded: 'rounded-full' }"
              color="rose"
              icon="i-heroicons-lock-closed"
              @click="onUpdateStatus(row, ECommunityStatus.NotActivated)"
            />
          </UTooltip>
        </template>
      </UTable>
      <UDivider />
      <div class="my-2 mx-auto">
        <UPagination
          v-model="page"
          :page-count="communities.meta.take"
          :total="communities.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
