<script lang="ts" setup>
import { object, string } from 'yup'
import Notiflix from 'notiflix'
import type { IResponsePagination, Topic } from '~/types'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  },
  {
    key: 'icon',
    label: 'Icon'
  },
  {
    key: 'title',
    label: 'Tên',
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
const editRow = ref<Topic>()
const isOpenAddModal = ref(false)
const newRow = ref({
  title: ''
})
const q = ref()
const keyword = refDebounced(q, 500)
const page = ref(1)
const query = reactive({
  keyword,
  page
})

const editIcon = ref() as Ref<File>
const { base64: editIconBase64 } = useBase64(editIcon)

const createIcon = ref() as Ref<File>
const { base64: createIconBase64 } = useBase64(createIcon)

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const schema = object({
  title: string().required('Không được trống')
})

const { data: pageTopic, status, refresh } = await useFetch<IResponsePagination<Topic>>('/v1/topic', {
  query,
  baseURL: config.public.apiUrl,
  headers: { Authorization: `Bearer ${accessToken.value}` },
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
  })
})

const onEditIconInput = (e: Event) => {
  editIcon.value = (e.target as HTMLInputElement).files![0]
}

const onCreateIconInput = (e: Event) => {
  createIcon.value = (e.target as HTMLInputElement).files![0]
}

const onUpdate = async () => {
  if (!editRow.value) return

  const formData = new FormData()
  formData.append('title', editRow.value.title)
  formData.append('icon', editIcon.value)

  await $fetch(`v1/topic/${editRow.value._id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    body: formData,
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenEditModal.value = false

        toast.add({ title: 'Cập nhật chủ đề thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onAdd = async () => {
  const formData = new FormData()
  formData.append('title', newRow.value.title)
  formData.append('icon', createIcon.value)

  await $fetch(`v1/topic`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    body: formData,
    onResponse({ response }) {
      if (response.ok) {
        refresh()
        isOpenAddModal.value = false

        toast.add({ title: 'Thêm chủ đề thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onConfirmDelete = (row: Topic) => {
  Notiflix.Confirm.show(
    'Cảnh báo',
    `Bạn đang thực hiện xoá ${row.title}`,
    'Chắc chắn',
    'Huỷ',
    () => onDelete(row)
  )
}

const onDelete = async (row: Topic) => {
  await $fetch(`v1/topic/${row._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken.value}` },
    baseURL: config.public.apiUrl,
    onResponse({ response }) {
      if (response.ok) {
        refresh()

        toast.add({ title: 'Xoá chủ đề thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const openModalEdit = (row: Topic) => {
  isOpenEditModal.value = true
  editRow.value = row
  editIcon.value = undefined
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
        :badge="pageTopic.meta.itemCount"
        title="Chủ đề"
      >
        <template #right>
          <UButton
            color="gray"
            label="Thêm chủ đề"
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
        :rows="pageTopic.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
      >
        <template #[`icon-data`]="{ row }">
          <NuxtImg
            v-if="row.icon"
            :src="`./storage/${row.icon}`"
            placeholder="https://placehold.co/30"
            width="30"
          />
        </template>
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
      <div
        v-if="pageTopic.meta.itemCount > 0"
        class="my-2 mx-auto"
      >
        <UPagination
          v-model="page"
          :page-count="pageTopic.meta.take"
          :total="pageTopic.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
    <UDashboardModal
      v-model="isOpenEditModal"
      :close-button="null"
      title="Sửa chủ đề"
    >
      <UForm
        :schema="schema"
        :state="editRow"
        class="space-y-4"
        @submit="onUpdate"
      >
        <UFormGroup
          label="Chủ đề"
          name="title"
          required
        >
          <UInput v-model="editRow.title" />
        </UFormGroup>

        <UFormGroup
          hint="Ảnh nên có tỷ lệ 1x1"
          label="Icon"
          name="icon"
        >
          <NuxtImg
            v-if="editRow.icon || editIconBase64"
            :src="editIcon ? editIconBase64 : `./storage/${editRow.icon}`"
            alt=""
            class="max-w-full max-h-60"
          />
          <UInput
            type="file"
            @input="onEditIconInput"
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
      title="Thêm chủ đề"
    >
      <UForm
        :schema="schema"
        :state="newRow"
        class="space-y-4"
        @submit="onAdd"
      >
        <UFormGroup
          label="Chủ đề"
          name="title"
          required
        >
          <UInput v-model="newRow.title" />
        </UFormGroup>

        <UFormGroup
          hint="Ảnh nên có tỷ lệ 1x1"
          label="Icon"
          name="icon"
        >
          <img
            v-if="createIconBase64"
            :src="createIconBase64"
            alt=""
            class="max-w-full max-h-60"
          >
          <UInput
            type="file"
            @input="onCreateIconInput"
          />
        </UFormGroup>

        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
  </UDashboardPage>
</template>
