<script lang="ts" setup>
import dayjs from 'dayjs'
import numeral from 'numeral'
import { type InferType, number, object, ref as YupRef, string } from 'yup'
import {
  CommunityOrderTypeText,
  ECommunityOrderPaymentStatus,
  ECommunityOrderStatus,
  ECommunityOrderType, ProductTypeText
} from '~/enums/community-order.enum'
import type { FormSubmitEvent } from '#ui/types'
import { ERole } from '~/enums/role.enum'

const route = useRoute()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const orderCode = route?.params?.id
const orderType = route?.params?.type
if (![ERole.Admin, ERole.Support, ERole.Accountant].some(role => user.value?.roles.includes(role))) {
  showError({
    statusCode: 403,
    statusMessage: 'Không có quyền truy cập đơn hàng cộng đồng'
  })
}

const { data: orderDetail, refresh } = await useFetch(`/api/v1/community-order/${orderCode}`, {
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

if (orderType !== CommunityOrderTypeText.get(orderDetail.value.type)) {
  showError({
    statusCode: 404,
    statusMessage: 'Đơn hàng không tồn tại.'
  })
}

const page = ref(1)
const orderDetailData = computed(() => {
  return orderDetail.value
})

const state = reactive({
  buyer_name: orderDetailData.value.buyer !== null
    ? orderDetailData.value.buyer.full_name
    : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.full_name : '-'),
  buyer_email: orderDetailData.value.buyer !== null
    ? orderDetailData.value.buyer.email
    : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.email : '-'),
  buyer_phone: orderDetailData.value.buyer !== null
    ? orderDetailData.value.buyer.phone
    : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.phone : '-'),
  community_name: orderDetailData.value.community !== null ? orderDetailData.value.community.name : undefined,
  course_name: orderDetailData.value.course !== null ? orderDetailData.value.course.title : undefined,
  event_name: orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.event
    ? orderDetailData.value.event_subscribe.event.name
    : undefined,
  period: orderDetailData.value.period !== null
    ? orderDetailData.value.period
    : undefined,
  total_amount: orderDetailData.value.total_amount,
  created_at: orderDetailData.value.created_at !== null ? orderDetailData.value.created_at : undefined,
  status: orderDetailData.value.status,
  payment_status: orderDetailData.value.payment_status,
  cancel_reason: orderDetailData.value.cancel_reason !== null ? orderDetailData.value.cancel_reason : undefined,
  type: orderDetailData.value.type,
  revenue: orderDetailData.value.revenue,
  payment_date: orderDetailData.value.payment_date ? orderDetailData.value.payment_date : '',
  short_payment_link: orderDetailData.value.short_payment_link,
  note: orderDetailData.value.note ? orderDetailData.value.note : '',
  ref: orderDetailData.value.ref,
  sale: orderDetailData.value.sale,
  products: orderDetailData.value.products,
  product_detail: orderDetailData.value.productDetail
})

watchEffect(() => {
  if (orderDetail.value) {
    state.buyer_name = orderDetailData.value.buyer !== null
      ? orderDetailData.value.buyer.full_name
      : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.full_name : '-')
    state.buyer_email = orderDetailData.value.buyer !== null
      ? orderDetailData.value.buyer.email
      : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.email : '-')
    state.buyer_phone = orderDetailData.value.buyer !== null
      ? orderDetailData.value.buyer.phone
      : (orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.guest ? orderDetailData.value.event_subscribe.guest.phone : '-')
    state.community_name = orderDetailData.value.community !== null ? orderDetailData.value.community.name : undefined
    state.course_name = orderDetailData.value.course !== null ? orderDetailData.value.course.title : undefined
    state.event_name = orderDetailData.value.event_subscribe && orderDetailData.value.event_subscribe.event
      ? orderDetailData.value.event_subscribe.event.name
      : undefined
    state.period = orderDetailData.value.period !== null
      ? orderDetailData.value.period
      : undefined
    state.total_amount = orderDetailData.value.total_amount
    state.created_at = orderDetailData.value.created_at !== null ? orderDetailData.value.created_at : undefined
    state.status = orderDetailData.value.status
    state.payment_status = orderDetailData.value.payment_status
    state.cancel_reason = orderDetailData.value.cancel_reason !== null ? orderDetailData.value.cancel_reason : undefined
    state.type = orderDetailData.value.type
    state.revenue = orderDetailData.value.revenue
    state.payment_date = orderDetailData.value.payment_date ? orderDetailData.value.payment_date : ''
    state.short_payment_link = orderDetailData.value.short_payment_link
    state.note = orderDetailData.value.note ? orderDetailData.value.note : ''
    state.ref = orderDetailData.value.ref
    state.sale = orderDetailData.value.sale
  }
})

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
  value: ECommunityOrderStatus.Removed,
  label: 'Đã xóa'
}, {
  value: ECommunityOrderStatus.Refund,
  label: 'Hoàn tiền'
}
]

const paymentStatusOptions = [{
  value: ECommunityOrderPaymentStatus.Paid,
  label: 'Đã TT'
}, {
  value: ECommunityOrderPaymentStatus.NotPay,
  label: 'Chưa TT'
}, {
  value: ECommunityOrderPaymentStatus.Cancel,
  label: 'Đã hủy'
}]

const { copy, copied, isSupported } = useClipboard({ legacy: true })
const toast = useToast()
// Danh sách chia hoa hồng
const listCommissionLink = ref(`/order/${orderDetail.value.type}/${orderCode}/list-user-commission`)

// chi tiết phiếu chi
const receiptLink = ref(`/order/${orderDetail.value.type}/${orderCode}/receipt`)

// lịch sử xử lý đơn hàng
const queryHistory = reactive({
  page,
  'sort[_id]': -1
})
const {
  data: listProcessHistory,
  refresh: refreshHistory
} = await useFetch(`/api/v1/community-order/process-history/${orderDetailData.value._id}`, {
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
  await useFetch(`/api/v1/community-order/${orderDetailData.value.order_code}`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    body: {
      content_note: [{
        message: 'Thực hiện hành động duyệt đơn'
      }],
      status: ECommunityOrderStatus.Paid,
      action_type: 'approve'
    },
    onResponse({ response }) {
      if (response.ok) {
        toast.add({ title: 'Duyệt đơn thành công', color: 'green' })
        refresh()
        refreshHistory()
      } else {
        toast.add({ title: 'Có lỗi xảy ra', color: 'red' })
      }
    }
  })
}

// submit form
const schema = object({
  status: number(),
  payment_status: number(),
  total_amount: number(),
  revenue: number().max(YupRef('total_amount'), 'Thực thu không thể lớn hơn giá trị đơn hàng'),
  note: string()
})

type Schema = InferType<typeof schema>
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const payload = event.data
  payload['content_note'] = []
  for (const key in payload) {
    orderDetailData.value[key] = orderDetailData.value[key] !== undefined ? orderDetailData.value[key] : ''
    if (payload[key] !== orderDetailData.value[key]) {
      switch (key) {
        case 'status': {
          const fromStatus = orderDetailData.value[key] === ECommunityOrderStatus.Processing
            ? 'Chờ xử lý'
            : (orderDetailData.value[key] === ECommunityOrderStatus.Paid
                ? 'Thành công'
                : (orderDetailData.value[key] === ECommunityOrderStatus.Refund
                    ? 'Hoàn tiền'
                    : (orderDetailData.value[key] === ECommunityOrderStatus.Cancel
                        ? 'Đã hủy'
                        : (orderDetailData.value[key] === ECommunityOrderStatus.Removed ? 'Đã xóa' : ''))))
          const toStatus = payload[key] === ECommunityOrderStatus.Processing
            ? 'Chờ xử lý'
            : (payload[key] === ECommunityOrderStatus.Paid
                ? 'Thành công'
                : (payload[key] === ECommunityOrderStatus.Refund
                    ? 'Hoàn tiền'
                    : (payload[key] === ECommunityOrderStatus.Cancel
                        ? 'Đã hủy'
                        : (payload[key] === ECommunityOrderStatus.Removed ? 'Đã xóa' : ''))))
          payload['content_note'].push({
            message: `Thay đổi trạng thái từ ${fromStatus} thành ${toStatus}`
          })
          break
        }
        case 'payment_status': {
          const fromStatus = orderDetailData.value[key] === ECommunityOrderPaymentStatus.NotPay
            ? 'Chưa thanh toán'
            : (orderDetailData.value[key] === ECommunityOrderPaymentStatus.Paid
                ? 'Đã thanh toán'
                : (orderDetailData.value[key] === ECommunityOrderPaymentStatus.Cancel
                    ? 'Đã hủy'
                    : ''))
          const toStatus = payload[key] === ECommunityOrderPaymentStatus.NotPay
            ? 'Chưa thanh toán'
            : (payload[key] === ECommunityOrderPaymentStatus.Paid
                ? 'Đã thanh toán'
                : (payload[key] === ECommunityOrderPaymentStatus.Cancel
                    ? 'Đã hủy'
                    : ''))
          payload['content_note'].push({
            message: `Thay đổi thanh toán từ ${fromStatus} thành ${toStatus}`
          })
          break
        }
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

  for (const key in payload) {
    if (!['status', 'payment_status', 'revenue', 'note', 'content_note'].includes(key)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete payload[key]
    }
  }

  await useFetch(`/api/v1/community-order/${orderCode}`, {
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

// chỉnh sửa doanh thu
const isEditRevenue = ref(false)
const onEditRevenue = () => {
  isEditRevenue.value = !isEditRevenue.value
}

const productColumns = [
  { key: 'stt', label: 'STT' },
  {
    key: 'type',
    label: 'Loại sản phẩm'
  }, {
    key: 'name',
    label: 'Tên sản phẩm'
  },
  { key: 'price', label: 'Giá sản phẩm' }
]
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel
      :ui="{
        wrapper: 'overflow-y-auto'
      }"
      grow
    >
      <UDashboardNavbar
        :badge="orderCode"
        :ui="{
          right: 'w-1/4'
        }"
        title="Đơn hàng"
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
              class="min-h-14"
              label="Họ tên"
              name="buyer_name"
            >
              <label for="">{{ state.buyer_name }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Email"
              name="buyer_email"
            >
              <label for="">{{ state.buyer_email }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Phone"
              name="buyer_phone"
            >
              <label for="">{{ state.buyer_phone }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Ref"
              name="ref"
            >
              <label for="">{{ state.ref ? state.ref : '-' }}</label>
            </UFormGroup>
          </div>
          <!---->

          <!---->
          <div class="flex flex-col gap-6">
            <UFormGroup
              class="min-h-14"
              name="total_amount"
            >
              <template #label>
                <div class="flex gap-2">
                  <span>Thực thu</span>
                  <div>
                    <UTooltip text="Số tiền thực tế khách thanh toán">
                      <UIcon
                        :popper="{ placement: 'right' }"
                        class="w-5 h-5"
                        name="i-heroicons-information-circle"
                      />
                    </UTooltip>
                  </div>
                </div>
              </template>
              <label for="">{{ state.total_amount ? numeral(orderDetailData.total_amount).format() : 0 }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Phí thanh toán"
              name="fee_pay"
            >
              <label for="">0</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              name="revenue"
            >
              <template #label>
                <div class="flex gap-2">
                  <span>Doanh thu</span>
                  <div>
                    <UTooltip text="Số tiền thực tế UNICA nhận được">
                      <UIcon
                        :popper="{ placement: 'right' }"
                        class="w-5 h-5"
                        name="i-heroicons-information-circle"
                      />
                    </UTooltip>
                  </div>
                </div>
              </template>
              <div class="flex gap-2 items-center">
                <UInput
                  v-if="orderDetailData.status !== ECommunityOrderStatus.Cancel && orderDetailData.status !== ECommunityOrderStatus.Refund
                    && orderDetailData.status !== ECommunityOrderStatus.Removed && isEditRevenue"
                  v-model="state.revenue"
                  :ui="{
                    wrapper: 'h-full',
                    base: 'h-full'
                  }"
                />
                <label
                  v-if="!isEditRevenue"
                  for=""
                >{{ state.revenue ? numeral(orderDetailData.revenue).format() : 0 }}</label>
                <UTooltip v-if="orderDetailData.receipt && Object.keys(orderDetailData.receipt).length === 0" text="Chỉnh sửa">
                  <UButton
                    :ui="{
                      variant: {
                        solid: 'bg-white text-black hover:bg-[#ccc]'
                      }
                    }"
                    color="primary"
                    icon="i-heroicons-pencil-square"
                    size="sm"
                    square
                    variant="solid"
                    @click="onEditRevenue"
                  />
                </UTooltip>
              </div>
            </UFormGroup>
            <UFormGroup
              :ui="{
                container: 'flex gap-2'
              }"
              class="min-h-14"
              label="Link thanh toán"
              name="short_payment_link"
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
                  :ui="{
                    variant: {
                      solid: 'bg-white text-black border border-solid border-[#ccc] hover:bg-[#ccc] hover:text-white'
                    }
                  }"
                  class="min-h-8 h-8 px-3 py-2 flex justify-center items-center w-full"
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
              class="min-h-14"
              label="Sale"
              name="sale"
            >
              <label for="">{{ state.sale ? state.sale.full_name : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Trạng thái"
              name="status"
            >
              <USelectMenu
                v-if="orderDetailData.status !== ECommunityOrderStatus.Paid && orderDetailData.status !== ECommunityOrderStatus.Cancel"
                v-model="state.status"
                :options="statusOptions"
                :ui="{
                  base: 'w-1/2'
                }"
                :ui-menu="{
                  container: '!w-1/2 !left-0'
                }"
                option-attribute="label"
                value-attribute="value"
                :disabled="orderDetailData.receipt && Object.keys(orderDetailData.receipt).length > 0"
              />
              <span v-if="orderDetailData.status === ECommunityOrderStatus.Paid">Thành công</span>
              <span v-if="orderDetailData.status === ECommunityOrderStatus.Cancel">Đã hủy</span>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Thanh toán"
              name="payment_status"
            >
              <USelectMenu
                v-if="orderDetailData.payment_status !== ECommunityOrderPaymentStatus.Paid && orderDetailData.status !== ECommunityOrderStatus.Cancel"
                v-model="state.payment_status"
                :options="paymentStatusOptions"
                :ui="{
                  base: 'w-1/2'
                }"
                :ui-menu="{
                  container: '!w-1/2 !left-0'
                }"
                option-attribute="label"
                value-attribute="value"
                :disabled="orderDetailData.receipt && Object.keys(orderDetailData.receipt).length > 0"
              />
              <span
                v-if="(orderDetailData.status === ECommunityOrderStatus.Paid && orderDetailData.payment_status === ECommunityOrderPaymentStatus.Paid) || orderDetailData.status === ECommunityOrderStatus.Cancel"
              >
                {{
                  paymentStatusOptions.filter(item => item.value === state.payment_status) ? paymentStatusOptions.filter(item => item.value === state.payment_status)[0]['label'] : ''
                }}
              </span>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Ngày thanh toán"
              name="payment_date"
            >
              <label for="">
                {{
                  state.payment_date ? dayjs(state.payment_date).format('DD/MM/YYYY HH:mm:ss') : '-'
                }}
              </label>
            </UFormGroup>
          </div>
          <!---->

          <div class="flex flex-col gap-6">
            <UFormGroup
              class="min-h-14"
              label="Tên cộng đồng"
              name="community_name"
            >
              <label for="">{{ state.community_name }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Ngày tạo"
              name="created_at"
            >
              <label for="">
                {{
                  state.created_at ? dayjs(orderDetailData.created_at).format('DD/MM/YYYY HH:mm:ss') : '-'
                }}
              </label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Tên khóa học"
              name="course_name"
            >
              <label for="">{{ state.course_name ? state.course_name : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Tên sự kiện"
              name="event_name"
            >
              <label for="">{{ state.event_name ? state.event_name : '-' }}</label>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Thời hạn"
              name="period"
            >
              <p v-if="state.type === ECommunityOrderType.MEMBERSHIP || state.type === ECommunityOrderType.COURSE">
                {{ state.period + ' tháng' }}
              </p>
              <p v-else-if="state.type === ECommunityOrderType.EVENT && orderDetailData.event_subscribe && orderDetailData.event_subscribe.event">
                {{ dayjs(orderDetailData.event_subscribe.event.start_date).format('DD/MM/YYYY') + ' - ' + dayjs(orderDetailData.event_subscribe.event.end_date).format('DD/MM/YYYY') }}
              </p>
            </UFormGroup>
            <UFormGroup
              class="min-h-14"
              label="Kiểu đơn"
              name="type"
            >
              <label for="">
                {{
                  state.type ? CommunityOrderTypeText.get(state.type) : ''
                }}
              </label>
            </UFormGroup>
          </div>
          <!--        <UFormGroup v-if="orderDetailData.status === ECommunityOrderStatus.Cancel" label="Lý do hủy đơn" name="cancel_reason"> -->
          <!--          <UTextarea v-model="state.cancel_reason" disabled  :rows="4" /> -->
          <!--        </UFormGroup> -->
        </div>
        <div class="w-[50%]">
          <UTable
            :columns="productColumns"
            :rows="state.product_detail || []"
            :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
            class="w-full"
            sort-mode="manual"
          >
            <template #stt-data="{ index }">
              {{ index + 1 }}
            </template>
            <template #type-data="{ row }">
              {{ ProductTypeText.get(row.type) }}
            </template>
            <template #name-data="{ row, index }">
              {{ state.products[index].quantity }} x
              {{ row.name }}
            </template>
            <template #price-data="{ index }">
              {{ numeral(state.products[index].price).format() + ' VND' }}
            </template>
          </UTable>
        </div>
        <UFormGroup
          class="px-4 py-4"
          label="Ghi chú"
          name="note"
        >
          <UTextarea
            v-model="state.note"
            placeholder="Ghi chú"
            :disabled="orderDetailData.receipt && Object.keys(orderDetailData.receipt).length > 0"
          />
        </UFormGroup>
        <div class="px-4 py-4 flex gap-2">
          <UButton
            v-if="orderDetailData.status !== ECommunityOrderStatus.Cancel && (!orderDetailData.receipt || (orderDetailData.receipt && Object.keys(orderDetailData.receipt).length === 0))"
            :ui="{
              padding: {
                sm: 'px-9'
              }
            }"
            type="submit"
          >
            Lưu
          </UButton>
          <UButton
            v-if="orderDetailData.status !== ECommunityOrderStatus.Cancel && orderDetailData.payment_status !== ECommunityOrderPaymentStatus.Paid"
            :ui="{
              padding: {
                sm: 'px-9'
              },
              variant: {
                solid: 'text-black bg-white hover:bg-primary-500 hover:text-white border border-solid border-[#ccc]'
              }
            }"
            type="button"
            @click="onApproveOrder"
          >
            Duyệt đơn
          </UButton>
          <span
            v-if="orderDetailData.status === ECommunityOrderStatus.Paid && orderDetailData.payment_status === ECommunityOrderPaymentStatus.Paid"
            class="text-green-500 flex justify-center items-center"
          >Đã duyệt</span>
          <span
            v-if="orderDetailData.status === ECommunityOrderStatus.Cancel"
            class="text-orange-500 flex justify-center items-center"
          >Đã hủy</span>
        </div>
      </UForm>
      <div class="pl-8 mb-4 flex gap-4">
        <ULink
          :to="listCommissionLink"
          class="text-green-500"
        >
          <span class="flex items-center gap-2 border border-solid border-slate-500 px-3 py-2 rounded-lg">
            Danh sách chia hoa hồng
            <UIcon
              class="w-5 h-5"
              name="i-heroicons-arrow-right"
            />
          </span>
        </ULink>
        <ULink
          :to="receiptLink"
          class="text-orange-500"
        >
          <span class="flex items-center gap-2 border border-solid border-slate-500 px-3 py-2 rounded-lg">
            Phiếu chi
            <UIcon
              class="w-5 h-5"
              name="i-heroicons-arrow-right"
            />
          </span>
        </ULink>
      </div>
      <div class="px-8">
        <p>Lịch sử xử lý đơn hàng</p>
        <UTable
          :columns="historyColumns"
          :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Không có dữ liệu.' }"
          :rows="processHistoryData"
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
        <div
          v-if="processHistoryMeta.itemCount > 0"
          class="my-2 flex justify-end mr-6 items-center gap-2"
        >
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
