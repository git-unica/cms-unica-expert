<script lang="ts" setup>
import numeral from 'numeral'
import dayjs from 'dayjs'
import type { PaySlip } from '~/types'

const defaultColumns = [
  {
    key: 'pay_slip_code',
    label: 'Mã phiếu chi',
    class: 'text-center'
  },
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'time',
    label: 'Thời gian',
    class: 'text-center'
  },
  {
    key: 'total_money_need_paid',
    label: 'Số tiền cần chi',
    class: 'text-center'
  },
  {
    key: 'created_at',
    label: 'Ngày tạo',
    class: 'text-center'
  },
  {
    key: 'approved_time',
    label: 'Ngày duyệt',
    class: 'text-center'
  },
  {
    key: 'status',
    label: 'Trạng thái',
    class: 'text-center'
  },
  {
    key: 'action',
    label: 'Hành động',
    class: 'text-center'
  }
]

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

const dataReady = ref(false)
const checkIfHasPaySlipThisMonth = ref(false)
const {
  data: paySlips,
  status,
  refresh
} = await useFetch('/api/v1/pay-slip', {
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
  },
  onResponse({ response }) {
    dataReady.value = true
    const returnData = response._data.data
    if (returnData.length > 0) {
      if (returnData[0].month === (dayjs().month() + 1) && returnData[0].year === dayjs().year()) {
        checkIfHasPaySlipThisMonth.value = true
      }
    }
  }
})

watch(page, (newPage) => {
  if (newPage) {
    query['page'] = newPage
    refresh()
  }
})

const title = 'Phiếu chi'

useSeoMeta({
  title
})

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

const labelMail = ref('Gửi email thanh toán tháng ' + (dayjs().month() + 1) + '/' + dayjs().year())
const isOpenModalSendMail = ref(false)
const toast = useToast()
const openSendMailModal = () => {
  isOpenModalSendMail.value = true
}
const sendMailPayment = async () => {
  await useFetch(`/api/v1/pay-slip/send-mail-payment`, {
    method: 'GET',
    query: {
      month: (dayjs().month() + 1),
      year: dayjs().year()
    },
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        isOpenModalSendMail.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenModalSendMail.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}
const redirectToPaySlipDetail = async (row: PaySlip) => {
  await navigateTo({ path: '/pay-slip/' + row.pay_slip_code })
}

const isOpenApprovePaySlipModal = ref(false)
const selectedPaySlipId = ref()
const selectedPaySlipCode = ref()
const onOpenApprovePaySlipModal = (row: PaySlip) => {
  selectedPaySlipId.value = row._id
  selectedPaySlipCode.value = row.pay_slip_code
  isOpenApprovePaySlipModal.value = true
}

const onApprovePaySlip = async () => {
  await useFetch(`/api/v1/pay-slip/${selectedPaySlipId.value}/approve`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        isOpenApprovePaySlipModal.value = false
        toast.add({ title: response._data.message, color: 'green' })
        refresh()
      } else {
        isOpenApprovePaySlipModal.value = false
        toast.add({ title: response._data.message, color: 'red' })
      }
    }
  })
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="paySlips.meta.itemCount"
        title="Phiếu chi"
      />

      <UDashboardToolbar>
        <template #left>
          <UButton
            v-if="dataReady && checkIfHasPaySlipThisMonth"
            :label="labelMail"
            color="primary"
            @click="openSendMailModal"
          >
            <template #leading>
              <UIcon
                name="i-heroicons-envelope"
                class="w-5 h-5"
              />
            </template>
          </UButton>
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
        :rows="paySlips.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #[`pay_slip_code-data`]="{ row }">
          <div class="text-center">
            {{ row.pay_slip_code }}
          </div>
        </template>
        <template #[`time-data`]="{ row }">
          <div class="text-center">
            {{ row.month + '/' + row.year }}
          </div>
        </template>
        <template #[`total_money_need_paid-data`]="{ row }">
          <div class="text-center">
            {{ row.total_money_need_paid ? numeral(row.total_money_need_paid).format() : 0 }}
          </div>
        </template>
        <template #[`created_at-data`]="{ row }">
          <div class="text-center">
            {{ row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY HH:mm:ss') : '-' }}
          </div>
        </template>
        <template #[`approved_time-data`]="{ row }">
          <div class="text-center">
            {{ row.approved_time ? dayjs(row.approved_time).format('DD/MM/YYYY HH:mm:ss') : '-' }}
          </div>
        </template>
        <template #[`status-data`]="{ row }">
          <div
            v-if="row.status === 1"
            class="text-center"
          >
            Chưa duyệt
          </div>
          <div
            v-if="row.status === 2"
            class="text-center"
          >
            Đã duyệt
          </div>
          <div
            v-if="row.status === 3"
            class="text-center"
          >
            Đã chi
          </div>
          <div
            v-if="row.status === 4"
            class="text-center"
          >
            Đã hủy
          </div>
        </template>
        <template #[`action-data`]="{ row }">
          <div class="flex gap-1 justify-center">
            <UTooltip text="Chi tiết phiếu chi">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-eye-20-solid"
                @click="redirectToPaySlipDetail(row)"
              />
            </UTooltip>
            <UTooltip
              v-if="row.status === 1"
              text="Duyệt phiếu chi"
            >
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                color="green"
                icon="i-heroicons-check-20-solid"
                @click="onOpenApprovePaySlipModal(row)"
              />
            </UTooltip>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? "Không có dữ liệu" }}</span>
          </div>
        </template>
      </UTable>
      <!---->
      <!---->
      <UDivider />
      <div
        v-if="paySlips.meta.itemCount > 0"
        class="my-2 flex justify-end mr-6 items-center gap-2"
      >
        <UPagination
          v-model="page"
          :page-count="paySlips.meta.take"
          :total="paySlips.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
    <UModal v-model="isOpenModalSendMail">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h2 class="text-2xl font-bold">
            Gửi email thanh toán
          </h2>
        </template>

        <p>Bạn có chắc chắn muốn gửi email thanh toán tháng <strong>{{ (dayjs().month() + 1) + '/' + dayjs().year() }}</strong> không ?</p>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              color="primary"
              size="lg"
              @click="sendMailPayment"
            >
              Gửi
            </UButton>
            <UButton
              color="gray"
              size="lg"
              @click="isOpenModalSendMail = false"
            >
              Thoát
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    <!-- modal xác nhận duyệt phiếu chi -->
    <UModal
      v-model="isOpenApprovePaySlipModal"
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
              Duyệt phiếu chi
            </h3>
            <UButton
              class="-my-1"
              color="gray"
              icon="i-heroicons-x-mark-20-solid"
              variant="ghost"
              @click="isOpenApprovePaySlipModal = false"
            />
          </div>
        </template>
        <p>Bạn có chắc chắn muốn duyệt phiếu chi <strong>{{ selectedPaySlipCode }}</strong> không ?</p>
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              :ui="{ padding: { sm: 'px-5 py-2' } }"
              color="primary"
              label="Đồng ý"
              @click="onApprovePaySlip"
            />
            <UButton
              :ui="{ padding: { sm: 'px-5 py-2' } }"
              color="red"
              label="Thoát"
              @click="isOpenApprovePaySlipModal = false"
            />
          </div>
        </template>
      </UCard>
    </UModal>
    <!---->
  </UDashboardPage>
</template>
