<script lang="ts" setup>
import { type InferType, object, string } from 'yup'
import dayjs from 'dayjs'
import numeral from 'numeral'
import { format, sub } from 'date-fns'
import type { FormSubmitEvent } from '#ui/types'
import {OrderPaymentStatus, OrderStatus} from '~/enums/order-status.enum'
import type { Order } from '~/types'

const defaultColumns = [
  {
    key: 'order_code',
    label: 'Mã đơn'
  },
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'buyer_name',
    label: 'Người mua'
  },
  {
    key: 'community_name',
    label: 'Tên cộng đồng'
  },
  // {
  //   key: 'package_code',
  //   label: 'Gói phần mềm'
  // },
  {
    key: 'period',
    label: 'Thời hạn'
  },
  {
    key: 'total_amount',
    label: 'Tổng tiền'
  },
  {
    key: 'payment',
    label: 'Thanh toán'
  },
  {
    key: 'sale',
    label: 'Sale'
  },
  {
    key: 'status',
    label: 'Trạng thái'
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
    key: 'created_at',
    label: 'Ngày tạo'
  },
  {
    key: 'action',
    label: 'Hành động',
    class: 'text-right'
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

const columns = computed(() =>
  defaultColumns.filter(column => selectedColumns.value.includes(column))
)

const {
  data: orders,
  status,
  refresh
} = await useFetch('/api/v1/order', {
  query,
  watch: false,
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

const onDeleteOrder = async () => {
  await useFetch(`/api/v1/order/${selectedOrderId.value}`, {
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

// change status modal
const isOpenChangeStatusModal = ref(false)
const statusType = ref('')
const openChangeStatusOrderModal = (row: Order, orderStatus: string) => {
  selectedOrderId.value = row._id
  if (orderStatus === 'cancel') {
    statusType.value = 'cancel'
  } else if (orderStatus === 'paid') {
    statusType.value = 'paid'
  }
  isOpenChangeStatusModal.value = true
}

const closeChangeStatusOrderModal = () => {
  isOpenChangeStatusModal.value = false
  state.cancel_reason = ''
}

const schema = object({
  cancel_reason: string().required('Cần ghi rõ lý do hủy đơn')
})

type Schema = InferType<typeof schema>

const state = reactive({
  cancel_reason: ''
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  await useFetch(`/api/v1/order/${selectedOrderId.value}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    body: {
      destination_status: OrderStatus.Cancel,
      cancel_reason: event.data.cancel_reason || ''
    },
    onResponse({ response }) {
      if (response.ok) {
        isOpenChangeStatusModal.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenChangeStatusModal.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
  state.cancel_reason = ''
}

const onChangeStatusOrderToPaid = async () => {
  await useFetch(`/api/v1/order/${selectedOrderId.value}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    body: {
      destination_status: OrderStatus.Paid
    },
    onResponse({ response }) {
      if (response.ok) {
        isOpenChangeStatusModal.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenChangeStatusModal.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}
//

// redirect detail
const redirectToOrderDetail = async (row: Order) => {
  await navigateTo({ path: '/order/software-order/' + row._id })
}

// filter by date range picker
const selectedDate = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })

// filter by status
const selectedStatus = ref('')
const statusOptions = [{
  value: OrderStatus.Processing,
  label: 'Chờ xử lý'
}, {
  value: OrderStatus.Paid,
  label: 'Đã thanh toán'
}, {
  value: OrderStatus.Cancel,
  label: 'Đã hủy'
}, {
  value: OrderStatus.PayError,
  label: 'Thanh toán lỗi'
}, {
  value: OrderStatus.Refund,
  label: 'Hoàn tiền'
}
]

// filter by payment status
const selectedPaymentStatus = ref('')
const paymentStatusOptions = [{
  value: OrderPaymentStatus.Paid,
  label: 'Đã thanh toán'
}, {
  value: OrderPaymentStatus.NotPay,
  label: 'Chưa thanh toán'
}, {
  value: OrderPaymentStatus.Cancel,
  label: 'Đã hủy'
}]

watch([selectedDate, selectedStatus, selectedPaymentStatus], ([newSelectedDate, newSelectedStatus, newSelectedPaymentStatus]) => {
  if (newSelectedDate) {
    query['filter[fromDate]'] = dayjs(newSelectedDate.start).toString()
    query['filter[toDate]'] = dayjs(newSelectedDate.end).toString()
  }

  if (newSelectedStatus !== '' && newSelectedStatus !== null) {
    query['filter[status]'] = newSelectedStatus
  }

  if (newSelectedPaymentStatus !== '' && newSelectedPaymentStatus !== null) {
    query['filter[payment_status]'] = newSelectedPaymentStatus
  }
})

watch(page, (newPage) => {
  if (newPage) {
    query['page'] = newPage
    refresh()
  }
})
// text search theo nội dung
const selectedContent = ref('')
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
    ? userSales.value.map((user) => {
      return {
        label: user.full_name,
        value: user._id
      }
    })
    : []
})

const isOpenChooseSaleModal = ref(false)
const onChooseSale = async (orderId: string) => {
  isOpenChooseSaleModal.value = true
  selectedOrderId.value = orderId
}

const onAgreeChooseSale = async () => {
  await useFetch(`/api/v1/order/assign-sale`, {
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

// click button tìm kiếm
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

const onResetFilter = async () => {
  delete query['filter[content_type]']
  delete query['filter[keyword]']
  delete query['filter[fromDate]']
  delete query['filter[toDate]']
  delete query['filter[status]']
  delete query['filter[payment_status]']
  selectedContent.value = ''
  textSearch.value = ''
  selectedStatus.value = ''
  selectedPaymentStatus.value = ''
  selectedDate.value.start = sub(new Date(), { days: 14 })
  selectedDate.value.end = new Date()
  query['page'] = 1
  await refresh()
}

const title = 'Đơn hàng phần mềm'

useSeoMeta({
  title
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="orders.meta.itemCount"
        title="Đơn hàng phần mềm"
      />

      <UDashboardToolbar>
        <template #left>
          <div class="flex gap-2">
            <USelectMenu
              v-model="selectedContent"
              :options="contentOptions"
              placeholder="Chọn nội dung"
              value-attribute="value"
              option-attribute="label"
              class="w-[200px]"
            />
            <UInput
              v-model="textSearch"
              placeholder="Tìm kiếm..."
            />
            <div class="flex justify-center items-center gap-2">
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
            <USelectMenu
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Chọn trạng thái đơn"
              value-attribute="value"
              option-attribute="label"
              class="w-[200px]"
            />
            <USelectMenu
              v-model="selectedPaymentStatus"
              :options="paymentStatusOptions"
              placeholder="Chọn trạng thái thanh toán"
              value-attribute="value"
              option-attribute="label"
              class="w-[220px]"
            />
            <div>
              <UButton
                icon="i-heroicons-magnifying-glass-solid"
                size="sm"
                color="primary"
                variant="solid"
                label="Button"
                :trailing="false"
                @click="onSearch"
              >
                Tìm kiếm
              </UButton>
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
            <template #label> Hiển thị </template>
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
        <template #period-data="{ row }"> {{ row.period }} tháng </template>
        <template #total_amount-data="{ row }">
          {{ numeral(row.total_amount).format() }} đ
        </template>
        <template #created_at-data="{ row }">
          {{ dayjs(row.created_at).format("DD/MM/YYYY HH:mm:ss ") }}
        </template>
        <template #status-data="{ row }">
          <span v-if="row.status === OrderStatus.Processing">Chờ xử lý</span>
          <span v-if="row.status === OrderStatus.Paid">Kích hoạt</span>
          <span v-if="row.status === OrderStatus.Cancel">Đã hủy</span>
          <span v-if="row.status === OrderStatus.PayError">Thanh toán lỗi</span>
          <span v-if="row.status === OrderStatus.Refund">Hoàn tiền</span>
        </template>
        <template #ref-data="{ row }">
          {{
            row.ref !== ''
              ? row.ref
              : '-'
          }}
        </template>
        <template #payment-data="{ row }">
          <span v-if="row.payment_status === OrderPaymentStatus.NotPay">Chưa thanh toán</span>
          <span v-if="row.payment_status === OrderPaymentStatus.Paid">Đã thanh toán</span>
          <span v-if="row.payment_status === OrderPaymentStatus.Cancel">Đã hủy</span>
        </template>
        <template #sale-data="{ row }">
          <div v-if="row.sale_name !== ''">{{ row.sale_name }}</div>
          <div v-else>
            <UTooltip
              text="Gán sale"
              :popper="{ placement: 'right' }"
            >
              <UButton
                icon="i-heroicons-user-plus"
                size="sm"
                :ui="{
                  rounded: 'rounded-full',
                  variant: {
                    solid: 'bg-white-500 text-black hover:bg-white-500 '
                  }
                }"
                class="text-gray-500"
                @click="onChooseSale(row._id)"
              />
            </UTooltip>
          </div>
        </template>
        <template #action-data="{ row }">
          <div class="flex gap-1 justify-end">
            <UTooltip text="Chi tiết đơn">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-eye-20-solid"
                @click="redirectToOrderDetail(row)"
              />
            </UTooltip>
            <UTooltip
              v-if="row.status === OrderStatus.Processing"
              text="Thanh toán thành công"
            >
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="green"
                icon="i-heroicons-check-20-solid"
                @click="openChangeStatusOrderModal(row, 'paid')"
              />
            </UTooltip>

            <UTooltip v-if="row.status !== OrderStatus.Cancel" text="Hủy đơn">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="orange"
                icon="i-heroicons-x-mark-16-solid"
                @click="openChangeStatusOrderModal(row, 'cancel')"
              />
            </UTooltip>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{
              errorMsg ?? "Không có dữ liệu"
            }}</span>
          </div>
        </template>
      </UTable>
      <!-- modal xóa đơn hàng -->
      <UModal
        v-model="isOpenDeleteOrderModal"
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
              <h3 class="font-bold text-2xl">Xóa đơn hàng</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isOpenDeleteOrderModal = false"
              />
            </div>
          </template>
          <p>Bạn có chắc chắn muốn xóa đơn hàng này không ?</p>
          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                label="Thoát"
                color="red"
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                @click="closeDeleteOrderModal"
              />
              <UButton
                label="Đồng ý"
                color="primary"
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                @click="onDeleteOrder"
              />
            </div>
          </template>
        </UCard>
      </UModal>
      <!---->
      <!-- modal cập nhật trạng thái đơn hàng -->
      <UModal
        v-model="isOpenChangeStatusModal"
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
                {{
                  statusType === "cancel"
                    ? "Hủy đơn hàng"
                    : statusType === "paid"
                      ? "Cập nhật trạng thái đơn hàng"
                      : "Thông báo"
                }}
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="closeChangeStatusOrderModal"
              />
            </div>
          </template>
          <p v-if="statusType === 'paid'">
            Bạn có chắc chắn muốn chuyển trạng thái của đơn hàng này thành
            <strong>đã thanh toán</strong> không ?
          </p>
          <UForm
            v-if="statusType === 'cancel'"
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormGroup
              label="Lý do hủy đơn hàng"
              name="cancel_reason"
              required
            >
              <UTextarea
                v-model="state.cancel_reason"
                placeholder="Nhập lý do hủy đơn..."
                :rows="4"
              />
            </UFormGroup>

            <div class="flex justify-end">
              <UButton type="submit" :ui="{ padding: { sm: 'px-5 py-2' } }">
                Đồng ý
              </UButton>
            </div>
          </UForm>
          <template v-if="statusType === 'paid'" #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                label="Thoát"
                color="red"
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                @click="closeChangeStatusOrderModal"
              />
              <UButton
                label="Đồng ý"
                color="primary"
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                @click="onChangeStatusOrderToPaid"
              />
            </div>
          </template>
        </UCard>
      </UModal>
      <!---->
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
              <h3 class="font-bold text-2xl">Gán sale xử lý đơn hàng</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isOpenChooseSaleModal = false"
              />
            </div>
          </template>
          <div class="flex flex-col w-full gap-2">
            <p>Danh sách sales</p>
            <USelectMenu
              clear-search-on-close
              class="w-full"
              placeholder="--- Chọn sale ---"
              :options="userData"
              searchable
              searchable-placeholder="Tìm kiếm sale..."
              v-model="selectedSale"
              value-attribute="value"
              option-attribute="label"
            >
              <template #option-empty="{ query }">
                Không tìm thấy sale <q>{{ query }}</q>
              </template>
            </USelectMenu>
          </div>
          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                label="Đồng ý"
                color="primary"
                :ui="{ padding: { sm: 'px-5 py-2' } }"
                @click="onAgreeChooseSale"
              />
            </div>
          </template>
        </UCard>
      </UModal>
      <!---->
      <UDivider />
      <div v-if="orders.meta.itemCount > 0" class="my-2 flex justify-end mr-6 items-center gap-2">
        <p class="text-sm">Số đơn hàng: {{ orders.meta.itemCount }}</p>
        <UPagination
          v-model="page"
          :page-count="orders.meta.take"
          :total="orders.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
