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

const toast = useToast()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken } = storeToRefs(authStore)
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const input = ref<{ input: HTMLInputElement }>()
const isOpenEditModal = ref(false)
const editRow = ref<Level>()

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const { data: allLevel, status, refresh } = await useFetch<Level[]>('/v1/level', {
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` }
})

const onUpdate = async () => {
  if (!editRow.value) return

  await $fetch(`v1/level`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    body: {
      level_id: editRow.value._id,
      title: editRow.value.name,
      point: editRow.value.point
    },
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenEditModal.value = false

        toast.add({ title: 'Cập nhật cấp độ thành viên thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
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
        :badge="allLevel.length"
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
        :rows="allLevel"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
      >
        <template #[`action-data`]="{ row }">
          <UButton
            :ui="{ rounded: 'rounded-full' }"
            class="mr-1"
            icon="i-heroicons-pencil-square"
            @click="isOpenEditModal = true; editRow = row"
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
    <UDashboardModal
      v-model="isOpenEditModal"
      :close-button="null"
      title="Sửa cấp độ"
    >
      <UForm
        :state="editRow"
        class="space-y-4"
        @submit="onUpdate"
      >
        <UFormGroup
          label="Tên hiển thị"
          name="name"
        >
          <UInput v-model="editRow.name" />
        </UFormGroup>

        <UFormGroup
          label="Điểm"
          name="pont"
        >
          <UInput
            v-model="editRow.point"
            type="number"
          />
        </UFormGroup>

        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
  </UDashboardPage>
</template>
