<script lang="ts" setup>
import { format } from 'date-fns'
import dayjs from 'dayjs'
import vi from 'date-fns/locale/vi'
import { LabelCommunityStatus } from '~/enums/community-status.enum'
import type { ECommunityType } from '~/enums/community-type.enum'
import { LabelCommunityType } from '~/enums/community-type.enum'
import type { Community, IResponsePagination, User } from '~/types'
import { ERole } from '~/enums/role.enum'
import { LabelCommunityPackageCode } from '~/enums/community-package-code.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  },
  {
    key: 'name',
    label: 'Cộng đồng'
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
    key: 'package_code',
    label: 'Gói'
  },
  {
    key: 'owner',
    label: 'Owner'
  },
  {
    key: 'sale',
    label: 'Sale'
  },
  {
    key: 'total_member',
    label: 'Thành viên',
    sortable: true
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
const { user } = storeToRefs(authStore)
const q = ref()
const keyword = refDebounced(q, 500)
const selected = ref<Community[]>([])
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const sortTable = ref({ column: '_id', direction: 'desc' } as const)
const input = ref<{ input: HTMLInputElement }>()
const page = ref(1)
const createdAt = ref({
  start: dayjs().startOf('month').startOf('day').toDate(), end: dayjs().endOf('day').toDate()
})
const filterStatus = ref()
const filterType = ref()
const filterPackageCode = ref('all')
const filterCreatedAt = computed(() => [createdAt.value.start.toISOString(), createdAt.value.end.toISOString()])
const query = reactive({
  'filter[keyword]': keyword,
  'filter[status]': filterStatus,
  'filter[type]': filterType,
  'filter[package_code]': filterPackageCode,
  'filter[created_at][between]': filterCreatedAt,
  'filter[sale_id]': [ERole.Admin, ERole.Support, ERole.Accountant].some(role => user.value?.roles.includes(role)) ? undefined : user.value?._id,
  'w[]': ['owner', 'sale'],
  page
})

const columns = computed(() =>
  defaultColumns.filter(column => selectedColumns.value.includes(column))
)
const statusOptions = computed(() =>
  Object.keys(LabelCommunityStatus).map(key => ({
    value: key,
    name: LabelCommunityStatus[key]
  }))
)
const typeOptions = computed(() =>
  Object.keys(LabelCommunityType).map(key => ({
    value: key,
    name: LabelCommunityType[key]
  }))
)
const packageCodeOptions = computed(() =>
  Object.keys(LabelCommunityPackageCode).map(key => ({
    value: key,
    name: LabelCommunityPackageCode[key]
  }))
)

watch(sortTable, (newValue) => {
  for (const key in query) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (/^sort\[/.test(key)) delete query[key]
  }

  query[`sort[${newValue.column}]`] = newValue.direction === 'desc' ? -1 : 1
})

const {
  data: communities,
  status,
  refresh
} = await useFetch<IResponsePagination<Community>>('/api/v1/community', {
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

const onUpdateType = async (
  row: Community,
  type: (typeof ECommunityType)[keyof typeof ECommunityType]
) => {
  await $fetch(`/api/v1/community/${row._id}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
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
    const response = await $fetch<DeleteCommunityResponse>(
      `/api/v1/community/${communitySelected.value._id}`,
      {
        method: 'DELETE',
        headers: useRequestHeaders(['cookie'])
      }
    )

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

const exportExcel = async () => {
  try {
    await $fetch(`/api/v1/community/export`, {
      headers: useRequestHeaders(['cookie']),
      query,
      onResponse({ response }) {
        if (response.ok) {
          if (response._data.path) window.open(`${config.public.apiUrl}/${response._data.path}`, '_blank')
          else toast.add({ title: response._data.message })
        }
      }
    })
  } catch (error) {
    console.log(error)
    toast.add({ title: 'Có lỗi khi xử lý export', color: 'red' })
  }
}

const connectCommunity = async (community: Community) => {
  const name = community.short_name ?? community._id
  if ([ERole.Admin, ERole.Sale, ERole.Support].some(role => user.value.roles?.includes(role))) {
    try {
      await $fetch<{ access_token: string }>('/api/v1/auth/create-token-owner', {
        method: 'POST',
        headers: useRequestHeaders(['cookie']),
        body: {
          community_id: community._id
        },
        onResponse({ response }) {
          if (response.ok) {
            window.open(`${config.public.frontendUrl}?token=${response._data.access_token}`, '_blank')
          }
        }
      })
    } catch (error) {
      console.log(error)
    }
  } else {
    window.open(`${config.public.frontendUrl}/${name}`, '_blank')
  }
}

defineShortcuts({
  '/': () => {
    input.value?.input?.focus()
  }
})

const errorMsg = ref()
// chi tiết vai trò
const queryRole = reactive({
  keyword: 'sale'
})
const {
  data: roles
} = await useFetch('/api/v1/admin/roles', {
  query: queryRole,
  headers: useRequestHeaders(['cookie']),
  lazy: true,
  default: () => ({
    data: []
  }),
  onResponseError({ response }) {
    errorMsg.value = response._data?.message ?? ''
  }
})

const rolesComputed = computed(() => {
  return roles?.value?.data.map(role => role._id)
})

// modal chọn sale
const isGetAll = ref(true)
const selectedSale = ref('')
const queryUser = reactive({
  page,
  'sort[_id]': -1,
  'filter[roles][]': rolesComputed,
  isGetAll
})

const {
  data: userSales
} = await useFetch('/api/v1/users', {
  query: queryUser,
  headers: useRequestHeaders(['cookie']),
  lazy: true,
  default: () => ({
    data: []
  }),
  onResponseError({ response }) {
    errorMsg.value = response._data?.message ?? ''
  }
})

const userData = computed(() => {
  return userSales.value
    ? userSales.value.map((user: User) => {
        return {
          label: user.full_name,
          value: user._id
        }
      })
    : []
})

const selectedCommunityId = ref()
const isOpenChooseSaleModal = ref(false)
const onChooseSale = async (communityId: string) => {
  isOpenChooseSaleModal.value = true
  selectedCommunityId.value = communityId
}

const onAgreeChooseSale = async () => {
  await useFetch(`/api/v1/community/assign-sale`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    body: {
      community_id: selectedCommunityId.value,
      sale_id: selectedSale.value
    },
    onResponse({ response }) {
      if (response.ok) {
        isOpenChooseSaleModal.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenChooseSaleModal.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}
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
          <USelect
            v-model="filterPackageCode"
            :options="packageCodeOptions"
            class="hidden lg:block"
            option-attribute="name"
            placeholder="Gói"
          />
          <div class="flex justify-center items-center gap-2">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                :ui="{
                  variant: {
                    solid: 'bg-white text-gray-900 border border-solid border-[#ccc] hover:bg-[#ccc]'
                  }
                }"
                icon="i-heroicons-calendar-days-20-solid"
              >
                {{ format(createdAt.start, 'd MMM, yyy', { locale: vi }) }} -
                {{ format(createdAt.end, 'd MMM, yyy', { locale: vi }) }}
              </UButton>

              <template #panel="{ close }">
                <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                  <DatePicker
                    v-model="createdAt"
                    @close="close"
                  />
                </div>
              </template>
            </UPopover>
          </div>
          <UButton @click="exportExcel">
            Export
          </UButton>
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
        <template #[`owner-data`]="{ row }">
          <p>{{ row.owner.full_name }}</p>
          <p>
            <a
              :href="`tel:${row.owner.phone}`"
              class="text-blue-500"
            >{{ row.owner.phone }}</a>
          </p>
          <p>
            <a
              :href="`mailto:${row.owner.email}`"
              class="text-blue-500"
            >{{ row.owner.email }}</a>
          </p>
        </template>
        <template #[`sale-data`]="{ row }">
          <div v-if="row.saleInfo">
            <p>{{ row.saleInfo.full_name }}</p>
            <p>
              <a
                :href="`tel:${row.saleInfo.phone}`"
                class="text-blue-500"
              >{{ row.saleInfo.phone }}</a>
            </p>
            <p>
              <a
                :href="`mailto:${row.saleInfo.email}`"
                class="text-blue-500"
              >{{ row.saleInfo.email }}</a>
            </p>
          </div>
          <div v-else>
            -
          </div>
        </template>
        <template #[`name-data`]="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="row.name"
              :src="row.icon"
              size="xs"
            />

            <span class="text-gray-900 dark:text-white font-medium">
              {{ row.name }}
            </span>
          </div>
        </template>
        <template #[`status-data`]="{ row }">
          {{ LabelCommunityStatus[row.status] }}
        </template>
        <template #[`package_code-data`]="{ row }">
          <p>{{ row.package_code }}</p>
          <p
            v-if="row.package_expires"
            :class="{ 'text-red-500 font-bold': $dayjs(row.package_expires).diff($dayjs(), 'month') < 1 }"
          >
            {{ format(row.package_expires, 'dd/MM/yyyy') }}
          </p>
        </template>
        <template #[`type-data`]="{ row }">
          <USelect
            v-if="[ERole.Admin, ERole.Support].some(role => user?.roles.includes(role))"
            v-model="row.type"
            :options="typeOptions"
            option-attribute="name"
            placeholder="Kiểu"
            @change="onUpdateType(row, $event)"
          />
          <span v-else>{{ LabelCommunityType[row.type] }}</span>
        </template>
        <template #[`created_at-data`]="{ row }">
          {{ $dayjs(row.created_at).format("HH:mm DD/MM/YYYY") }}
        </template>
        <template #[`action-data`]="{ row }">
          <div class="flex gap-1">
            <UTooltip
              v-if="(user.roles?.includes(ERole.Admin) || user.roles?.includes(ERole.Support)) && !user.roles?.includes(ERole.Sale)"
              text="Gán sale"
            >
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-user-plus"
                target="_blank"
                color="gray"
                @click="onChooseSale(row._id)"
              />
            </UTooltip>
            <UTooltip text="Truy cập cộng đồng">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-link-solid"
                target="_blank"
                @click="connectCommunity(row)"
              />
            </UTooltip>
            <UTooltip
              v-if="user.roles?.includes(ERole.Admin)"
              text="Xóa cộng đồng"
            >
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="red"
                icon="i-heroicons-trash"
                @click="openModal(row)"
              />
            </UTooltip>
            <UModal v-model="isOpen">
              <UCard
                :ui="{
                  ring: '',
                  divide: 'divide-y divide-gray-100 dark:divide-gray-800'
                }"
              >
                <div class="text-center">
                  <p>
                    Bạn có muốn xóa cộng đồng {{ communitySelected.name }} ?
                  </p>
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

    <!-- modal chọn sale -->
    <UModal
      v-model="isOpenChooseSaleModal"
      :ui="{ container: 'items-start sm:items-start' }"
      prevent-close
    >
      <UCard
        :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800'
      }"
      >
        <template #header>
          <div class="flex justify-between">
            <h3 class="font-bold text-2xl">
              Gán sale
            </h3>
            <UButton
              class="-my-1"
              color="gray"
              icon="i-heroicons-x-mark-20-solid"
              variant="ghost"
              @click="isOpenChooseSaleModal = false"
            />
          </div>
        </template>
        <div class="flex flex-col w-full gap-2">
          <p>Danh sách sales</p>
          <USelectMenu
            v-model="selectedSale"
            :options="userData"
            class="w-full"
            clear-search-on-close
            option-attribute="label"
            placeholder="--- Chọn sale ---"
            searchable
            searchable-placeholder="Tìm kiếm sale..."
            value-attribute="value"
          >
            <template #option-empty="{ query }">
              Không tìm thấy sale <q>{{ query }}</q>
            </template>
          </USelectMenu>
        </div>
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              :ui="{ padding: { sm: 'px-5 py-2' } }"
              color="primary"
              label="Đồng ý"
              @click="onAgreeChooseSale"
            />
          </div>
        </template>
      </UCard>
    </UModal>
    <!---->
  </UDashboardPage>
</template>
