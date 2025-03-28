<script lang="ts" setup>
import dayjs from 'dayjs'
import numeral from 'numeral'
import { format } from 'date-fns'
import { OrderStatus } from '~/enums/order-status.enum'
import { SubscriptionOrderType, SubscriptionStatus } from '~/enums/subscription.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    hidden: true
  },
  {
    key: 'buyer',
    label: 'Người mua'
  },
  {
    key: 'community_name',
    label: 'Cộng đồng'
  },
  {
    key: 'period',
    label: 'Thời hạn'
  },
  {
    key: 'product_name',
    label: 'Sản phẩm'
  },
  {
    key: 'order_type',
    label: 'Kiểu đơn'
  },
  {
    key: 'total_money',
    label: 'Tổng tiền'
  },
  {
    key: 'status',
    label: 'Trạng thái'
  },
  {
    key: 'last_pay_at',
    label: 'Ngày gia hạn gần nhất'
  },
  {
    key: 'next_pay_at',
    label: 'Ngày gia hạn tiếp theo'
  },
  {
    key: 'created_at',
    label: 'Ngày tạo'
  }
  // {
  //   key: 'action',
  //   label: 'Hành động',
  //   class: 'text-right'
  // }
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
  data: subscriptions,
  status,
  refresh
} = await useFetch('/api/v1/subscription', {
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

// filter by date range picker
const selectedDate = ref(new Date())

// filter by status
const selectedStatus = ref('')
const statusOptions = [{
  value: SubscriptionStatus.Pending,
  label: 'Chờ xử lý'
}, {
  value: SubscriptionStatus.Active,
  label: 'Hoạt động'
}, {
  value: SubscriptionStatus.Fail,
  label: 'Lỗi TT'
}, {
  value: SubscriptionStatus.Cancel,
  label: 'Đã hủy'
}
]

const selectedOrderType = ref('')
const orderTypeOptions = [{
  value: SubscriptionOrderType.Member,
  label: 'Membership'
}, {
  value: SubscriptionOrderType.Course,
  label: 'Mua khóa học'
}, {
  value: SubscriptionOrderType.Software,
  label: 'Phần mềm'
}
]

watch([selectedStatus, selectedOrderType], ([newSelectedStatus, newSelectedOrderType]) => {
  if (newSelectedStatus !== '' && newSelectedStatus !== null) {
    query['filter[status]'] = newSelectedStatus
  }

  if (newSelectedOrderType !== '' && newSelectedOrderType !== null) {
    query['filter[order_type]'] = newSelectedOrderType
  }
})

watch(selectedDate, (newDate) => {
  if (newDate) {
    selectedDate.value = newDate
    query['filter[date]'] = dayjs(newDate).toString()
  }
})

watch(page, (newPage) => {
  if (newPage) {
    query['page'] = newPage
    refresh()
  }
})
// text search theo nội dung
const contentOptions = [{
  value: 'user_name',
  label: 'Người mua'
}, {
  value: 'community',
  label: 'Cộng đồng'
}]
const selectedContent = ref(contentOptions[0].value)
const textSearch = ref('')

//
const dateOptions = [{
  value: 'last_pay_at',
  label: 'Ngày gia hạn gần nhất'
}, {
  value: 'next_pay_at',
  label: 'Ngày gia hạn tiếp theo'
}, {
  value: 'created_at',
  label: 'Ngày tạo'
}]
const selectedDateValue = ref(dateOptions[0].value)
//

// click button tìm kiếm
const onSearch = async () => {
  if (selectedContent.value && textSearch.value) {
    query['filter[content_type]'] = selectedContent.value
    query['filter[keyword]'] = textSearch.value.trim()
  } else {
    delete query['filter[content_type]']
    delete query['filter[keyword]']
  }

  if (selectedDateValue.value)
  {
    query['filter[date_type]'] = selectedDateValue.value
  } else {
    delete query['filter[date_type]']
  }

  query['page'] = 1
  await refresh()
}

const onResetFilter = async () => {
  delete query['filter[content_type]']
  delete query['filter[keyword]']
  delete query['filter[status]']
  delete query['filter[order_type]']
  delete query['filter[date_type]']
  selectedContent.value = ''
  textSearch.value = ''
  selectedStatus.value = ''
  delete query['filter[date]']
  query['page'] = 1
  await refresh()
}

const title = 'Đăng ký định kỳ'

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
        :badge="subscriptions.meta.itemCount"
        title="Đăng ký định kỳ"
      />

      <UDashboardToolbar>
        <template #left>
          <div class="flex gap-2">
            <USelectMenu
              v-model="selectedContent"
              :options="contentOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[150px]"
              option-attribute="label"
              value-attribute="value"
            />
            <UInput
              v-model="textSearch"
              :ui="{
                base: 'h-full'
              }"
              class="w-[220px]"
              placeholder="Tìm kiếm..."
            />
            <USelectMenu
              v-model="selectedDateValue"
              :options="dateOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[200px]"
              option-attribute="label"
              value-attribute="value"
            />
            <div class="flex justify-center items-center gap-2">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  icon="i-heroicons-calendar-days-20-solid"
                  :label="format(selectedDate, 'd MMM, yyy')"
                />

                <template #panel="{ close }">
                  <DatePicker
                    v-model="selectedDate"
                    @close="close"
                    @dayclick="
                      (_, event) => {
                        event.target.blur();
                      }
                    "
                  />
                </template>
              </UPopover>
            </div>
            <USelectMenu
              v-model="selectedStatus"
              :options="statusOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[200px]"
              option-attribute="label"
              placeholder="Trạng thái"
              value-attribute="value"
            />
            <USelectMenu
              v-model="selectedOrderType"
              :options="orderTypeOptions"
              :ui="{
                base: 'h-full'
              }"
              :ui-menu="{
                trigger: 'h-full'
              }"
              class="w-[200px]"
              option-attribute="label"
              placeholder="Loại đơn"
              value-attribute="value"
            />
            <div>
              <UButton
                :trailing="false"
                :ui="{
                  base: 'h-full'
                }"
                color="primary"
                icon="i-heroicons-magnifying-glass-solid"
                label="Button"
                size="sm"
                variant="solid"
                @click="onSearch"
              >
                Tìm
              </UButton>
            </div>
            <UButton
              :trailing="false"
              :ui="{
                variant: {
                  solid: 'bg-[#94A3B8] hover:bg-gray-400'
                }
              }"
              icon="i-heroicons-x-mark-20-solid"
              label="Button"
              size="sm"
              @click="onResetFilter"
            >
              Bỏ lọc
            </UButton>
          </div>
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
        :rows="subscriptions.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
        sort-mode="manual"
      >
        <template #buyer-data="{ row }">
          <p class="font-bold">
            {{ row.buyer_name }}
          </p>
          <p class="text-xs">
            {{ row.buyer_email }}
          </p>
          <p class="text-xs">
            {{ row.buyer_phone }}
          </p>
        </template>
        <template #community_name-data="{ row }">
          <UTooltip
            :popper="{ placement: 'right' }"
            text="Chi tiết đơn"
          >
            <ULink
              :to="'/order/software/' + row.order_code"
            >
              <p class="text-[#6B7280] font-bold">
                {{ row.community_name }}
              </p>
              <span
                v-if="row.community"
                class="text-xs"
              >
                {{ row.community.short_name ? row.community.short_name : '' }}
              </span>
            </ULink>
          </UTooltip>
        </template>
        <template #order_code-data="{ row }">
          <div class="text-center flex flex-col justify-center items-center">
            <UTooltip
              :popper="{ placement: 'right' }"
              text="Chi tiết đơn"
            >
              <ULink
                :to="'/order/software/' + row.order_code"
              >
                <span class="hover:text-[#ccc] font-bold">{{ row.order_code }}</span>
              </ULink>
            </UTooltip>
            <UTooltip
              v-if="row.receipt_info && Object.keys(row.receipt_info).length > 0"
              :popper="{ placement: 'right' }"
              class="cursor-pointer"
              text="Mã phiếu thu"
            >
              <span
                class="text-xs text-gray-500"
              >
                {{ row.receipt_info.receipt_code }}
              </span>
            </UTooltip>
          </div>
        </template>
        <template #order_type-data="{ row }">
          <span v-if="row.order_type === 0">Membership</span>
          <span v-if="row.order_type === 1">Mua khóa học</span>
          <span v-if="row.order_type === 2">Phần mềm</span>
        </template>
        <template #period-data="{ row }">
          {{ row.period }} tháng
        </template>
        <template #total_money-data="{ row }">
          <div class="text-right">
            {{ numeral(row.total_money).format() }}
          </div>
        </template>
        <template #last_pay_at-data="{ row }">
          {{ row.last_pay_at ? dayjs(row.last_pay_at).format("DD/MM/YYYY HH:mm:ss ") : '-' }}
        </template>
        <template #next_pay_at-data="{ row }">
          {{ row.next_pay_at ? dayjs(row.next_pay_at).format("DD/MM/YYYY HH:mm:ss ") : '-' }}
        </template>
        <template #created_at-data="{ row }">
          {{ dayjs(row.created_at).format("DD/MM/YYYY HH:mm:ss ") }}
        </template>
        <template #status-data="{ row }">
          <span
            v-if="row.status === SubscriptionStatus.Pending"
            class="text-orange-500"
          >
            Chờ xử lý
          </span>
          <span
            v-if="row.status === SubscriptionStatus.Active"
            class="text-green-500"
          >
            Hoạt động
          </span>
          <span
            v-if="row.status === SubscriptionStatus.Fail"
            class="text-slate-400"
          >
            Lỗi TT
          </span>
          <span
            v-if="row.status === SubscriptionStatus.Cancel"
            class="text-teal-500"
          >
            Đã hủy
          </span>
          <span
            v-if="row.status === OrderStatus.Removed"
            class="text-red-500"
          >
            Đã xóa
          </span>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 gap-3">
            <span class="italic text-sm">{{ errorMsg ?? "Không có dữ liệu"  }}</span>
          </div>
        </template>
      </UTable>
      <UDivider />
      <div
        v-if="subscriptions.meta.itemCount > 0"
        class="my-2 flex justify-end mr-6 items-center gap-2"
      >
        <p class="text-sm">
          Số đăng ký định kỳ: {{ subscriptions.meta.itemCount }}
        </p>
        <UPagination
          v-model="page"
          :page-count="subscriptions.meta.take"
          :total="subscriptions.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>
