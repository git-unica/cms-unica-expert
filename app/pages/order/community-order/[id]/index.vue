<script lang="ts" setup>
import dayjs from 'dayjs'
import numeral from 'numeral'
import { useClipboard } from '@vueuse/core'
import { number, object, string, ref as YupRef, type InferType } from 'yup'
import { ECommunityOrderPaymentStatus, ECommunityOrderStatus, ECommunityOrderType } from '~/enums/community-order.enum'
import type { FormSubmitEvent } from '#ui/types'

const route = useRoute()
const orderCode = route?.params?.id
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

const page = ref(1)
const orderDetailData = computed(() => {
  return orderDetail.value
})

const state = reactive({
  buyer_name: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.full_name : undefined,
  buyer_email: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.email : undefined,
  buyer_phone: orderDetailData.value.buyer !== null ? orderDetailData.value.buyer.phone : undefined,
  community_name: orderDetailData.value.community !== null ? orderDetailData.value.community.name : undefined,
  course_name: orderDetailData.value.course !== null ? orderDetailData.value.course.title : undefined,
  period: orderDetailData.value.period !== null ? orderDetailData.value.period : undefined,
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
  sale: orderDetailData.value.sale
})

watchEffect(() => {
  if (orderDetail.value) {
    Object.assign(state, orderDetail.value)
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
const listCommissionLink = ref('/order/community-order/' + orderCode + '/list-user-commission')

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
      status: ECommunityOrderStatus.Paid
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
      >
        <template #right>
          <span class="ml-4"><strong>Sale:</strong>
            {{
              orderDetailData.sale ? orderDetailData.sale.full_name : '-'
            }}
          </span>
        </template>
      </UDashboardNavbar>

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
              name="total_amount"
              class="min-h-14"
            >
              <label for="">{{ state.total_amount ? numeral(orderDetailData.total_amount).format() : 0 }}</label>
            </UFormGroup>
            <UFormGroup
              label="Phí thanh toán"
              name="fee_pay"
              class="min-h-14"
            >
              <label for="">0</label>
            </UFormGroup>
            <UFormGroup
              label="Doanh thu"
              name="revenue"
              class="min-h-14"
            >
              <div class="flex gap-2 items-end">
                <UInput
                  v-if="orderDetailData.status !== ECommunityOrderStatus.Cancel && isEditRevenue"
                  v-model="state.revenue"
                  :ui="{
                    wrapper: 'h-full',
                    base: 'h-full'
                  }"
                >
                </UInput>
                <label for="" v-if="!isEditRevenue">{{ state.revenue ? numeral(orderDetailData.revenue).format() : 0 }}</label>
                <UTooltip text="Chỉnh sửa">
                  <UButton
                    icon="i-heroicons-pencil-square"
                    size="sm"
                    color="primary"
                    square
                    variant="solid"
                    :ui="{
                      variant: {
                        solid: 'bg-white text-black hover:bg-[#ccc]'
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
                v-if="orderDetailData.status !== ECommunityOrderStatus.Paid && orderDetailData.status !== ECommunityOrderStatus.Cancel"
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
              <span v-if="orderDetailData.status === ECommunityOrderStatus.Paid">Thành công</span>
              <span v-if="orderDetailData.status === ECommunityOrderStatus.Cancel">Đã hủy</span>
            </UFormGroup>
            <UFormGroup
              label="Thanh toán"
              name="payment_status"
              class="min-h-14"
            >
              <USelectMenu
                v-if="orderDetailData.status !== ECommunityOrderStatus.Paid && orderDetailData.status !== ECommunityOrderStatus.Cancel"
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
              <span
                v-if="orderDetailData.status === ECommunityOrderStatus.Paid || orderDetailData.status === ECommunityOrderStatus.Cancel"
              >
                {{
                  paymentStatusOptions.filter(item => item.value === state.payment_status) ? paymentStatusOptions.filter(item => item.value === state.payment_status)[0]['label'] : ''
                }}
              </span>
            </UFormGroup>
            <UFormGroup
              label="Ngày thanh toán"
              name="payment_date"
              class="min-h-14"
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
              label="Tên cộng đồng"
              name="community_name"
              class="min-h-14"
            >
              <label for="">{{ state.community_name }}</label>
            </UFormGroup>
            <UFormGroup
              label="Ngày tạo"
              name="created_at"
              class="min-h-14"
            >
              <label for="">
                {{
                  state.created_at ? dayjs(orderDetailData.created_at).format('DD/MM/YYYY HH:mm:ss') : '-'
                }}
              </label>
            </UFormGroup>
            <UFormGroup
              label="Tên khóa học"
              name="course_name"
              class="min-h-14"
            >
              <label for="">{{ state.course_name ? state.course_name : 'Không có thông tin' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Thời hạn"
              name="period"
              class="min-h-14"
            >
              <label for="">{{ state.period + ' tháng' }}</label>
            </UFormGroup>
            <UFormGroup
              label="Kiểu đơn"
              name="type"
              class="min-h-14"
            >
              <label for="">
                {{
                  state.type ? (state.type === ECommunityOrderType.JOIN_COMMUNITY_FEE ? 'Membership' : 'Mua khóa học') : ''
                }}
              </label>
            </UFormGroup>
          </div>
          <!--        <UFormGroup v-if="orderDetailData.status === ECommunityOrderStatus.Cancel" label="Lý do hủy đơn" name="cancel_reason">-->
          <!--          <UTextarea v-model="state.cancel_reason" disabled  :rows="4" />-->
          <!--        </UFormGroup>-->
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
            v-if="orderDetailData.status !== ECommunityOrderStatus.Cancel"
            type="submit"
            :ui="{
              padding: {
                sm: 'px-9'
              }
            }"
          >
            Lưu
          </UButton>
          <UButton
            v-if="orderDetailData.status !== ECommunityOrderStatus.Paid && orderDetailData.status !== ECommunityOrderStatus.Cancel"
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
            v-if="orderDetailData.status === ECommunityOrderStatus.Paid"
            class="text-green-500 flex justify-center items-center"
          >Đã duyệt</span>
          <span
            v-if="orderDetailData.status === ECommunityOrderStatus.Cancel"
            class="text-orange-500 flex justify-center items-center"
          >Đã hủy</span>
        </div>
      </UForm>
      <ULink
        :to="listCommissionLink"
        class="ml-8 mb-8 text-green-500 max-w-[235px]"
      >
        <span class="flex items-center gap-2 border border-solid border-slate-500 px-3 py-2 rounded-lg">
          Danh sách chia hoa hồng <UIcon name="i-heroicons-arrow-right" class="w-5 h-5"/>
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
        <UDivider/>
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
