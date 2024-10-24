<script lang="ts" setup>
import numeral from 'numeral'
import dayjs from 'dayjs'
import { format, sub } from 'date-fns'
import type { Order } from '~/types'
import { OrderStatus } from '~/enums/order-status.enum'
import { useAuthStore } from '~/stores/auth'
import { ECommunityOrderStatus } from '~/enums/community-order.enum'
import { ERole } from '~/enums/role.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    hidden: true
  }, {
    key: 'buyer_name',
    label: 'Người mua'
  }, {
    key: 'community_name',
    label: 'Tên cộng đồng'
  },
  {
    key: 'course_name',
    label: 'Tên khóa học'
  },
  {
    key: 'period',
    label: 'Thời hạn'
  },
  {
    key: 'total_amount',
    label: 'Tổng tiền'
  },
  {
    key: 'type',
    label: 'Kiểu đơn'
  },
  {
    key: 'created_at',
    label: 'Ngày tạo'
  },
  {
    key: 'status',
    label: 'Trạng thái'
  },
  {
    key: 'action',
    label: 'Hành động'
  }
]

// filter by date range picker
const selectedDate = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })

// filter by status
const selectedStatus = ref()
const statusOptions = [{
  value: ECommunityOrderStatus.Processing,
  label: 'Đang xử lý'
}, {
  value: ECommunityOrderStatus.Paid,
  label: 'Đã thanh toán'
}
]

const toast = useToast()
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const page = ref(1)
const query = reactive({
  page,
  'sort[_id]': -1
})

watch([selectedDate, selectedStatus], ([newSelectedDate, newSelectedStatus]) => {
  if (newSelectedDate) {
    query['filter[fromDate]'] = dayjs(newSelectedDate.start).toString()
    query['filter[toDate]'] = dayjs(newSelectedDate.end).toString()
    query['page'] = 1
    refresh()
  }

  if (newSelectedStatus !== '' && newSelectedStatus !== null) {
    query['filter[status]'] = newSelectedStatus
    query['page'] = 1
    refresh()
  }
})

const errorMsg = ref()
const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))
const { data: orders, status, refresh } = await useFetch('/api/v1/community-order', {
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

const isOpenDeleteOrderModal = ref(false)
const selectedOrderId = ref()
const openDeleteOrderModal = (row: Order) => {
  if (row.status === OrderStatus.Paid) {
    toast.add({ title: 'Thông báo', description: 'Đơn có trạng thái đã thanh toán phải hủy đơn mới được xóa', color: 'red' })
  } else {
    selectedOrderId.value = row._id
    isOpenDeleteOrderModal.value = true
  }
}

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const onDeleteOrder = async () => {
  await useFetch(`/api/v1/community-order/${selectedOrderId.value}`, {
    method: 'DELETE',
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        isOpenDeleteOrderModal.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenDeleteOrderModal.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}
const closeDeleteOrderModal = () => {
  isOpenDeleteOrderModal.value = false
}

// redirect detail
const redirectToOrderDetail = async (row: Order) => {
  await navigateTo({ path: '/order/community-order/' + row._id })
}

// redirect to receipt
const redirectToReceipt = async (row: Order) => {
  await navigateTo({ path: '/order/community-order/' + row._id + '/receipt' })
}

// reset
const onResetFilter = () => {
  if (query['filter[fromDate]']) {
    delete query['filter[fromDate]']
  }

  if (query['filter[toDate]']) {
    delete query['filter[toDate]']
  }

  if (Object.keys(query).includes('filter[status]')) {
    delete query['filter[status]']
  }

  query['page'] = 1
  selectedStatus.value = undefined
  refresh()
}

// user info
const checkUserRole = computed(() => {
  return user?.value.roles
})

const title = 'Đơn hàng cộng đồng'

useSeoMeta({
  title
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="orders.meta.itemCount"
        title="Đơn hàng cộng đồng"
      >
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex gap-6">
            <div class="flex justify-center items-center gap-2">
              <h4>Lọc theo khoảng thời gian: </h4>
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton icon="i-heroicons-calendar-days-20-solid">
                  {{ format(selectedDate.start, 'd MMM, yyy') }} - {{ format(selectedDate.end, 'd MMM, yyy') }}
                </UButton>

                <template #panel="{ close }">
                  <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                    <DatePicker v-model="selectedDate" @close="close" />
                  </div>
                </template>
              </UPopover>
            </div>
            <div class="flex justify-center items-center gap-2">
              <h4>Lọc theo trạng thái: </h4>
              <USelectMenu
                v-model="selectedStatus"
                :options="statusOptions"
                placeholder="Chọn trạng thái"
                value-attribute="value"
                option-attribute="label"
                class="w-[200px]"
              />
            </div>
            <UButton
              icon="i-heroicons-arrow-path-16-solid"
              size="sm"
              color="primary"
              variant="solid"
              label="Button"
              :trailing="false"
              @click="onResetFilter"
            >
              Làm mới
            </UButton>
          </div>
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
        :columns="columns"
        :loading="status === 'pending'"
        :rows="orders.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #period-data="{ row }">
          {{ row.period }} tháng
        </template>
        <template #total_amount-data="{ row }">
          {{ numeral(row.total_amount).format() }} đ
        </template>
        <template #created_at-data="{ row }">
          {{ dayjs(row.created_at).format('HH:mm DD/MM/YYYY') }}
        </template>
        <template #type-data="{ row }">
          {{ row.type === 1 ? 'Tham gia cộng đồng trả phí' : (row.type === 2 ? 'Mua khóa học' : '') }}
        </template>
        <template #status-data="{ row }">
          {{ row.status === OrderStatus.Processing ? 'Đang xử lý' : (row.status === OrderStatus.Paid ? 'Đã thanh toán' : 'Đã hủy') }}
        </template>
        <template #action-data="{ row }">
          <div class="flex gap-1">
            <UTooltip text="Chi tiết đơn">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-eye-20-solid"
                @click="redirectToOrderDetail(row)"
              />
            </UTooltip>
            <UTooltip text="Phiếu thu" v-if="checkUserRole.includes(ERole.Accountant)">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-clipboard-document-check-solid"
                color="orange"
                @click="redirectToReceipt(row)"
              />
            </UTooltip>
            <UTooltip text="Xóa đơn" v-if="checkUserRole.includes(ERole.Admin)">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="red"
                icon="i-heroicons-trash"
                @click="openDeleteOrderModal(row)"
              />
            </UTooltip>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? 'Không có dữ liệu' }}</span>
          </div>
        </template>
      </UTable>
      <!-- modal xóa đơn hàng -->
      <UModal v-model="isOpenDeleteOrderModal" :ui="{ container: 'items-start sm:items-start' }" prevent-close>
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex justify-between">
              <h3 class="font-bold text-2xl">Xóa đơn hàng</h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpenDeleteOrderModal = false" />
            </div>
          </template>
          <p>Bạn có chắc chắn muốn xóa đơn hàng này không ?</p>
          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton label="Thoát" color="red" @click="closeDeleteOrderModal" :ui="{ padding: { sm: 'px-5 py-2' } }"/>
              <UButton label="Đồng ý" color="primary" @click="onDeleteOrder" :ui="{ padding: { sm: 'px-5 py-2' } }" />
            </div>
          </template>
        </UCard>
      </UModal>
      <!---->
      <UDivider />
      <div
        v-if="orders.meta.itemCount > 0"
        class="my-2 flex justify-end mr-6"
      >
        <UPagination
          v-model="page"
          :page-count="orders.meta.take"
          :total="orders.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
