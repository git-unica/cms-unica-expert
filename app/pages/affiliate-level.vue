<script lang="ts" setup>
import { number, object, string } from 'yup'
import Notiflix from 'notiflix'
import type { AffiliateLevel } from '~/types'

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
    key: 'verified_users',
    label: 'Yêu cầu giới thiệu',
    sortable: true
  },
  {
    key: 'icon',
    label: 'Biểu tượng'
  },
  {
    key: 'action',
    label: 'Hành động'
  }
]

const toast = useToast()
const selectedColumns = ref(defaultColumns.filter(c => !c.hidden))
const input = ref<{ input: HTMLInputElement }>()
const isOpenEditModal = ref(false)
const editRow = ref<AffiliateLevel>()
const isOpenAddModal = ref(false)
const defaultData = {
  name: '',
  verified_users: 0,
  commission: 10,
  icon: ''
}
const newRow = ref(defaultData)

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const schema = object({
  name: string().required('Không được trống'),
  verified_users: number()
    .min(0, 'Giá trị tối thiểu là 0')
    .required('Không được trống'),
  commission: number()
    .min(10, 'Giá trị tối thiểu là 10')
    .max(70, 'Giá trị tối đa là 70')
    .required('Không được trống'),
  icon: string().required('Không được trống')
})

const { data: allLevel, status, refresh } = await useFetch<AffiliateLevel[]>('/api/v1/affiliate-level')

const onUpdate = async () => {
  if (!editRow.value) return

  await $fetch(`/api/v1/affiliate-level/${editRow.value._id}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    body: useOmitBy(editRow.value, '_id'),
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenEditModal.value = false
        editRow.value = undefined

        toast.add({ title: 'Cập nhật cấp độ thành viên thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onAdd = async () => {
  await $fetch(`/api/v1/affiliate-level`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    body: newRow.value,
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenAddModal.value = false
        newRow.value = defaultData

        toast.add({ title: 'Thêm cấp độ thành viên thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onConfirmDelete = (row: AffiliateLevel) => {
  Notiflix.Confirm.show(
    'Cảnh báo',
    `Bạn đang thực hiện xoá ${row.name}`,
    'Chắc chắn',
    'Huỷ',
    () => onDelete(row)
  )
}

const onDelete = async (row: AffiliateLevel) => {
  await $fetch(`/api/v1/affiliate-level/${row._id}`, {
    method: 'DELETE',
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        refresh()

        toast.add({ title: 'Xoá cấp độ affiliate thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const openModalEdit = (row: AffiliateLevel) => {
  editRow.value = undefined

  isOpenEditModal.value = true
  editRow.value = row
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
        title="Cấp độ affiliate"
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
            @click="openModalEdit(row)"
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
      v-if="editRow"
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
          label="Số người cần giới thiệu >="
          name="verified_users"
        >
          <UInput
            v-model="editRow.verified_users"
            type="number"
          />
        </UFormGroup>

        <UFormGroup
          label="Hoa hồng phần mềm (trọn đời)"
          name="commission"
        >
          <UInput
            v-model="editRow.commission"
            type="number"
          />
        </UFormGroup>

        <UFormGroup
          label="Icon"
          name="icon"
        >
          <UInput
            v-model="editRow.icon"
          />
        </UFormGroup>

        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
    <UDashboardModal
      v-if="newRow"
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
          label="Số người cần giới thiệu >="
          name="verified_users"
        >
          <UInput
            v-model="newRow.verified_users"
            type="number"
          />
        </UFormGroup>

        <UFormGroup
          label="Hoa hồng phần mềm (trọn đời)"
          name="commission"
        >
          <UInput
            v-model="newRow.commission"
            type="number"
          />
        </UFormGroup>

        <UFormGroup
          label="Icon"
          name="icon"
        >
          <UInput
            v-model="newRow.icon"
          />
        </UFormGroup>
        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
  </UDashboardPage>
</template>
