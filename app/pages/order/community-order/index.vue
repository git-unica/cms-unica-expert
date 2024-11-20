<script lang="ts" setup>
import numeral from 'numeral'
import dayjs from 'dayjs'
import { format, sub } from 'date-fns'
import type { Order, Role } from '~/types'
import { OrderPaymentStatus, OrderStatus } from '~/enums/order-status.enum'
import { ECommunityOrderPaymentStatus, ECommunityOrderStatus, ECommunityOrderType } from '~/enums/community-order.enum'
import { ERole } from '~/enums/role.enum'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

if (![ERole.Admin, ERole.Support].some(role => user.value?.roles.includes(role))) {
  showError({
    statusCode: 403,
    statusMessage: 'Không có quyền truy cập đơn hàng cộng đồng'
  })
}
const defaultColumns = [
  {
    key: 'order_code',
    label: 'Mã đơn'
  },
  {
    key: '_id',
    label: '#',
    hidden: true
  }, {
    key: 'buyer_name',
    label: 'Người mua'
  }, {
    key: 'community_name',
    label: 'Cộng đồng'
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
    key: 'sale',
    label: 'Sale'
  },
  {
    key: 'note',
    label: 'Ghi chú'
  },
  {
    key: 'ref',
    label: 'Ref'
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
    key: 'payment',
    label: 'Thanh toán'
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

const { data: listRoles } = useFetch<Role[]>('/api/v1/admin/roles/list', {
  headers: useRequestHeaders(['cookie'])
})

const listRolesCanProcessOrder = ref([])
if (listRoles.value) {
  for (const role of listRoles.value) {
    if (role['name'] === ERole.Admin || role['name'] === ERole.Accountant || role['name'] === ERole.Sale) {
      listRolesCanProcessOrder.value.push(role['name'])
    }
  }
}
// filter by date range picker
const selectedDate = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })

// filter by status
const selectedStatus = ref()
const statusOptions = [{
  value: ECommunityOrderStatus.Processing,
  label: 'Chờ xử lý'
}, {
  value: ECommunityOrderStatus.Paid,
  label: 'Thành công'
}, {
  value: ECommunityOrderStatus.Cancel,
  label: 'Đã hủy'
}, {
  value: ECommunityOrderStatus.Refund,
  label: 'Hoàn tiền'
}, {
  value: ECommunityOrderStatus.Removed,
  label: 'Đã xóa'
}
]

const toast = useToast()
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const page = ref(1)
const query = reactive({
  page,
  'sort[_id]': -1
})

const errorMsg = ref()
const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))
const { data: orders, status, refresh } = await useFetch('/api/v1/community-order', {
  query,
  headers: useRequestHeaders(['cookie']),
  watch: false,
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
  await navigateTo({ path: '/order/community-order/' + row.order_code })
}

// redirect to receipt
const redirectToReceipt = async (row: Order) => {
  await navigateTo({ path: '/order/community-order/' + row.order_code + '/receipt' })
}

// reset
const onResetFilter = async () => {
  delete query['filter[content_type]']
  delete query['filter[keyword]']
  delete query['filter[status]']
  delete query['filter[payment_status]']
  selectedContent.value = ''
  textSearch.value = ''
  selectedStatus.value = ''
  selectedPaymentStatus.value = ''
  delete query['filter[from_date]']
  delete query['filter[to_date]']
  query['page'] = 1
  await refresh()
}

const title = 'Đơn hàng cộng đồng'

useSeoMeta({
  title
})

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

// chọn sale
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
    ? userSales.value.map((user) => {
      return {
        label: user.full_name,
        value: user._id
      }
    })
    : []
})

const isOpenChooseSaleModal = ref(false)
// const onChooseSale = async (orderId: string) => {
//   isOpenChooseSaleModal.value = true
//   selectedOrderId.value = orderId
// }

const onAgreeChooseSale = async () => {
  await useFetch(`/api/v1/community-order/assign-sale`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    body: {
      order_id: selectedOrderId.value,
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

// bộ lọc
const textSearch = ref('')
const contentOptions = [{
  value: 'order_code',
  label: 'Mã đơn'
}, {
  value: 'name',
  label: 'Họ tên'
}, {
  value: 'community',
  label: 'Cộng đồng'
}, {
  value: 'ref',
  label: 'Ref'
}, {
  value: 'sale',
  label: 'Sale'
}
]
const selectedContent = ref(contentOptions[0].value)

const selectedPaymentStatus = ref('')
const paymentStatusOptions = [{
  value: OrderPaymentStatus.NotPay,
  label: 'Chưa TT'
}, {
  value: OrderPaymentStatus.Paid,
  label: 'Đã TT'
}, {
  value: OrderPaymentStatus.Cancel,
  label: 'Đã hủy'
}]

const onSearch = async () => {
  if (selectedContent.value && textSearch.value) {
    query['filter[content_type]'] = selectedContent.value
    query['filter[keyword]'] = textSearch.value.trim()
  } else {
    delete query['filter[content_type]']
    delete query['filter[keyword]']
  }

  query['page'] = 1
  await refresh()
}

watch([selectedStatus, selectedPaymentStatus], ([newSelectedStatus, newSelectedPaymentStatus]) => {
  if (newSelectedStatus !== '' && newSelectedStatus !== null) {
    query['filter[status]'] = newSelectedStatus
  }

  if (newSelectedPaymentStatus !== '' && newSelectedPaymentStatus !== null) {
    query['filter[payment_status]'] = newSelectedPaymentStatus
  }
})

watch(() => selectedDate.value.start, (newStartDate) => {
  if (newStartDate) {
    selectedDate.value.start = newStartDate
    query['filter[from_date]'] = dayjs(newStartDate).toString()
  }
})

watch(() => selectedDate.value.end, (newEndDate) => {
  if (newEndDate) {
    selectedDate.value.end = newEndDate
    query['filter[to_date]'] = dayjs(newEndDate).toString()
  }
})

watch(page, (newPage) => {
  if (newPage) {
    query['page'] = newPage
    refresh()
  }
})

// user info
const listUserRoles = user?.value.roles
const isCanProcessOrder = computed(() => {
  return listUserRoles.some(item => item === ERole.Sale || item === ERole.Accountant || item === ERole.Admin)
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="orders.meta.itemCount"
        title="Đơn hàng cộng đồng"
      />

      <UDashboardToolbar>
        <template #left>
          <div class="flex gap-2">
            <USelectMenu
              v-model="selectedContent"
              :options="contentOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[100px]"
              option-attribute="label"
              value-attribute="value"
            />
            <UInput
              v-model="textSearch"
              :ui="{
                base: 'h-full'
              }"
              class="w-[220px]"
              placeholder="Tìm kiếm..."
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
                  {{ format(selectedDate.start, 'd MMM, yyy') }} - {{ format(selectedDate.end, 'd MMM, yyy') }}
                </UButton>

                <template #panel="{ close }">
                  <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                    <DatePicker
                      v-model="selectedDate"
                      @close="close"
                    />
                  </div>
                </template>
              </UPopover>
            </div>
            <USelectMenu
              v-model="selectedStatus"
              :options="statusOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[200px]"
              option-attribute="label"
              placeholder="Trạng thái"
              value-attribute="value"
            />
            <USelectMenu
              v-model="selectedPaymentStatus"
              :options="paymentStatusOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[150px]"
              option-attribute="label"
              placeholder="Thanh toán"
              value-attribute="value"
            />
            <div>
              <UButton
                :trailing="false"
                :ui="{
                  base: 'h-full'
                }"
                color="primary"
                icon="i-heroicons-magnifying-glass-solid"
                label="Button"
                size="sm"
                variant="solid"
                @click="onSearch"
              >
                Tìm
              </UButton>
            </div>
            <UButton
              :trailing="false"
              :ui="{
                variant: {
                  solid: 'bg-[#94A3B8] hover:bg-gray-400'
                }
              }"
              icon="i-heroicons-x-mark-20-solid"
              label="Button"
              size="sm"
              @click="onResetFilter"
            >
              Bỏ lọc
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
        <template #order_code-data="{ row }">
          <div class="text-center font-bold">
            <UTooltip
              :popper="{ placement: 'right' }"
              text="Chi tiết đơn"
            >
              <ULink
                :to="'/order/community-order/' + row.order_code"
              >
                <span class="hover:text-[#ccc]">{{ row.order_code }}</span>
              </ULink>
            </UTooltip>
          </div>
        </template>
        <template #period-data="{ row }">
          {{ row.type === ECommunityOrderType.JOIN_COMMUNITY_FEE ? row.period + ' tháng' : '-' }}
        </template>
        <template #total_amount-data="{ row }">
          <div class="text-right">
            {{ numeral(row.total_amount).format() }}
          </div>
        </template>
        <template #created_at-data="{ row }">
          {{ dayjs(row.created_at).format('DD/MM/YYYY HH:mm:ss') }}
        </template>
        <template #type-data="{ row }">
          {{ row.type === 1 ? 'Membership' : (row.type === 2 ? 'Mua khóa học' : '') }}
        </template>
        <template #status-data="{ row }">
          <span
            v-if="row.status === ECommunityOrderStatus.Processing"
            class="text-orange-500"
          >Chờ xử lý</span>
          <span
            v-if="row.status === ECommunityOrderStatus.Paid"
            class="text-green-500"
          >Thành công</span>
          <span
            v-if="row.status === ECommunityOrderStatus.Cancel"
            class="text-slate-400"
          >Đã hủy</span>
          <span
            v-if="row.status === ECommunityOrderStatus.Refund"
            class="text-teal-500"
          >Hoàn tiền</span>
          <span
            v-if="row.status === ECommunityOrderStatus.Removed"
            class="text-red-500"
          >Đã xóa</span>
        </template>
        <template #ref-data="{ row }">
          {{
            row.ref !== ''
              ? row.ref
              : '-'
          }}
        </template>
        <template #payment-data="{ row }">
          <span
            v-if="row.payment_status === ECommunityOrderPaymentStatus.NotPay"
            class="text-orange-500"
          >Chưa TT</span>
          <span
            v-if="row.payment_status === ECommunityOrderPaymentStatus.Paid"
            class="text-green-500"
          >Đã TT</span>
          <span
            v-if="row.payment_status === ECommunityOrderPaymentStatus.Cancel"
            class="text-slate-400"
          >Đã hủy</span>
        </template>
        <template #note-data="{ row }">
          <span class="whitespace-nowrap overflow-hidden text-ellipsis block w-[200px]">{{ row.note }}</span>
        </template>
        <!--        <template #sale-data="{ row }"> -->
        <!--          <div v-if="row.sale_name !== ''"> -->
        <!--            <div v-if="row.sale_avatar !== ''"> -->
        <!--              <UTooltip -->
        <!--                :text="row.sale_name" -->
        <!--                :popper="{ placement: 'right' }" -->
        <!--              > -->
        <!--                <UAvatar -->
        <!--                  :src="row.sale_avatar" -->
        <!--                  alt="Avatar" -->
        <!--                /> -->
        <!--              </UTooltip> -->
        <!--            </div> -->
        <!--            <div v-else> -->
        <!--              {{ row.sale_name }} -->
        <!--            </div> -->
        <!--          </div> -->
        <!--          <div v-else> -->
        <!--            <UTooltip -->
        <!--              text="Gán sale" -->
        <!--              :popper="{ placement: 'right' }" -->
        <!--            > -->
        <!--              <UButton -->
        <!--                icon="i-heroicons-user-plus" -->
        <!--                size="sm" -->
        <!--                :ui="{ -->
        <!--                  rounded: 'rounded-full', -->
        <!--                  variant: { -->
        <!--                    solid: 'bg-white-500 text-black hover:bg-white-500 ' -->
        <!--                  } -->
        <!--                }" -->
        <!--                class="text-gray-500" -->
        <!--                @click="onChooseSale(row._id)" -->
        <!--              /> -->
        <!--            </UTooltip> -->
        <!--          </div> -->
        <!--        </template> -->
        <template #action-data="{ row }">
          <div class="flex gap-1 justify-center">
            <UPopover mode="hover">
              <UButton
                color="white"
                trailing-icon="i-heroicons-ellipsis-vertical-16-solid"
              />

              <template #panel>
                <div class="flex flex-col gap-2 p-4">
                  <UTooltip text="Chi tiết đơn">
                    <UButton
                      :ui="{ rounded: 'rounded-full' }"
                      icon="i-heroicons-eye-20-solid"
                      @click="redirectToOrderDetail(row)"
                    />
                  </UTooltip>
                  <UTooltip
                    v-if="isCanProcessOrder"
                    text="Phiếu thu"
                  >
                    <UButton
                      :ui="{ rounded: 'rounded-full' }"
                      color="orange"
                      icon="i-heroicons-clipboard-document-check-solid"
                      @click="redirectToReceipt(row)"
                    />
                  </UTooltip>
                  <UTooltip
                    v-if="isCanProcessOrder"
                    text="Xóa đơn"
                  >
                    <UButton
                      :ui="{ rounded: 'rounded-full' }"
                      color="red"
                      icon="i-heroicons-trash"
                      @click="openDeleteOrderModal(row)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UPopover>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? 'Không có dữ liệu' }}</span>
          </div>
        </template>
      </UTable>
      <!-- modal xóa đơn hàng -->
      <UModal
        v-model="isOpenDeleteOrderModal"
        :ui="{ container: 'items-start sm:items-start' }"
        prevent-close
      >
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex justify-between">
              <h3 class="font-bold text-2xl">
                Xóa đơn hàng
              </h3>
              <UButton
                class="-my-1"
                color="gray"
                icon="i-heroicons-x-mark-20-solid"
                variant="ghost"
                @click="isOpenDeleteOrderModal = false"
              />
            </div>
          </template>
          <p>Bạn có chắc chắn muốn xóa đơn hàng này không ?</p>
          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                color="red"
                label="Thoát"
                @click="closeDeleteOrderModal"
              />
              <UButton
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                color="primary"
                label="Đồng ý"
                @click="onDeleteOrder"
              />
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
                Gán sale xử lý đơn hàng
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
    </UDashboardPanel>
  </UDashboardPage>
</template>
