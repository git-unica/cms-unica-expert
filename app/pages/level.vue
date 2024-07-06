<script lang="ts" setup>
import type { Level } from '~/types'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  }, {
    key: 'name',
    label: 'Tên',
    sortable: true
  },
  {
    key: 'point',
    label: 'Điểm',
    sortable: true
  },
  {
    key: 'action',
    label: 'Hành động'
  }
]

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const input = ref<{ input: HTMLInputElement }>()

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const { data: communities, status } = await useFetch<Level[]>('/v1/level', {
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` }
})

const onUpdate = (row: Level) => {

}

const onDelete = (row: Level) => {

}

defineShortcuts({
  '/': () => {
    input.value?.input?.focus()
  }
})
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar
        :badge="communities.length"
        title="Cấp độ thành viên"
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
        :rows="communities"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
      >
        <template #[`action-data`]="{ row }">
          <UButton
            :ui="{ rounded: 'rounded-full' }"
            class="mr-1"
            icon="i-heroicons-pencil-square"
            @click="onUpdate(row)"
          />
          <UButton
            :ui="{ rounded: 'rounded-full' }"
            color="rose"
            icon="i-heroicons-trash"
            @click="onDelete(row)"
          />
        </template>
      </UTable>
      <UDivider />
    </UDashboardPanel>
  </UDashboardPage>
</template>
