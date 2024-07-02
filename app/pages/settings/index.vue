<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'

const fileRef = ref<HTMLInputElement>()
const isDeleteAccountModalOpen = ref(false)
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const state = reactive({
  name: user.value.full_name,
  email: user.value.email,
  phone: user.value.phone,
  avatar: user.value.avatar,
  bio: user.value.bio,
  password_current: '',
  password_new: ''
})

const toast = useToast()

function validate(state: any): FormError[] {
  const errors = []
  if (!state.name) errors.push({ path: 'name', message: 'Vui lòng nhập họ tên.' })
  if (!state.email) errors.push({ path: 'email', message: 'Vui lòng nhập email.' })
  if ((state.password_current && !state.password_new) || (!state.password_current && state.password_new)) errors.push({ path: 'password', message: 'Vui lòng nhập mật khẩu hợp lệ.' })
  return errors
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  state.avatar = URL.createObjectURL(input.files[0])
}

function onFileClick() {
  fileRef.value?.click()
}

async function onSubmit(event: FormSubmitEvent<any>) {
  // Do something with data
  console.log(event.data)

  toast.add({ title: 'Profile updated', icon: 'i-heroicons-check-circle' })
}
</script>

<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardSection
      description="Tùy chỉnh giao diện của bảng điều khiển của bạn."
      title="Theme"
    >
      <template #links>
        <UColorModeSelect color="gray" />
      </template>
    </UDashboardSection>

    <UDivider class="mb-4" />

    <UForm
      :state="state"
      :validate="validate"
      :validate-on="['submit']"
      @submit="onSubmit"
    >
      <UDashboardSection
        description="Thông tin này sẽ được hiển thị công khai vì vậy hãy cẩn thận với những gì bạn chia sẻ."
        title="Hồ sơ"
      >
        <template #links>
          <UButton
            color="black"
            label="Lưu thay đổi"
            type="submit"
          />
        </template>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2 items-center"
          description="Sẽ xuất hiện trên biên lai, hóa đơn và các thông tin liên lạc khác."
          label="Họ tên"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            autocomplete="off"
            icon="i-heroicons-user"
            size="md"
          />
        </UFormGroup>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2"
          description="Được sử dụng để đăng nhập, nhận email và thông báo."
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            autocomplete="off"
            icon="i-heroicons-envelope"
            size="md"
            type="email"
          />
        </UFormGroup>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2"
          description="Sẽ xuất hiện trên biên lai, hóa đơn và các thông tin liên lạc khác."
          label="Số điện thoại"
          name="phone"
          required
        >
          <UInput
            v-model="state.phone"
            autocomplete="off"
            icon="i-heroicons-phone"
            size="md"
            type="phone"
          />
        </UFormGroup>

        <UFormGroup
          :ui="{ container: 'flex flex-wrap items-center gap-3', help: 'mt-0' }"
          class="grid grid-cols-2 gap-2"
          help="JPG, GIF or PNG. 1MB Max."
          label="Avatar"
          name="avatar"
        >
          <UAvatar
            :alt="state.name"
            :src="state.avatar"
            size="lg"
          />

          <UButton
            color="white"
            label="Choose"
            size="md"
            @click="onFileClick"
          />

          <input
            ref="fileRef"
            accept=".jpg, .jpeg, .png, .gif"
            class="hidden"
            type="file"
            @change="onFileChange"
          >
        </UFormGroup>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2"
          description="Mô tả ngắn gọn cho hồ sơ của bạn. Có thể gắn URL."
          label="Bio"
          name="bio"
        >
          <UTextarea
            v-model="state.bio"
            :rows="5"
            autoresize
            size="md"
          />
        </UFormGroup>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2"
          description="Xác nhận mật khẩu hiện tại của bạn trước khi đặt mật khẩu mới."
          label="Mật khẩu"
          name="password"
        >
          <UInput
            id="password"
            v-model="state.password_current"
            placeholder="Mật khẩu hiện tại"
            size="md"
            type="password"
          />
          <UInput
            id="password_new"
            v-model="state.password_new"
            class="mt-2"
            placeholder="Mật khẩu mới"
            size="md"
            type="password"
          />
        </UFormGroup>
      </UDashboardSection>
    </UForm>

    <UDivider class="mb-4" />

    <UDashboardSection
      description="Bạn không muốn sử dụng dịch vụ của chúng tôi nữa? Bạn có thể xóa tài khoản của mình tại đây. Hành động này là không thể đảo ngược. Mọi thông tin liên quan đến tài khoản này sẽ bị xóa vĩnh viễn."
      title="Tài khoản"
    >
      <div>
        <UButton
          color="red"
          label="Xoá tài khoản"
          size="md"
          @click="isDeleteAccountModalOpen = true"
        />
      </div>
    </UDashboardSection>

    <!-- ~/components/settings/DeleteAccountModal.vue -->
    <SettingsDeleteAccountModal v-model="isDeleteAccountModalOpen" />
  </UDashboardPanelContent>
</template>
