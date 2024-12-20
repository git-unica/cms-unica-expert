<script lang="ts" setup>
import numeral from 'numeral'
import dayjs from 'dayjs'
import type {PaySlipDetail} from "~/types";

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'user_id',
    label: 'User id',
    class: 'text-center'
  },
  {
    key: 'user_name',
    label: 'Họ tên',
    class: 'text-center'
  },
  {
    key: 'total_money_aff',
    label: 'Tiền hoa hồng',
    class: 'text-center'
  },
  {
    key: 'total_money_owner',
    label: 'Tiền cho chủ cộng đồng',
    class: 'text-center'
  },
  {
    key: 'total_money',
    label: 'Tổng tiền',
    class: 'text-center'
  },
  {
    key: 'action',
    label: 'Hành động',
    class: 'text-center'
  }
]

const route = useRoute()
const paySlipCode = route.params.id
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const page = ref(1)
const query = reactive({
  'filter[pay_slip_code]': paySlipCode,
  page,
  'sort[_id]': -1
})
const errorMsg = ref()

const columns = computed(() =>
  defaultColumns.filter(column => selectedColumns.value.includes(column))
)

const {
  data: listPaySlipDetail,
  status,
  refresh
} = await useFetch('/api/v1/pay-slip-detail/list-user-payment-info', {
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

watch(page, (newPage) => {
  if (newPage) {
    query['page'] = newPage
    refresh()
  }
})

const title = 'Danh sách các khoản được thanh toán của người dùng'

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

// chuyển hướng sang chi tiết thu nhâp
const redirectToOrderDetail = async (row: PaySlipDetail) => {
  await navigateTo({ name: 'pay-slip-id-user_id', params: { id: paySlipCode, user_id: row.user_id } })
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="listPaySlipDetail.meta.itemCount"
        title="Danh sách các khoản được thanh toán của người dùng"
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
        :rows="listPaySlipDetail.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #user_name-data="{ row }">
          <div class="text-center">
            {{ row.user ? row.user.full_name : '-' }}
          </div>
        </template>
        <template #user_id-data="{ row }">
          <div class="text-center">
            {{ row.user_id }}
          </div>
        </template>
        <template #time-data="{ row }">
          <div class="text-center">
            {{ row.month + '/' + row.year }}
          </div>
        </template>
        <template #total_money_aff-data="{ row }">
          <div class="text-center">
            {{ row.total_money_aff ? numeral(row.total_money_aff).format() : '-' }}
          </div>
        </template>
        <template #total_money_owner-data="{ row }">
          <div class="text-center">
            {{ row.total_money_owner ? numeral(row.total_money_owner).format() : '-' }}
          </div>
        </template>
        <template #total_money-data="{ row }">
          <div class="text-center">
            {{ row.total_money ? numeral(row.total_money).format() : '-' }}
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
        <template #action-data="{ row }">
          <div class="flex gap-1 justify-center">
            <UTooltip text="Chi tiết thu nhập">
              <UButton
                :ui="{ rounded: 'rounded-full' }"
                icon="i-heroicons-eye-20-solid"
                @click="redirectToOrderDetail(row)"
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
        v-if="listPaySlipDetail.meta.itemCount > 0"
        class="my-2 flex justify-end mr-6 items-center gap-2"
      >
        <UPagination
          v-model="page"
          :page-count="listPaySlipDetail.meta.take"
          :total="listPaySlipDetail.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
