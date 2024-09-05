<script lang="ts" setup>
import { number, object, string } from 'yup'
import Notiflix from 'notiflix'
import slugify from 'slugify'
import type { IResponsePagination, Post } from '~/types'
import { EStatusPost } from '~/enums/status-post.enum'

const defaultColumns = [
  {
    key: '_id',
    label: '#',
    sortable: true,
    hidden: true
  },
  {
    key: 'title',
    label: 'Tên',
    sortable: true
  },
  {
    key: 'status',
    label: 'Trạng thái',
    sortable: true
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
const editRow = ref<Post>()
const editSeo = reactive({
  title: undefined,
  description: undefined
})
const isOpenAddModal = ref(false)
const defaultData = {
  title: undefined,
  description: undefined,
  status: EStatusPost.Draft,
  slug: undefined,
  seo: {
    title: undefined,
    description: undefined
  }
}
const newRow = ref(defaultData)
const q = ref()
const keyword = refDebounced(q, 500)
const page = ref(1)
const query = reactive({
  keyword,
  page
})

const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const schema = object({
  title: string().required('Không để trống'),
  description: string().required('Không để trống'),
  status: number().required('Trạng thái cần được chọn').oneOf(Object.values(EStatusPost)),
  slug: string().required('Không để trống')
})

const { data: pagePost, status, refresh } = await useLazyFetch<IResponsePagination<Post>>('/api/v1/posts', {
  query,
  headers: useRequestHeaders(['cookie']),
  server: false,
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

watch(() => newRow.value.title, (newValue) => {
  newRow.value.slug = 'page/' + slugify(newValue, { locale: 'vi', lower: true })
})

const onUpdate = async () => {
  if (!editRow.value) return

  await $fetch(`/api/v1/posts/${editRow.value._id}`, {
    method: 'PATCH',
    headers: useRequestHeaders(['cookie']),
    body: { ...editRow.value, seo: editSeo },
    async onResponse({ response }) {
      if (response.ok) {
        await refresh()
        isOpenEditModal.value = false
        editRow.value = undefined
        editSeo.title = undefined
        editSeo.description = undefined

        toast.add({ title: 'Cập nhật bài viết thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onAdd = async () => {
  await $fetch(`/api/v1/posts`, {
    method: 'POST',
    headers: useRequestHeaders(['cookie']),
    body: newRow.value,
    async onResponse({ response }) {
      if (response.ok) {
        await refresh()
        isOpenAddModal.value = false
        newRow.value = defaultData

        toast.add({ title: 'Thêm bài viết thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const onConfirmDelete = (row: Post) => {
  Notiflix.Confirm.show(
    'Cảnh báo',
    `Bạn đang thực hiện xoá ${row.title}`,
    'Chắc chắn',
    'Huỷ',
    () => onDelete(row)
  )
}

const onDelete = async (row: Post) => {
  await $fetch(`/api/v1/posts/${row._id}`, {
    method: 'DELETE',
    headers: useRequestHeaders(['cookie']),
    onResponse({ response }) {
      if (response.ok) {
        refresh()

        toast.add({ title: 'Xoá bài viết thành công', color: 'green' })
      } else {
        toast.add({ title: 'Có lỗi khi thao tác', color: 'red' })
      }
    }
  })
}

const openModalEdit = (row: Post) => {
  editRow.value = undefined
  editSeo.title = undefined
  editSeo.description = undefined

  isOpenEditModal.value = true
  editRow.value = row
  editSeo.title = row.seo?.title
  editSeo.description = row.seo?.description
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
        :badge="pagePost.meta.itemCount"
        title="Bài viết"
      >
        <template #right>
          <UButton
            color="gray"
            label="Thêm bài viết"
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
        :rows="pagePost.data"
        :ui="{ divide: 'divide-gray-200 dark:divide-gray-800' }"
        class="w-full"
      >
        <template #[`status-data`]="{ row }">
          {{ row.status === 'draft' ? 'Bản nháp' : 'Công khai' }}
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
        v-if="pagePost.meta.itemCount > 0"
        class="my-2 mx-auto"
      >
        <UPagination
          v-model="page"
          :page-count="pagePost.meta.take"
          :total="pagePost.meta.itemCount"
        />
      </div>
    </UDashboardPanel>
    <UDashboardModal
      v-if="editRow"
      v-model="isOpenEditModal"
      :close-button="null"
      :ui="{ width: 'sm:min-w-[50dvw]' }"
      title="Sửa bài viết"
    >
      <UForm
        :schema="schema"
        :state="editRow"
        class="space-y-4"
        @submit="onUpdate"
      >
        <UFormGroup
          label="Tiêu đề"
          name="title"
          required
        >
          <UInput
            v-model="editRow.title"
            class="col-span-3"
          />
        </UFormGroup>

        <UFormGroup
          label="Nội dung"
          name="description"
          required
        >
          <CkEditor v-model="editRow.description" />
        </UFormGroup>

        <UFormGroup
          label="Trạng thái"
          name="status"
          required
        >
          <USelect
            v-model="editRow.status"
            :options="Object.keys(EStatusPost).map(key => ({ label: key, value: EStatusPost[key] }))"
          />
        </UFormGroup>

        <UFormGroup
          label="Slug"
          name="slug"
          required
        >
          <UInput v-model="editRow.slug" />
        </UFormGroup>

        <UAccordion :items="[{ label: 'SEO', slot: 'seo' }]">
          <template #seo>
            <UFormGroup
              label="Title"
              name="seo.title"
            >
              <UInput v-model="editSeo.title">
                <template #trailing>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">{{ editSeo.title?.length || 0 }}/50</span>
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup
              :help="`${editSeo.description?.length || 0}/160`"
              label="Description"
              name="seo.description"
            >
              <UTextarea
                v-model="editSeo.description"
              />
            </UFormGroup>
          </template>
        </UAccordion>

        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
    <UDashboardModal
      v-model="isOpenAddModal"
      :close-button="null"
      :ui="{ width: 'sm:min-w-[50dvw]' }"
      title="Thêm bài viết"
    >
      <UForm
        :schema="schema"
        :state="newRow"
        class="space-y-4"
        @submit="onAdd"
      >
        <UFormGroup
          label="Tiêu đề"
          name="title"
          required
        >
          <UInput v-model="newRow.title" />
        </UFormGroup>

        <UFormGroup
          label="Nội dung"
          name="description"
          required
        >
          <CkEditor v-model="newRow.description" />
        </UFormGroup>

        <UFormGroup
          label="Trạng thái"
          name="status"
          required
        >
          <USelect
            v-model="newRow.status"
            :options="Object.keys(EStatusPost).map(key => ({ label: key, value: EStatusPost[key] }))"
          />
        </UFormGroup>

        <UFormGroup
          label="Slug"
          name="slug"
          required
        >
          <UInput v-model="newRow.slug" />
        </UFormGroup>

        <UAccordion :items="[{ label: 'SEO', slot: 'seo' }]">
          <template #seo>
            <UFormGroup
              label="Title"
              name="seo.title"
            >
              <UInput v-model="newRow.seo.title">
                <template #trailing>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">{{ newRow.seo.title?.length || 0 }}/50</span>
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup
              :help="`${newRow.seo.description?.length || 0}/160`"
              label="Description"
              name="seo.description"
            >
              <UTextarea
                v-model="newRow.seo.description"
              />
            </UFormGroup>
          </template>
        </UAccordion>

        <UButton type="submit">
          Lưu
        </UButton>
      </UForm>
    </UDashboardModal>
  </UDashboardPage>
</template>
