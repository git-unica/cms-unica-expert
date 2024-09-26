<script lang="ts" setup>
import numeral from 'numeral'
import dayjs from 'dayjs'
import { type InferType, object, string } from 'yup'
import type { Order } from '~/types'
import { OrderStatus } from '~/enums/order-status.enum'
import { useAuthStore } from '~/stores/auth'
import type { FormSubmitEvent } from '#ui/types'

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
    key: 'package_code',
    label: 'Gói phần mềm'
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

const toast = useToast()
const q = ref()
const keyword = refDebounced(q, 500)
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const input = ref<{ input: HTMLInputElement }>()
const page = ref(1)
const query = reactive({
  keyword,
  page,
  'sort[_id]': -1
})
const errorMsg = ref()

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const { data: orders, status, refresh } = await useFetch('/api/v1/order', {
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
const { accessToken } = storeToRefs(authStore)
const onDeleteOrder = async () => {
  await useFetch(`/api/v1/order/${selectedOrderId.value}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json'
    },
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
  await navigateTo({ path: '/order/' + row._id })
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="orders.meta.itemCount"
        title="Đơn hàng"
      >
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

            <UTooltip
              v-if="row.status !== OrderStatus.Cancel"
              text="Hủy đơn"
            >
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="orange"
                icon="i-heroicons-x-mark-16-solid"
                @click="openChangeStatusOrderModal(row, 'cancel')"
              />
            </UTooltip>
            <UTooltip text="Xóa đơn">
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
      <!-- modal cập nhật trạng thái đơn hàng -->
      <UModal v-model="isOpenChangeStatusModal" :ui="{ container: 'items-start sm:items-start' }" prevent-close>
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex justify-between">
              <h3 class="font-bold text-2xl">{{ statusType === 'cancel' ? 'Hủy đơn hàng' : (statusType === 'paid' ? 'Cập nhật trạng thái đơn hàng' : 'Thông báo') }}</h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="closeChangeStatusOrderModal" />
            </div>
          </template>
          <p v-if="statusType === 'paid'">Bạn có chắc chắn muốn chuyển trạng thái của đơn hàng này thành <strong>đã thanh toán</strong> không ?</p>
          <UForm
            v-if="statusType === 'cancel'"
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormGroup label="Lý do hủy đơn hàng" name="cancel_reason" required>
              <UTextarea v-model="state.cancel_reason" placeholder="Nhập lý do hủy đơn..." rows="4" />
            </UFormGroup>

            <div class="flex justify-end">
              <UButton type="submit" :ui="{ padding: { sm: 'px-5 py-2' } }">
                Đồng ý
              </UButton>
            </div>
          </UForm>
          <template #footer v-if="statusType === 'paid'">
            <div class="flex gap-2 justify-end">
              <UButton label="Thoát" color="red" @click="closeChangeStatusOrderModal" :ui="{ padding: { sm: 'px-5 py-2' } }"/>
              <UButton label="Đồng ý" color="primary" @click="onChangeStatusOrderToPaid" :ui="{ padding: { sm: 'px-5 py-2' } }" />
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
