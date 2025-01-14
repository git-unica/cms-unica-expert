<script lang="ts" setup>
import numeral from 'numeral'
import type { PaySlipDetail } from '~/types'

const defaultAffColumns = [
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'user_id',
    label: 'ID người dùng',
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
    key: 'aff_payment_info',
    label: 'Thông tin thanh toán hoa hồng',
    class: 'text-center'
  },
  {
    key: 'action',
    label: 'Hành động',
    class: 'text-center'
  }
]

const defaultOwnerColumns = [
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'user_id',
    label: 'ID chủ cộng đồng',
    class: 'text-center'
  },
  {
    key: 'user_name',
    label: 'Chủ cộng đồng',
    class: 'text-center'
  },
  {
    key: 'community_id',
    label: 'ID cộng đồng',
    class: 'text-center'
  },
  {
    key: 'community_name',
    label: 'Cộng đồng',
    class: 'text-center'
  },
  {
    key: 'total_money_owner',
    label: 'Tiền cộng đồng',
    class: 'text-center'
  },
  {
    key: 'owner_payment_info',
    label: 'Thông tin thanh toán cộng đồng',
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
const selectedAffColumns = ref(defaultAffColumns.filter(c => !c.hidden))
const selectedOwnerColumns = ref(defaultOwnerColumns.filter(c => !c.hidden))
const pageAff = ref(1)
const pageOwner = ref(1)

const query = reactive({
  'filter[pay_slip_code]': paySlipCode,
  'page': 1,
  'sort[_id]': -1
})

const queryAff = reactive({
  'filter[pay_slip_code]': paySlipCode,
  'filter[type]': 1,
  'page': pageAff,
  'sort[_id]': -1
})

const queryOwner = reactive({
  'filter[pay_slip_code]': paySlipCode,
  'filter[type]': 2,
  'page': pageOwner,
  'sort[_id]': -1
})

const errorMsg = ref()

// tiền aff
const {
  data: listAff,
  refresh: refreshAff
} = await useFetch('/api/v1/pay-slip-detail/list-user-payment-info', {
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
  }
})

// tiền owner
const {
  data: listOwner,
  refresh: refreshOwner
} = await useFetch('/api/v1/pay-slip-detail/list-user-payment-info', {
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
  }
})

const columnsAff = computed(() =>
  defaultAffColumns.filter(column => selectedAffColumns.value.includes(column))
)

const columnsOwner = computed(() =>
  defaultOwnerColumns.filter(column => selectedOwnerColumns.value.includes(column))
)
const {
  data: listPaySlipDetail,
  status
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

watch(pageAff, (newPage) => {
  if (newPage) {
    queryAff['page'] = newPage
    refreshAff()
  }
})

watch(pageOwner, (newPage) => {
  if (newPage) {
    queryOwner['page'] = newPage
    refreshOwner()
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
const redirectToIncomeDetailAff = async (row: PaySlipDetail) => {
  await navigateTo({ name: 'pay-slip-id-type-attribute_id', params: { id: paySlipCode, type: 'aff', attribute_id: row.user_id } })
}

const redirectToIncomeDetailOwner = async (row: PaySlipDetail) => {
  await navigateTo({ name: 'pay-slip-id-type-attribute_id', params: { id: paySlipCode, type: 'owner', attribute_id: row.community_id } })
}

// export dữ liệu
const toast = useToast()
const config = useRuntimeConfig()

const exportAffMoneyExcel = async () => {
  try {
    await $fetch(`/api/v1/pay-slip-detail/export`, {
      headers: useRequestHeaders(['cookie']),
      query: queryAff,
      onResponse({ response }) {
        if (response.ok) {
          if (response._data.path) window.open(`${config.public.apiUrl}/${response._data.path}`, '_blank')
          else toast.add({ title: response._data.message })
        }
      }
    })
  } catch (error) {
    console.log(error)
    toast.add({ title: 'Có lỗi khi xử lý export', color: 'red' })
  }
}
const exportOwnerMoneyExcel = async () => {
  try {
    await $fetch(`/api/v1/pay-slip-detail/export`, {
      headers: useRequestHeaders(['cookie']),
      query: queryOwner,
      onResponse({ response }) {
        if (response.ok) {
          if (response._data.path) window.open(`${config.public.apiUrl}/${response._data.path}`, '_blank')
          else toast.add({ title: response._data.message })
        }
      }
    })
  } catch (error) {
    console.log(error)
    toast.add({ title: 'Có lỗi khi xử lý export', color: 'red' })
  }
}

// chia tab
const items = [{
  key: 'aff',
  label: 'Tiền hoa hồng'
}, {
  key: 'owner',
  label: 'Tiền cộng đồng'
}]
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="listPaySlipDetail.meta.itemCount"
        title="Danh sách các khoản được thanh toán của người dùng"
      />

      <UTabs
        class="mt-2"
        :items="items"
      >
        <template #[`item`]="{ item }">
          <div
            v-if="item.key === 'aff'"
          >
            <UDashboardToolbar>
              <template #left>
                <UButton @click="exportAffMoneyExcel">
                  Export
                </UButton>
              </template>
              <template #right>
                <USelectMenu
                  v-model="selectedAffColumns"
                  :options="defaultAffColumns"
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
              :columns="columnsAff"
              :loading="status === 'pending'"
              :rows="listAff.data"
              :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
              class="w-full"
              sort-mode="manual"
            >
              <template #[`user_name-data`]="{ row }">
                <div class="text-center">
                  {{ row.user ? row.user.full_name : '-' }}
                </div>
              </template>
              <template #[`user_id-data`]="{ row }">
                <div class="text-center">
                  {{ row.user_id }}
                </div>
              </template>
              <template #[`total_money_aff-data`]="{ row }">
                <div class="text-center">
                  {{ row.total_money_aff ? numeral(row.total_money_aff).format() : '-' }}
                </div>
              </template>
              <template #[`aff_payment_info-data`]="{ row }">
                <div
                  v-if="row.user && row.user.aff_payment"
                  class="flex justify-center gap-1 ml-2"
                >
                  <div>
                    <p>Mã số thuế: {{ row.user.aff_payment.tax_code ?? '-' }}</p>
                    <p>Số căn cước công dân: {{ row.user.aff_payment.id_card ?? '-' }}</p>
                    <p>Ngân hàng: {{ row.user.aff_payment.bank_name ?? '-' }}</p>
                    <p>Tên tài khoản: {{ row.user.aff_payment.account_name ?? '-' }}</p>
                    <p>Số tài khoản: {{ row.user.aff_payment.account_number ?? '-' }}</p>
                  </div>
                </div>
                <div
                  v-else
                  class="text-center"
                >
                  -
                </div>
              </template>
              <template #[`action-data`]="{ row }">
                <div class="flex gap-1 justify-center">
                  <UTooltip text="Chi tiết thu nhập">
                    <UButton
                      :ui="{ rounded: 'rounded-full' }"
                      icon="i-heroicons-eye-20-solid"
                      @click="redirectToIncomeDetailAff(row)"
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
              v-if="listAff.meta.itemCount > 0"
              class="my-2 flex justify-end mr-6 items-center gap-2"
            >
              <UPagination
                v-model="pageAff"
                :page-count="listAff.meta.take"
                :total="listAff.meta.itemCount"
              />
            </div>
          </div>
          <div
            v-if="item.key === 'owner'"
          >
            <UDashboardToolbar>
              <template #left>
                <UButton @click="exportOwnerMoneyExcel">
                  Export
                </UButton>
              </template>
              <template #right>
                <USelectMenu
                  v-model="selectedOwnerColumns"
                  :options="defaultOwnerColumns"
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
              :columns="columnsOwner"
              :loading="status === 'pending'"
              :rows="listOwner.data"
              :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
              class="w-full"
              sort-mode="manual"
            >
              <template #[`user_name-data`]="{ row }">
                <div class="text-center">
                  {{ row.user ? row.user.full_name : '-' }}
                </div>
              </template>
              <template #[`user_id-data`]="{ row }">
                <div class="text-center">
                  {{ row.user_id }}
                </div>
              </template>
              <template #[`total_money_owner-data`]="{ row }">
                <div class="text-center">
                  {{ row.total_money_owner ? numeral(row.total_money_owner).format() : '-' }}
                </div>
              </template>
              <template #[`community_id-data`]="{ row }">
                <div class="text-center">
                  {{ row.community_id }}
                </div>
              </template>
              <template #[`community_name-data`]="{ row }">
                <div class="text-center">
                  {{ row.community ? row.community.name : '-' }}
                </div>
              </template>
              <template #[`owner_payment_info-data`]="{ row }">
                <div
                  v-if="row.community && row.community.payment_details"
                  class="flex justify-center gap-1 ml-2"
                >
                  <div>
                    <p>Ngân hàng: {{ row.community.payment_details.bank_name ?? '-' }}</p>
                    <p>Tên tài khoản: {{ row.community.payment_details.user_name ?? '-' }}</p>
                    <p>Số tài khoản: {{ row.community.payment_details.bank_number ?? '-' }}</p>
                  </div>
                </div>
                <div
                  v-else
                  class="text-center"
                >
                  -
                </div>
              </template>
              <template #[`action-data`]="{ row }">
                <div class="flex gap-1 justify-center">
                  <UTooltip text="Chi tiết thu nhập">
                    <UButton
                      :ui="{ rounded: 'rounded-full' }"
                      icon="i-heroicons-eye-20-solid"
                      @click="redirectToIncomeDetailOwner(row)"
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
              v-if="listOwner.meta.itemCount > 0"
              class="my-2 flex justify-end mr-6 items-center gap-2"
            >
              <UPagination
                v-model="pageOwner"
                :page-count="listOwner.meta.take"
                :total="listOwner.meta.itemCount"
              />
            </div>
          </div>
        </template>
      </UTabs>
    </UDashboardPanel>
  </UDashboardPage>
</template>
