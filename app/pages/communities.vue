<script lang="ts" setup>
import type { ECommunityType } from '~/enums/community-type.enum'
import { LabelCommunityType } from '~/enums/community-type.enum'
import type { Community, IResponsePagination } from '~/types'
import { LabelCommunityStatus } from '~/enums/community-status.enum'

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
    key: 'type',
    label: 'Kiểu'
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
const filterStatus = ref()
const filterType = ref()
const query = reactive({
  'filter[keyword]': keyword,
  'filter[status]': filterStatus,
  'filter[type]': filterType,
  page
})

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))
const statusOptions = computed(() => Object.keys(LabelCommunityStatus).map(key => ({ value: key, name: LabelCommunityStatus[key] })))
const typeOptions = computed(() => Object.keys(LabelCommunityType).map(key => ({ value: key, name: LabelCommunityType[key] })))

watch(sortTable, (newValue) => {
  for (const key in query) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (/^sort\[/.test(key)) delete query[key]
  }

  query[`sort[${newValue.column}]`] = newValue.direction === 'desc' ? -1 : 1
})

const { data: communities, status, refresh } = await useFetch<IResponsePagination<Community>>('/api/v1/community', {
  query,
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
  })
})

function onSelect(row: Community) {
  const index = selected.value.findIndex(item => item._id === row._id)
  if (index === -1) {
    selected.value.push(row)
  } else {
    selected.value.splice(index, 1)
  }
}

const onUpdateType = async (row: Community, type: (typeof ECommunityType)[keyof typeof ECommunityType]) => {
  await $fetch(`/api/v1/community/${row._id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    body: {
      type
    },
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        toast.add({ title: 'Cập nhật kiểu thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}
interface DeleteCommunityResponse {
  message: string
  statusCode: number
  data: Record<string, unknown>
}
const communitySelected = ref<Community | null>(null)
const isOpen = ref(false)
const openModal = (row: Community) => {
  communitySelected.value = row
  isOpen.value = true
}
const deleteCommunity = async () => {
  try {
    const response: DeleteCommunityResponse = await $fetch(`/api/v1/community/${communitySelected.value._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken.value}` }
    })

    if (response.statusCode === 200) {
      await refresh()
      toast.add({ title: response.message, color: 'green' })
    } else if (response.statusCode === 500) {
      toast.add({ title: 'Không thể xóa cộng đồng', color: 'red' })
    } else {
      toast.add({ title: 'Đã xảy ra lỗi', color: 'red' })
    }
  } catch (error) {
    console.error('Error deleting community:', error)
    toast.add({ title: 'Có lỗi xảy ra trong quá trình xóa', color: 'red' })
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
          <USelect
            v-model="filterType"
            :options="typeOptions"
            class="hidden lg:block"
            option-attribute="name"
            placeholder="Kiểu"
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
        <template #[`type-data`]="{ row }">
          <USelect
            v-model="row.type"
            :options="typeOptions"
            option-attribute="name"
            placeholder="Kiểu"
            @change="onUpdateType(row, $event)"
          />
        </template>
        <template #[`created_at-data`]="{ row }">
          {{ $dayjs(row.created_at).format('HH:mm DD/MM/YYYY') }}
        </template>
        <template #[`action-data`]="{ row }">
          <div class="flex gap-1">
            <UTooltip text="Truy cập cộng đồng">
              <UButton
                :to="`${config.public.frontendUrl}/community/@${row.short_name ?? row._id}`"
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-link-solid"
                target="_blank"
              />
            </UTooltip>

            <UTooltip text="Xóa cộng đồng">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="red"
                icon="i-heroicons-trash"
                @click="openModal(row)"
              />
            </UTooltip>
            <UModal v-model="isOpen">
              <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                <div class="text-center">
                  <p>Bạn có muốn xóa cộng đồng {{ communitySelected.name }} ? </p>
                </div>

                <template #footer>
                  <div class="flex justify-end space-x-2">
                    <UButton
                      color="red"
                      @click="deleteCommunity()"
                    >
                      Có
                    </UButton>
                    <UButton
                      color="gray"
                      @click="isOpen = false"
                    >
                      Không
                    </UButton>
                  </div>
                </template>
              </UCard>
            </UModal>
          </div>
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
