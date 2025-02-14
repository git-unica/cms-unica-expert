<script lang="ts" setup>
import numeral from 'numeral'

const items = [{
  key: 'aff',
  label: 'Tiền hoa hồng',
  icon: 'i-heroicons-information-circle'
}, {
  key: 'owner',
  label: 'Tiền cho chủ cộng đồng',
  icon: 'i-heroicons-arrow-down-tray'
}]

const title = 'Chi tiết thu nhập'
useSeoMeta({
  title
})

const route = useRoute()
const paySlipCode = route.params.id
const moneyType = route.params.type
const attributeId = route.params.attribute_id

const page = ref(1)
const queryAff = reactive({
  'filter[pay_slip_code]': paySlipCode,
  page,
  'sort[_id]': -1,
  'filter[user_id]': attributeId
})

const queryOwner = reactive({
  'filter[pay_slip_code]': paySlipCode,
  page,
  'sort[_id]': -1,
  'filter[community_id]': attributeId
})
const errorMsg = ref()

// xử lý tiền aff
const defaultAffColumns = [
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
    key: 'money_software',
    label: 'Phần mềm',
    class: 'text-center'
  },
  {
    key: 'money_member',
    label: 'Membership',
    class: 'text-center'
  },
  {
    key: 'money_course',
    label: 'Mua khóa học',
    class: 'text-center'
  },
  {
    key: 'money_event',
    label: 'Sự kiện',
    class: 'text-center'
  },
  {
    key: 'money_product',
    label: 'Sản phẩm',
    class: 'text-center'
  },
  {
    key: 'total_money_need_paid',
    label: 'Tổng tiền',
    class: 'text-center'
  }
]

const selectedAffColumns = ref(defaultAffColumns.filter(c => !c.hidden))
const displayAffColumns = computed(() =>
  defaultAffColumns.filter(column => selectedAffColumns.value.includes(column))
)

const listAff = ref({ data: [], meta: {} })
const statusAff = ref()
const listOwner = ref({ data: [], meta: {} })
const statusOwner = ref()
if (moneyType === 'aff') {
  await useFetch('/api/v1/payment-monthly/list-aff-income-by-payslip', {
    query: queryAff,
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
      listAff.value = response._data
      statusAff.value = response._data.status
    }
  })
} else if (moneyType === 'owner') {
  await useFetch('/api/v1/payment-owner-monthly/list-owner-income-by-payslip', {
    query: queryOwner,
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
      listOwner.value = response._data
      statusOwner.value = response._data.status
    }
  })
}
// xử lý tiền owner
const defaultOwnerColumns = [
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
    key: 'money_membership_order',
    label: 'Membership',
    class: 'text-center'
  },
  {
    key: 'money_course_order',
    label: 'Mua khóa học',
    class: 'text-center'
  },
  {
    key: 'money_event_order',
    label: 'Sự kiện',
    class: 'text-center'
  },
  {
    key: 'money_product_order',
    label: 'Sản phẩm',
    class: 'text-center'
  },
  {
    key: 'total_money_need_paid',
    label: 'Tổng tiền',
    class: 'text-center'
  }
]

const selectedOwnerColumns = ref(defaultOwnerColumns.filter(c => !c.hidden))
const displayOwnerColumns = computed(() =>
  defaultOwnerColumns.filter(column => selectedOwnerColumns.value.includes(column))
)

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
        title="Chi tiết thu nhập"
      />
      <div
        v-if="moneyType === 'aff'"
      >
        <UTable
          :columns="displayAffColumns"
          :loading="statusAff === 'pending'"
          :rows="listAff.data"
          :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
          class="w-full"
          sort-mode="manual"
        >
          <template #time-data="{ row }">
            <div class="text-center">
              {{ row.month + '/' + row.year }}
            </div>
          </template>
          <template #money_software-data="{ row }">
            <div class="text-center">
              {{ row.money_software ? numeral(row.money_software).format() : '-' }}
            </div>
          </template>
          <template #money_member-data="{ row }">
            <div class="text-center">
              {{ row.money_member ? numeral(row.money_member).format() : '-' }}
            </div>
          </template>
          <template #money_course-data="{ row }">
            <div class="text-center">
              {{ row.money_course ? numeral(row.money_course).format() : '-' }}
            </div>
          </template>
          <template #money_event-data="{ row }">
            <div class="text-center">
              {{ row.money_event ? numeral(row.money_event).format() : '-' }}
            </div>
          </template>
          <template #money_product-data="{ row }">
            <div class="text-center">
              {{ row.money_product ? numeral(row.money_product).format() : '-' }}
            </div>
          </template>
          <template #total_money_need_paid-data="{ row }">
            <div class="text-center">
              {{ row.total_money_need_paid ? numeral(row.total_money_need_paid).format() : '-' }}
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
          v-if="listAff.meta.itemCount > 0"
          class="my-2 flex justify-end mr-6 items-center gap-2"
        >
          <UPagination
            v-model="page"
            :page-count="listAff.meta.take"
            :total="listAff.meta.itemCount"
          />
        </div>
      </div>
      <div
        v-else-if="moneyType === 'owner'"
      >
        <UTable
          :columns="displayOwnerColumns"
          :loading="statusOwner === 'pending'"
          :rows="listOwner.data"
          :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
          class="w-full"
          sort-mode="manual"
        >
          <template #time-data="{ row }">
            <div class="text-center">
              {{ row.month + '/' + row.year }}
            </div>
          </template>
          <template #money_membership_order-data="{ row }">
            <div class="text-center">
              {{ row.money_membership_order ? numeral(row.money_membership_order).format() : '-' }}
            </div>
          </template>
          <template #money_course_order-data="{ row }">
            <div class="text-center">
              {{ row.money_course_order ? numeral(row.money_course_order).format() : '-' }}
            </div>
          </template>
          <template #money_event_order-data="{ row }">
            <div class="text-center">
              {{ row.money_event_order ? numeral(row.money_event_order).format() : '-' }}
            </div>
          </template>
          <template #money_product_order-data="{ row }">
            <div class="text-center">
              {{ row.money_product_order ? numeral(row.money_product_order).format() : '-' }}
            </div>
          </template>
          <template #total_money_need_paid-data="{ row }">
            <div class="text-center">
              {{ row.total_money_need_paid ? numeral(row.total_money_need_paid).format() : '-' }}
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
          v-if="listOwner.meta.itemCount > 0"
          class="my-2 flex justify-end mr-6 items-center gap-2"
        >
          <UPagination
            v-model="page"
            :page-count="listOwner.meta.take"
            :total="listOwner.meta.itemCount"
          />
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
