<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { User } from '~/types'

const toast = useToast()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { accessToken, user } = storeToRefs(authStore)
const fileRef = ref<HTMLInputElement>()
const isDeleteAccountModalOpen = ref(false)
const avatar = ref()
const objectAvatar = ref()
const password = ref()
const rePassword = ref()
const phone = ref()
const errorPhone = ref()

function validate(state: User): FormError[] {
  const errors = []
  if (!state.full_name)
    errors.push({ path: 'name', message: 'Vui lòng nhập họ tên.' })
  if (!state.email)
    errors.push({ path: 'email', message: 'Vui lòng nhập email.' })
  if (password.value || rePassword.value) {
    if (password.value !== rePassword.value)
      errors.push({ path: 'password', message: 'Mật khẩu không khớp nhau' })
  }
  return errors
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  objectAvatar.value = URL.createObjectURL(input.files[0])
  avatar.value = input.files[0]
}

function onFileClick() {
  fileRef.value?.click()
}

async function onSubmit(event: FormSubmitEvent<User>) {
  if (errorPhone.value) return

  const formData = new FormData()
  Object.keys(
    reactivePick(event.data, 'email', 'full_name', 'bio')
  ).forEach((key) => {
    formData.append(key, event.data[key])
  })

  if (phone.value) formData.append('phone', phone.value)
  if (avatar.value) formData.append('avatar', avatar.value)

  await $fetch(`/api/v1/users/me`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken.value}`
    },
    onResponse({ response }) {
      if (response.ok) {
        toast.add({
          title: 'Đã cập nhật hồ sơ',
          icon: 'i-heroicons-check-circle',
          color: 'green'
        })
      } else {
        toast.add({ title: 'Cập nhật hồ sơ thất bại', color: 'red' })
      }
    }
  })
}

const onChangePhone = (number: string, phoneObject: { valid: boolean, number: string }) => {
  if (phoneObject.valid) {
    phone.value = phoneObject.number
    errorPhone.value = undefined
  } else {
    phone.value = undefined
    errorPhone.value = 'Số điện thoại không hợp lệ'
  }
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
      :state="user"
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
            v-model="user.full_name"
            autocomplete="off"
            icon="i-heroicons-user"
            required
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
            v-model="user.email"
            icon="i-heroicons-envelope"
            required
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
          <ClientOnly>
            <TelInput
              v-model="user.phone"
              :preferred-countries="['vn']"
              :valid-characters-only="true"
              required
              @on-input="onChangePhone"
            />
            <small
              v-if="errorPhone"
              class="text-red-500"
              v-text="errorPhone"
            />
          </ClientOnly>
        </UFormGroup>

        <UFormGroup
          :ui="{ container: 'flex flex-wrap items-center gap-3', help: 'mt-0' }"
          class="grid grid-cols-2 gap-2"
          help="JPG, GIF or PNG. 1MB Max."
          label="Avatar"
          name="avatar"
        >
          <UAvatar
            :alt="user.full_name"
            :src="objectAvatar ?? user.avatar"
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
            v-model="user.bio"
            :rows="5"
            autoresize
            size="md"
          />
        </UFormGroup>

        <UFormGroup
          :ui="{ container: '' }"
          class="grid grid-cols-2 gap-2"
          description="Chỉ nhập khi cần thay đổi mật khẩu."
          label="Mật khẩu"
          name="password"
        >
          <UInput
            id="password"
            v-model="password"
            placeholder="Mật khẩu mới"
            size="md"
            type="password"
          />
          <UInput
            id="rePassword"
            v-model="rePassword"
            class="mt-2"
            placeholder="Nhập lại mật khẩu mới"
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

    <SettingsDeleteAccountModal v-model="isDeleteAccountModalOpen" />
  </UDashboardPanelContent>
</template>
