<script setup lang="ts">
import { type InferType, number, object, string, ref as yupRef } from 'yup'
import numeral from 'numeral'
import { format } from 'date-fns'
import type { FormSubmitEvent } from '#ui/types'
import { EReceiptOrderType, EReceiptPay } from '~/enums/receipt-pay-list.enum'

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

const orderDetailData = computed(() => {
  return orderDetail.value
})

const receiptDetail = computed(() => {
  return orderDetail.value.receipt
})

watch(() => orderDetail.value.receipt, (newReceipt) => {
  if (newReceipt) {
    state.order_code = newReceipt.order_code
    state.money_order = newReceipt.money_order
    state.revenue = newReceipt.revenue
    state.status = newReceipt.status !== '' ? (newReceipt.status === EReceiptPay.Processing ? 'Chờ duyệt' : 'Đã duyệt') : 'Chờ duyệt'
  }
})

const schema = object({
  order_code: string(),
  money_order: number(),
  revenue: number().transform((value, originalValue) =>
    String(originalValue).trim() === '' ? null : value
  )
    .nullable().required('Giá trị không được để trống').min(0, 'Giá trị tối thiều bằng 0').max(yupRef('money_order'), 'Giá trị tối đa bằng tổng tiền của đơn hàng'),
  status: string(),
  note: string(),
  pay_gate: string(),
  received_money_date: string().required('Chưa chọn ngày nhận tiền')
})

type Schema = InferType<typeof schema>
const state = reactive({
  order_code: receiptDetail.value ? receiptDetail.value.order_code : orderDetailData.value.order_code,
  money_order: receiptDetail.value ? receiptDetail.value.money_order : orderDetailData.value.total_amount,
  revenue: receiptDetail.value ? receiptDetail.value.revenue : orderDetailData.value.revenue,
  money_discount_from_old_package: receiptDetail.value ? receiptDetail.value.money_discount_from_old_package : orderDetailData.value.money_discount_from_old_package,
  pay_gate: receiptDetail.value ? receiptDetail.value.pay_gate : orderDetailData.value.pay_gate,
  pay_gate_fee: receiptDetail.value ? receiptDetail.value.pay_gate_fee : orderDetailData.value.pay_gate_fee,
  discount_value: receiptDetail.value ? receiptDetail.value.discount_value : orderDetailData.value.discount_value,
  status: receiptDetail.value ? receiptDetail.value.status : undefined,
  note: receiptDetail.value ? receiptDetail.value.note : undefined,
  received_money_date: receiptDetail.value ? receiptDetail.value.received_money_date : undefined
})

const toast = useToast()
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const dataPayload = {
    order_id: orderDetailData.value._id,
    order_code: event.data.order_code,
    revenue: event.data.revenue,
    note: event.data.note,
    order_type: EReceiptOrderType.SOFTWARE,
    action_type: receiptDetail.value ? 'update' : 'create',
    received_money_date: event.data.received_money_date
  }
  if (event.data.pay_gate === undefined) {
    Object.assign(dataPayload, {
      pay_gate: 'Bank_Tranfer'
    })
  }

  try {
    await useFetch(`/api/v1/receipt-pay-list`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: dataPayload,
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

// chỉnh sửa doanh thu
const isEditRevenue = ref(false)
const onEditRevenue = () => {
  isEditRevenue.value = !isEditRevenue.value
}

// xử lý format tiền
numeral.locale('vn')
if (!Object.keys(numeral.locales).includes('vn')) {
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

watch(state, (newState) => {
  if (newState) {
    state.received_money_date = newState.received_money_date
  }
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar>
        <template #title>
          {{ receiptDetail === null ? 'Tạo phiếu thu' : (receiptDetail.status === EReceiptPay.Processing ? 'Chỉnh sửa phiếu thu' : 'Chi tiết phiếu thu') }}
        </template>
      </UDashboardNavbar>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 px-4 py-4 gap-4"
        @submit="onSubmit"
      >
        <div class="w-full grid grid-cols-4 gap-4 px-4 py-4">
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Mã đơn"
              name="order_code"
            >
              <span>{{ state.order_code }}</span>
            </UFormGroup>
            <UFormGroup
              label="Trạng thái"
              name="status"
            >
              <span>{{ receiptDetail ? (receiptDetail.status === EReceiptPay.Processing ? 'Chờ duyệt' : 'Đã duyệt') : 'Chờ duyệt' }}</span>
            </UFormGroup>
            <UFormGroup
              label="Ngày nhận tiền"
              name="received_money_date"
            >
              <UPopover
                :popper="{ placement: 'bottom-start' }"
                :disabled="receiptDetail && receiptDetail.status === EReceiptPay.Approved"
                :ui="{
                  trigger: 'w-auto'
                }"
              >
                <UButton
                  icon="i-heroicons-calendar-days-20-solid"
                  :label="state.received_money_date ? format(state.received_money_date, 'dd/MM/yyyy') : ''"
                  :disabled="receiptDetail && receiptDetail.status === EReceiptPay.Approved"
                />

                <template #panel="{ close }">
                  <DatePicker
                    v-model="state.received_money_date"
                    is-required
                    @close="close"
                  />
                </template>
              </UPopover>
            </UFormGroup>
          </div>
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Giảm trừ gói cũ"
              name="money_discount_from_old_package"
            >
              <span>{{ numeral(state.money_discount_from_old_package).format() }}</span>
            </UFormGroup>
            <UFormGroup
              label="Giảm giá"
              name="discount_value"
            >
              <span>{{ state.discount_value + ' %' }} (Giảm: {{ state.money_order * state.discount_value/100 }})</span>
            </UFormGroup>
          </div>
          <div class="flex flex-col gap-6">
            <UFormGroup
              label="Cổng thanh toán"
              name="pay_gate"
            >
              <span>{{ state.pay_gate ? (state.pay_gate === 'Bank_Tranfer' ? 'Chuyển khoản' : state.pay_gate) : 'Chuyển khoản' }}</span>
            </UFormGroup>
            <UFormGroup
              label="Phí cổng thanh toán"
              name="pay_gate_fee"
            >
              <span>{{ numeral(state.pay_gate_fee).format() }}</span>
            </UFormGroup>
          </div>
          <div class="flex flex-col gap-6">
            <UFormGroup
              name="money_order"
            >
              <template #label>
                <div class="flex gap-2">
                  <span>Tổng tiền</span>
                  <div>
                    <UTooltip text="Số tiền thực tế khách thanh toán">
                      <UIcon
                        name="i-heroicons-information-circle"
                        class="w-5 h-5"
                        :popper="{ placement: 'right' }"
                      />
                    </UTooltip>
                  </div>
                </div>
              </template>
              <span>{{ numeral(state.money_order).format() }}</span>
            </UFormGroup>
            <UFormGroup
              name="revenue"
              :ui="{ container: 'flex items-center gap-2' }"
            >
              <template #label>
                <div class="flex gap-2">
                  <span>Thực thu</span>
                  <div>
                    <UTooltip text="Số tiền thực tế UNICA nhận được">
                      <UIcon
                        name="i-heroicons-information-circle"
                        class="w-5 h-5"
                        :popper="{ placement: 'right' }"
                      />
                    </UTooltip>
                  </div>
                </div>
              </template>
              <div class="flex items-center gap-2">
                <UInput
                  v-if="isEditRevenue"
                  v-model="state.revenue"
                  type="number"
                  :disabled="receiptDetail && receiptDetail.status === EReceiptPay.Approved"
                  class="w-1/2"
                />
                <span v-if="!isEditRevenue">{{ numeral(state.revenue).format() }}</span>
                <UTooltip text="Chỉnh sửa">
                  <UButton
                    icon="i-heroicons-pencil-square"
                    size="sm"
                    color="primary"
                    square
                    variant="solid"
                    :ui="{
                      variant: {
                        solid: 'bg-white text-black  hover:bg-[#ccc] disabled:bg-white'
                      }
                    }"
                    :disabled="receiptDetail && receiptDetail.status === EReceiptPay.Approved"
                    @click="onEditRevenue"
                  />
                </UTooltip>
              </div>
            </UFormGroup>
          </div>
        </div>
        <UFormGroup
          label="Ghi chú"
          name="note"
          class="px-4 py-4"
        >
          <UTextarea
            v-model="state.note"
            placeholder="Ghi chú ..."
            :disabled="receiptDetail && receiptDetail.status === EReceiptPay.Approved"
          />
        </UFormGroup>
        <div class="flex gap-2 px-4 py-4">
          <UButton
            v-if="receiptDetail === null || (receiptDetail.status === EReceiptPay.Processing)"
            type="submit"
          >
            Lưu thay đổi
          </UButton>
          <UButton
            v-if="receiptDetail !== null && receiptDetail.status === EReceiptPay.Processing"
            type="button"
            color="green"
            @click="onApproveReceipt"
          >
            Duyệt phiếu thu
          </UButton>
        </div>
      </UForm>
      <UDivider />
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style scoped>

</style>
