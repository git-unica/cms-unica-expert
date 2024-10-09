<script lang="ts" setup>
import dayjs from 'dayjs'
import numeral from 'numeral'
import { OrderStatus } from '~/enums/order-status.enum'
import { ECommunityOrderStatus, ECommunityOrderType } from '~/enums/community-order.enum'

const defaultColumns = [
  {
    key: 'user_name',
    label: 'Tên người dùng'
  }, {
    key: 'rate',
    label: 'Hoa hồng (%)'
  },
  {
    key: 'actually_money',
    label: 'Tiền được nhận'
  }
]

const route = useRoute()
const orderID = route?.params?.id
const { data: orderDetail } = await useFetch(`/api/v1/community-order/${orderID}`, {
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
const { data: listUserCommission } = await useFetch(`/api/v1/community-order/list-user-commission-order`, {
  headers: useRequestHeaders(['cookie']),
  query: {
    id: orderID
  },
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

const errorMsg = ref()
const orderDetailData = orderDetail.value
const listUserCommissionData = listUserCommission.value.data
const listUserCommissionMeta = listUserCommission.value.meta

const state = reactive({
  buyer_name: orderDetailData.buyer !== null ? orderDetailData.buyer.full_name : undefined,
  community_name: orderDetailData.community !== null ? orderDetailData.community.name : undefined,
  course_name: orderDetailData.course !== null ? orderDetailData.course.title : undefined,
  period: orderDetailData.period !== null ? orderDetailData.period + ' tháng' : undefined,
  total_amount: orderDetailData.total_amount !== null ? numeral(orderDetailData.total_amount).format() + ' đ' : undefined,
  created_at: orderDetailData.created_at !== null ? dayjs(orderDetailData.created_at).format('HH:mm DD/MM/YYYY') : undefined,
  status: orderDetailData.status === ECommunityOrderStatus.Processing ? 'Đang xử lý' : (orderDetailData.status === ECommunityOrderStatus.Paid ? 'Đã thanh toán' : 'Đã hủy'),
  cancel_reason: orderDetailData.cancel_reason !== null ? orderDetailData.cancel_reason : undefined,
  type: orderDetailData.type ? (orderDetailData.type === ECommunityOrderType.JOIN_COMMUNITY_FEE ? 'Tham gia cộng đồng trả phí' : 'Mua khóa học') : ''
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Chi tiết đơn hàng"></UDashboardNavbar>

      <UForm :state="state" class="grid grid-cols-4 gap-4 px-4 py-4">
        <UFormGroup label="Người mua" name="buyer_name">
          <UInput v-model="state.buyer_name" disabled  />
        </UFormGroup>
        <UFormGroup label="Tên cộng đồng" name="community_name">
          <UInput v-model="state.community_name" disabled  />
        </UFormGroup>
        <UFormGroup label="Tên khóa học" name="course_name">
          <UInput v-model="state.course_name" disabled  />
        </UFormGroup>
        <UFormGroup label="Thời hạn" name="period">
          <UInput v-model="state.period" disabled  />
        </UFormGroup>
        <UFormGroup label="Tổng tiền" name="total_amount">
          <UInput v-model="state.total_amount" disabled  />
        </UFormGroup>
        <UFormGroup label="Kiểu đơn" name="type">
          <UInput v-model="state.type" disabled  />
        </UFormGroup>
        <UFormGroup label="Ngày tạo" name="created_at">
          <UInput v-model="state.created_at" disabled  />
        </UFormGroup>
        <UFormGroup label="Trạng thái" name="status">
          <UInput v-model="state.status" disabled  />
        </UFormGroup>
        <UFormGroup v-if="orderDetailData.status === OrderStatus.Cancel" label="Lý do hủy đơn" name="cancel_reason">
          <UTextarea v-model="state.cancel_reason" disabled  :rows="4" />
        </UFormGroup>
      </UForm>

      <h3 class="px-4 font-semibold">Danh sách chia hoa hồng</h3>
      <UTable
        :columns="defaultColumns"
        :rows="listUserCommissionData || []"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #actually_money-data="{ row }">
          {{ numeral(row.actually_money).format() + ' đ' }}
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? 'Không có dữ liệu' }}</span>
          </div>
        </template>
      </UTable>
      <UDivider />
      <div
        v-if="listUserCommissionMeta.itemCount > 0"
        class="my-2 flex justify-end mr-6"
      >
        <UPagination
          v-model="page"
          :page-count="listUserCommissionMeta.take"
          :total="listUserCommissionMeta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
