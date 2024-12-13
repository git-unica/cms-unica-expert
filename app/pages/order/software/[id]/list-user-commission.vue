<script setup lang="ts">
import numeral from 'numeral'

const route = useRoute()
const orderCode = route?.params?.id

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

const page = ref(1)
const errorMsg = ref()
const queryCommission = reactive({
  page,
  'sort[_id]': -1,
  'id': orderCode
})

const { data: listUserCommission } = await useFetch(`/api/v1/order/list-user-commission-order`, {
  headers: useRequestHeaders(['cookie']),
  query: queryCommission,
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

const listUserCommissionData = computed(() => {
  return listUserCommission.value.data
})

const listUserCommissionMeta = computed(() => {
  return listUserCommission.value.meta
})
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
        title="Danh sách chia hoa hồng"
        :ui="{
          right: 'w-1/4'
        }"
      >
      </UDashboardNavbar>
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
      <UDivider/>
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

<style scoped>

</style>
