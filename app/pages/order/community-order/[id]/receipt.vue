<script setup lang="ts">
import { type InferType, number, object, string, ref as yupRef } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { EReceiptPay } from '~/enums/receipt-pay-list.enum'

const route = useRoute()
const orderID = route?.params?.id
const { data: orderDetail, refresh } = await useFetch(`/api/v1/community-order/${orderID}`, {
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

const orderDetailData = computed(() => {
  return orderDetail.value
})

const receiptDetail = computed(() => {
  return orderDetail.value.receipt
})

watch(() => orderDetail.value.receipt, (newReceipt) => {
  if (newReceipt) {
    state.order_id = newReceipt._id
    state.money_order = newReceipt.money_order
    state.revenue = newReceipt.revenue
    state.status = newReceipt.status !== '' ? (newReceipt.status === EReceiptPay.Processing ? 'Chờ duyệt' : 'Đã duyệt') : 'Chờ duyệt'
  }
})

const receiptStatusOptions = ['Chờ duyệt', 'Đã duyệt']

const schema = object({
  order_id: string(),
  money_order: number(),
  revenue: number().transform((value, originalValue) =>
    String(originalValue).trim() === '' ? null : value
  )
    .nullable().required('Giá trị không được để trống').min(1, 'Giá trị tối thiều bằng 1').max(yupRef('money_order'), 'Giá trị tối đa bằng tổng tiền của đơn hàng'),
  status: string()
})

type Schema = InferType<typeof schema>
const state = reactive({
  order_id: receiptDetail.value ? receiptDetail.value.community_order_id : orderDetailData.value._id,
  money_order: receiptDetail.value ? receiptDetail.value.money_order : orderDetailData.value.total_amount,
  revenue: receiptDetail.value ? receiptDetail.value.revenue : orderDetailData.value.total_amount,
  status: receiptDetail.value ? (receiptDetail.value.status === EReceiptPay.Processing ? 'Chờ duyệt' : 'Đã duyệt') : 'Chờ duyệt'
})

console.log('state', state)
const toast = useToast()
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    await useFetch(`/api/v1/receipt-pay-list`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: {
        order_id: event.data.order_id,
        revenue: event.data.revenue
      },
      onResponse({ response }) {
        if (response.ok) {
          toast.add({ title: response._data.message, color: 'green' })
          refresh()
        } else {
          toast.add({ title: 'Có lỗi khi lưu dữ liệu', color: 'red' })
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const onApproveReceipt = async () => {
  try {
    await useFetch(`/api/v1/receipt-pay-list/approve/${receiptDetail.value._id}`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      onResponse({ response }) {
        if (response.ok) {
          toast.add({ title: response._data.message, color: 'green' })
          refresh()
        } else {
          toast.add({ title: 'Có lỗi khi duyệt phiếu thu', color: 'red' })
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar>
        <template #title>
          {{ receiptDetail === null ? 'Tạo phiếu thu' : (receiptDetail.status === EReceiptPay.Processing ? 'Chỉnh sửa phiếu thu' : 'Chi tiết phiếu thu') }}
        </template>
      </UDashboardNavbar>

      <UForm :schema="schema" :state="state" class="space-y-4 px-4 py-4 w-1/3" @submit="onSubmit">
        <UFormGroup label="ID đơn hàng" name="order_id">
          <UInput v-model="state.order_id" disabled/>
        </UFormGroup>
        <UFormGroup label="Tổng tiền của đơn hàng" name="money_order">
          <UInput v-model="state.money_order" disabled>
            <template #trailing>
              <span class="text-gray-500 dark:text-gray-400 text-xs">VND</span>
            </template>
          </UInput>
        </UFormGroup>
        <UFormGroup label="Thực thu" name="revenue">
          <UInput v-model="state.revenue" type="number" :disabled="receiptDetail !== null && receiptDetail.status === EReceiptPay.Approved">
            <template #trailing>
              <span class="text-gray-500 dark:text-gray-400 text-xs">VND</span>
            </template>
          </UInput>
        </UFormGroup>
        <UFormGroup label="Trạng thái" name="status">
          <USelect disabled v-model="state.status" :options="receiptStatusOptions"/>
        </UFormGroup>

        <div class="flex gap-2">
          <UButton type="submit" v-if="receiptDetail === null || (receiptDetail !== null && receiptDetail.status !== EReceiptPay.Approved)">
            Lưu thay đổi
          </UButton>
          <UButton
            v-if="receiptDetail !== null && receiptDetail.status !== EReceiptPay.Approved"
            type="button"
            color="green"
            @click="onApproveReceipt">
            Duyệt phiếu thu
          </UButton>
        </div>
      </UForm>
      <UDivider/>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style scoped>

</style>
