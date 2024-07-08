<script lang="ts" setup>
import { number, object, string } from 'yup'
import Notiflix from 'notiflix'
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
const isOpenAddModal = ref(false)
const newRow = ref({
  name: '',
  point: 0
})

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const schema = object({
  name: string().required('Không được trống'),
  point: number()
    .min(0, 'Giá trị tối thiểu là 0')
    .required('Không được trống')
})

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

const onAdd = async () => {
  await $fetch(`v1/level`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    body: {
      title: newRow.value.name,
      point: newRow.value.point
    },
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenAddModal.value = false

        toast.add({ title: 'Thêm cấp độ thành viên thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onConfirmDelete = (row: Level) => {
  Notiflix.Confirm.show(
    'Cảnh báo',
    `Bạn đang thực hiện xoá ${row.name}`,
    'Chắc chắn',
    'Huỷ',
    () => onDelete(row)
  )
}

const onDelete = async (row: Level) => {
  await $fetch(`v1/level/${row._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    onResponse({ response }) {
      if (response.ok) {
        refresh()

        toast.add({ title: 'Xoá cấp độ thành viên thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
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
      >
        <template #right>
          <UButton
            color="gray"
            label="Thêm cấp độ"
            trailing-icon="i-heroicons-plus"
            @click="isOpenAddModal = true"
          />
        </template>
      </UDashboardNavbar>

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
            @click="onConfirmDelete(row)"
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
        :schema="schema"
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
    <UDashboardModal
      v-model="isOpenAddModal"
      :close-button="null"
      title="Thêm cấp độ"
    >
      <UForm
        :schema="schema"
        :state="newRow"
        class="space-y-4"
        @submit="onAdd"
      >
        <UFormGroup
          label="Tên hiển thị"
          name="name"
        >
          <UInput v-model="newRow.name" />
        </UFormGroup>

        <UFormGroup
          label="Điểm"
          name="pont"
        >
          <UInput
            v-model="newRow.point"
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
