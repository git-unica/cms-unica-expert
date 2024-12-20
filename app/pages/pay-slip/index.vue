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
    key: 'user_count',
    label: 'Số người được chi',
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
  }
})
// redirect detail
const redirectToDetail = async (row: PaySlip) => {
  await navigateTo({ path: '/pay-slip/' + row.pay_slip_code })
}

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
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="paySlips.meta.itemCount"
        title="Phiếu chi"
      />

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
        :rows="paySlips.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #pay_slip_code-data="{ row }">
          <div class="text-center">
            {{ row.pay_slip_code }}
          </div>
        </template>
        <template #time-data="{ row }">
          <div class="text-center">
            {{ row.month + '/' + row.year }}
          </div>
        </template>
        <template #user_count-data="{ row }">
          <div class="text-center">
            <UTooltip text="Danh sách người được chia tiền">
              <span @click="redirectToDetail(row)" class="text-black font-medium cursor-pointer hover:text-[#ccc]">{{ row.user_count }}</span>
            </UTooltip>
          </div>
        </template>
        <template #total_money_need_paid-data="{ row }">
          <div class="text-center">
            {{ row.total_money_need_paid ? numeral(row.total_money_need_paid).format() : 0 }}
          </div>
        </template>
        <template #created_at-data="{ row }">
          <div class="text-center">
            {{ row.created_at ? dayjs(row.created_at).format('DD/MM/YYYY HH:mm:ss') : '-' }}
          </div>
        </template>
        <template #approved_time-data="{ row }">
          <div class="text-center">
            {{ row.approved_time ? dayjs(row.approved_time).format('DD/MM/YYYY HH:mm:ss') : '-' }}
          </div>
        </template>
        <template #status-data="{ row }">
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
  </UDashboardPage>
</template>
