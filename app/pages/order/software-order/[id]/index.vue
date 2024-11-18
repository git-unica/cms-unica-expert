<script lang="ts" setup>
import dayjs from 'dayjs'
import numeral from 'numeral'
import { useClipboard } from '@vueuse/core'
import { type InferType, number, object, string, ref as YupRef } from 'yup'
import { OrderPaymentStatus, OrderStatus } from '~/enums/order-status.enum'
import type { FormSubmitEvent } from '#ui/types'

const { copy, copied, isSupported } = useClipboard({ legacy: true })
const route = useRoute()
const orderCode = route?.params?.id
const { data: orderDetail, refresh } = await useFetch(`/api/v1/order/${orderCode}`, {
  headers: useRequestHeaders(['cookie']),
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

const page = ref(1)
const orderDetailData = computed(() => {
  return orderDetail.value
})

const statusOptions = [{
  value: OrderStatus.Processing,
  label: 'Chờ xử lý'
}, {
  value: OrderStatus.Paid,
  label: 'Thành công'
}, {
  value: OrderStatus.Cancel,
  label: 'Đã hủy'
}, {
  value: OrderStatus.Removed,
  label: 'Đã xóa'
}, {
  value: OrderStatus.Refund,
  label: 'Hoàn tiền'
}
]

const paymentStatusOptions = [{
  value: OrderPaymentStatus.Paid,
  label: 'Đã TT'
}, {
  value: OrderPaymentStatus.NotPay,
  label: 'Chưa TT'
}, {
  value: OrderPaymentStatus.Cancel,
  label: 'Đã hủy'
}]

const state = reactive({
  buyer_name: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.full_name : undefined,
  buyer_email: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.email : undefined,
  buyer_phone: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.phone : undefined,
  community_name: orderDetailData.value.community !== null ? orderDetailData.value.community.name : undefined,
  package_code: orderDetailData.value.package_code !== null ? orderDetailData.value.package_code : undefined,
  period: orderDetailData.value.period,
  origin_total_amount: orderDetailData.value.origin_total_amount,
  money_discount_from_old_package: orderDetailData.value.money_discount_from_old_package,
  total_amount: orderDetailData.value.total_amount,
  created_at: orderDetailData.value.created_at !== null ? orderDetailData.value.created_at : undefined,
  status: orderDetailData.value.status,
  payment_status: orderDetailData.value.payment_status,
  cancel_reason: orderDetailData.value.cancel_reason !== null ? orderDetailData.value.cancel_reason : '',
  note: orderDetailData.value.note ? orderDetailData.value.note : '',
  payment_date: orderDetailData.value.payment_date ? orderDetailData.value.payment_date : '',
  revenue: orderDetailData.value.revenue,
  discount_value: orderDetailData.value.discount_value,
  short_payment_link: orderDetailData.value.short_payment_link,
  ref: orderDetailData.value.ref,
  sale: orderDetailData.value.sale,
  pay_gate: orderDetailData.value.pay_gate,
  pay_gate_fee: orderDetailData.value.pay_gate_fee,
  actual_amount: orderDetailData.value.pay_gate_fee > 0 ? orderDetailData.value.total_amount - orderDetailData.value.pay_gate_fee : orderDetailData.value.total_amount
})
console.log('state', state)
watchEffect(() => {
  if (orderDetail.value) {
    Object.assign(state, orderDetail.value)
  }
})
// title chi tiết đơn hàng
const title = 'Đơn hàng ' + orderCode

useSeoMeta({
  title
})

// submit form
const schema = object({
  status: number(),
  payment_status: number(),
  total_amount: number(),
  revenue: number().max(YupRef('total_amount'), 'Thực thu không thể lớn hơn giá trị đơn hàng'),
  note: string()
})

type Schema = InferType<typeof schema>
const toast = useToast()
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const payload = event.data
  payload['content_note'] = []
  for (const key in payload) {
    orderDetailData.value[key] = orderDetailData.value[key] !== undefined ? orderDetailData.value[key] : ''
    if (payload[key] !== orderDetailData.value[key]) {
      switch (key) {
        case 'status': {
          const fromStatus = orderDetailData.value[key] === OrderStatus.Processing
            ? 'Chờ xử lý'
            : (orderDetailData.value[key] === OrderStatus.Paid
                ? 'Thành công'
                : (orderDetailData.value[key] === OrderStatus.Refund
                    ? 'Hoàn tiền'
                    : (orderDetailData.value[key] === OrderStatus.Cancel
                        ? 'Đã hủy'
                        : (orderDetailData.value[key] === OrderStatus.Removed ? 'Đã xóa' : ''))))
          const toStatus = payload[key] === OrderStatus.Processing
            ? 'Chờ xử lý'
            : (payload[key] === OrderStatus.Paid
                ? 'Thành công'
                : (payload[key] === OrderStatus.Refund
                    ? 'Hoàn tiền'
                    : (payload[key] === OrderStatus.Cancel
                        ? 'Đã hủy'
                        : (payload[key] === OrderStatus.Removed ? 'Đã xóa' : ''))))
          payload['content_note'].push({
            message: `Thay đổi trạng thái từ ${fromStatus} thành ${toStatus}`
          })
          break }
        case 'payment_status': {
          const fromStatus = orderDetailData.value[key] === OrderPaymentStatus.NotPay
            ? 'Chưa thanh toán'
            : (orderDetailData.value[key] === OrderPaymentStatus.Paid
                ? 'Đã thanh toán'
                : (orderDetailData.value[key] === OrderPaymentStatus.Cancel
                    ? 'Đã hủy'
                    : ''))
          const toStatus = payload[key] === OrderPaymentStatus.NotPay
            ? 'Chưa thanh toán'
            : (payload[key] === OrderPaymentStatus.Paid
                ? 'Đã thanh toán'
                : (payload[key] === OrderPaymentStatus.Cancel
                    ? 'Đã hủy'
                    : ''))
          payload['content_note'].push({
            message: `Thay đổi thanh toán từ ${fromStatus} thành ${toStatus}`
          })
          break }
        case 'revenue':
          payload['content_note'].push({
            message: `Thay đổi thực thu từ ${numeral(orderDetailData.value[key]).format() + ' VND'} thành ${numeral(payload[key]).format() + ' VND'}`
          })
          break
        case 'note':
          payload['content_note'].push({
            message: `Thay đổi ghi chú từ "${orderDetailData.value[key]}" thành "${payload[key]}"`
          })
          break
      }
    }
  }

  await useFetch(`/api/v1/order/${orderCode}`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    watch: false,
    body: payload,
    onResponse({ response }) {
      if (response.ok) {
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
        refreshHistory()
      } else {
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}

// lịch sử xử lý đơn hàng
const queryHistory = reactive({
  page,
  'sort[_id]': -1
})
const { data: listProcessHistory, refresh: refreshHistory } = await useFetch(`/api/v1/order/process-history/${orderDetailData.value._id}`, {
  headers: useRequestHeaders(['cookie']),
  query: queryHistory,
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

const historyColumns = [{
  key: '_id',
  label: '#'
}, {
  key: 'user_name',
  label: 'Người xử lý'
}, {
  key: 'content',
  label: 'Nội dung'
}, {
  key: 'created_at',
  label: 'Thời gian'
}]

const processHistoryData = computed(() => {
  return listProcessHistory?.value?.data
})

const processHistoryMeta = computed(() => {
  return listProcessHistory?.value?.meta
})

// duyệt đơn
const onApproveOrder = async () => {
  await useFetch(`/api/v1/order/${orderDetailData.value._id}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    body: {
      destination_status: OrderStatus.Paid
    },
    onResponse({ response }) {
      if (response.ok) {
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
        refreshHistory()
      } else {
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}

// Danh sách chia hoa hồng
const listCommissionLink = ref('/order/software-order/' + orderCode + '/list-user-commission')

// chỉnh sửa doanh thu
const isEditRevenue = ref(false)
const onEditRevenue = () => {
  isEditRevenue.value = !isEditRevenue.value
}

// xử lý format tiền
numeral.locale('vn')
if (!numeral.locales.hasOwnProperty('vn')) {
  numeral.register('locale', 'vn', {
    delimiters: {
      thousands: '.',
      decimal: ','
    },
    abbreviations: {
      thousand: 'k',
      million: 'm',
      billion: 'b',
      trillion: 't'
    },
    ordinal: function (number) {
      return number.toString()
    },
    currency: {
      symbol: ' VND'
    }
  })
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel
      grow
      :ui="{
        wrapper: 'overflow-y-auto'
      }"
    >
      <UDashboardNavbar
        title="Đơn hàng"
        :badge="orderCode"
        :ui="{
          right: 'w-1/4'
        }"
      />
      <UForm
        :schema="schema"
        :state="state"
        class="gap-4 px-4 py-4"
        @submit="onSubmit"
      >
        <div class="w-full grid grid-cols-4 gap-4 px-4 py-4">
          <!---->
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Họ tên"
              name="buyer_name"
              class="min-h-14"
            >
              <label for="">{{ state.buyer_name }}</label>
            </UFormGroup>
            <UFormGroup
              label="Email"
              name="buyer_email"
              class="min-h-14"
            >
              <label for="">{{ state.buyer_email }}</label>
            </UFormGroup>
            <UFormGroup
              label="Phone"
              name="buyer_phone"
              class="min-h-14"
            >
              <label for="">{{ state.buyer_phone }}</label>
            </UFormGroup>
            <UFormGroup
              label="Ref"
              name="ref"
              class="min-h-14"
            >
              <label for="">{{ state.ref ? state.ref : '-' }}</label>
            </UFormGroup>
          </div>
          <!---->
          <!---->
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Tổng tiền"
              name="origin_total_amount"
              class="min-h-14"
            >
              <label for="">{{ state.origin_total_amount ? numeral(state.origin_total_amount).format() : 0 }}</label>
            </UFormGroup>
            <UFormGroup
              label="Thực thu"
              name="actual_amount"
              class="min-h-14"
            >
              <label for="">{{ state.actual_amount ? numeral(state.actual_amount).format() : 0 }}</label>
            </UFormGroup>
            <UFormGroup
              label="Giảm trừ gói cũ"
              name="money_discount_from_old_package"
              class="min-h-14"
            >
              <label for="">{{ state.money_discount_from_old_package ? numeral(state.money_discount_from_old_package).format() : 0 }}</label>
            </UFormGroup>
            <UFormGroup
              label="Cổng thanh toán"
              name="pay_gate"
              class="min-h-14"
            >
              <label for="">{{ state.pay_gate ? (state.pay_gate === 'Bank_Tranfer' ? 'Chuyển khoản ngân hàng' : state.pay_gate) : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Phí cổng thanh toán"
              name="pay_gate_fee"
              class="min-h-14"
            >
              <label for="">{{ state.pay_gate_fee ? state.pay_gate_fee : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Giảm giá"
              name="discount_value"
              class="min-h-14"
            >
              <label for="">{{ state.discount_value + ' %' }} ({{ state.origin_total_amount * state.discount_value/100 }})</label>
            </UFormGroup>
            <UFormGroup
              label="Doanh thu"
              name="revenue"
              class="min-h-14"
            >
              <div class="flex gap-2 items-end">
                <UInput
                  v-if="orderDetailData.status !== OrderStatus.Cancel && isEditRevenue"
                  v-model="state.revenue"
                  :ui="{
                    wrapper: 'h-full',
                    base: 'h-full'
                  }"
                >
                </UInput>
                <label
                  v-if="!isEditRevenue"
                  for=""
                >
                  {{ state.revenue ? numeral(orderDetailData.revenue).format() : 0 }}
                </label>
                <UTooltip text="Chỉnh sửa">
                  <UButton
                    icon="i-heroicons-pencil-square"
                    size="sm"
                    color="primary"
                    square
                    variant="solid"
                    :ui="{
                      variant: {
                        solid: 'bg-white text-black  hover:bg-[#ccc]'
                      }
                    }"
                    @click="onEditRevenue"
                  />
                </UTooltip>
              </div>
            </UFormGroup>
            <UFormGroup
              label="Link thanh toán"
              name="short_payment_link"
              :ui="{
                container: 'flex gap-2'
              }"
              class="min-h-14"
            >
              <UInput
                v-model="state.short_payment_link"
                class="w-3/4"
                disabled
              />
              <div
                v-if="isSupported"
                class="w-1/4"
              >
                <UButton
                  class="min-h-8 h-8 px-3 py-2 flex justify-center items-center w-full"
                  :ui="{
                    variant: {
                      solid: 'bg-white text-black border border-solid border-[#ccc] hover:bg-[#ccc] hover:text-white'
                    }
                  }"
                  @click="copy(state.short_payment_link)"
                >
                  <span v-if="!copied">Copy</span>
                  <span v-else>Copied!</span>
                </UButton>
              </div>
            </UFormGroup>
          </div>
          <!---->
          <!---->
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Sale"
              name="sale"
              class="min-h-14"
            >
              <label for="">{{ state.sale ? state.sale.full_name : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Trạng thái"
              name="status"
              class="min-h-14"
            >
              <USelectMenu
                v-if="orderDetailData.status !== OrderStatus.Paid && orderDetailData.status !== OrderStatus.Cancel"
                v-model="state.status"
                :options="statusOptions"
                value-attribute="value"
                option-attribute="label"
                :ui="{
                  base: 'w-1/2'
                }"
                :ui-menu="{
                  container: '!w-1/2 !left-0'
                }"
              />
              <span v-if="orderDetailData.status === OrderStatus.Paid">Thành công</span>
              <span v-if="orderDetailData.status === OrderStatus.Cancel">Đã hủy</span>
            </UFormGroup>
            <UFormGroup
              label="Thanh toán"
              name="payment_status"
              class="min-h-14"
            >
              <USelectMenu
                v-if="orderDetailData.status !== OrderStatus.Paid && orderDetailData.status !== OrderStatus.Cancel"
                v-model="state.payment_status"
                :options="paymentStatusOptions"
                value-attribute="value"
                option-attribute="label"
                :ui="{
                  base: 'w-1/2'
                }"
                :ui-menu="{
                  container: '!w-1/2 !left-0'
                }"
              />
              <span v-if="orderDetailData.status === OrderStatus.Paid || orderDetailData.status === OrderStatus.Cancel">
                {{ paymentStatusOptions.filter(item => item.value === state.payment_status) ? paymentStatusOptions.filter(item => item.value === state.payment_status)[0]['label'] : '' }}
              </span>
            </UFormGroup>
            <UFormGroup
              label="Ngày thanh toán"
              name="payment_date"
              class="min-h-14"
            >
              <label for="">{{ state.payment_date ? dayjs(state.payment_date).format('DD/MM/YYYY HH:mm:ss') : '-' }}</label>
            </UFormGroup>
          </div>
          <!---->
          <!---->
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Cộng đồng"
              name="community_name"
              class="min-h-14"
            >
              <label for="">{{ state.community_name }}</label>
            </UFormGroup>
            <UFormGroup
              label="Sản phẩm"
              name="package_code"
              class="min-h-14"
            >
              <label for="">{{ state.package_code }}</label>
            </UFormGroup>
            <UFormGroup
              label="Số tháng"
              name="period"
              class="min-h-14"
            >
              <label for="">{{ state.period + ' tháng' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Ngày tạo"
              name="created_at"
              class="min-h-14"
            >
              <label for="">{{ state.created_at ? dayjs(orderDetailData.created_at).format('DD/MM/YYYY HH:mm:ss') : '-' }}</label>
            </UFormGroup>
          </div>
          <!--          <UFormGroup v-if="orderDetailData.status === OrderStatus.Cancel" label="Lý do hủy đơn" name="cancel_reason"> -->
          <!--            <UTextarea -->
          <!--              v-model="state.cancel_reason" -->
          <!--              disabled -->
          <!--              :rows="4" -->
          <!--            /> -->
          <!--          </UFormGroup> -->
        </div>
        <UFormGroup
          label="Ghi chú"
          name="note"
          class="px-4 py-4"
        >
          <UTextarea
            v-model="state.note"
            placeholder="Ghi chú"
          />
        </UFormGroup>
        <div class="px-4 py-4 flex gap-2">
          <UButton
            type="submit"
            :ui="{
              padding: {
                sm: 'px-9'
              }
            }"
            v-if="orderDetailData.status !== OrderStatus.Cancel"
          >
            Lưu
          </UButton>
          <UButton
            v-if="orderDetailData.status !== OrderStatus.Paid && orderDetailData.status !== OrderStatus.Cancel"
            type="button"
            :ui="{
              padding: {
                sm: 'px-9'
              },
              variant: {
                solid: 'text-black bg-white hover:bg-primary-500 hover:text-white border border-solid border-[#ccc]'
              }
            }"
            @click="onApproveOrder"
          >
            Duyệt đơn
          </UButton>
          <span
            v-if="orderDetailData.status === OrderStatus.Paid"
            class="text-green-500 flex justify-center items-center"
          >Đã duyệt</span>
          <span
            v-if="orderDetailData.status === OrderStatus.Cancel"
            class="text-orange-500 flex justify-center items-center"
          >Đã hủy</span>
        </div>
      </UForm>
      <ULink
        :to="listCommissionLink"
        class="ml-8 mb-8 text-green-500 max-w-[235px]"
      >
        <span class="flex items-center gap-2 border border-solid border-slate-500 px-3 py-2 rounded-lg">
          Danh sách chia hoa hồng <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
        </span>
      </ULink>
      <div class="px-8">
        <p>Lịch sử xử lý đơn hàng</p>
        <UTable
          :columns="historyColumns"
          :rows="processHistoryData"
          :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Không có dữ liệu.' }"
          class="w-full overflow-y-auto"
        >
          <template #created_at-data="{ row }">
            {{ row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY HH:mm:ss') : '' }}
          </template>
          <template #content-data="{ row }">
            <ul class=" whitespace-nowrap overflow-hidden">
              <li
                v-for="item in row.content"
                :key="item"
              >
                - {{ item.message }}
              </li>
            </ul>
          </template>
        </UTable>
        <UDivider />
        <div v-if="processHistoryMeta.itemCount > 0" class="my-2 flex justify-end mr-6 items-center gap-2">
          <UPagination
            v-model="page"
            :page-count="processHistoryMeta.take"
            :total="processHistoryMeta.itemCount"
          />
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
