<script lang="ts" setup>
import type { IResponsePagination, IUserNotification } from '~/types'
import { NotificationTypeEnum } from '~/enums/notification-type.enum'

const notificationStore = useNotificationStore()
const { newNotificationCount } = storeToRefs(notificationStore)

const contentNotification = ref(null)
const dayjs = useDayjs()
const { isNotificationsSlideoverOpen } = useDashboard()
const page = ref(1)
const limit = ref(12)
const userNotifications = ref<IUserNotification[]>([])
const {
  data: userNotificationPaginate,
  status: userNotificationStatus
} = await useFetch<IResponsePagination<IUserNotification>>('/api/v1/notification/cms', {
  headers: useRequestHeaders(['cookie']),
  watch: [page],
  query: {
    page: page,
    limit: limit
  },
  server: false,
  lazy: true,
  onResponse({ response }) {
    if (response._data.data) {
      userNotifications.value.push(...response._data.data)
      setTimeout(() => {
        if (page.value >= 2) {
          contentNotification.value.closest('.overflow-y-auto').scroll({
            top: contentNotification.value.closest('.overflow-y-auto').scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 500)
    }
  }
})

const backLinkNotification = async (data: IUserNotification) => {
  if (isUndefined(data?.read_at)) {
    await $fetch(`/api/v1/notification/read/${data._id}`, {
      method: 'GET',
      headers: useRequestHeaders(['cookie']),
      async onResponse() {
        const index = userNotifications.value.findIndex(item => item._id == data._id)
        const userNotification = userNotifications.value[index]
        userNotification.read_at = dayjs().toISOString()
      }
    })
  }
  if (data.notification?.type === NotificationTypeEnum.NewOrderForAdmin || data.notification?.type === NotificationTypeEnum.SalesApprovesOrders) {
    return navigateTo('/order/software/' + data.notification?.metadata.order_code)
  }
}
watch(isNotificationsSlideoverOpen, async (newValue) => {
  if (newValue && newNotificationCount.value > 0) {
    await notificationStore.setNewNotificationRemove()
  }
})
</script>

<template>
  <UDashboardSlideover
    v-model="isNotificationsSlideoverOpen"
    title="Thông báo"
  >
    <div ref="contentNotification">
      <div
        v-for="notificationUser in userNotifications"
        :key="notificationUser._id"
        class="p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex items-center gap-3 relative"
        @click="backLinkNotification(notificationUser)"
      >
        <UChip
          :show="isUndefined(notificationUser.read_at)"
          color="red"
          inset
        >
          <UAvatar
            :alt="notificationUser.notification.creator.full_name"
            :src="notificationUser.notification.metadata.avatar"
            class="object-cover"
            size="md"
          />
        </UChip>
        <div class="text-sm flex-1">
          <div
            class="text-gray-500 dark:text-gray-400"
            v-html="notificationUser.notification.content"
          />
          <p class="flex items-center justify-between">
            {{ dayjs(notificationUser?.created_at).fromNow().toString() }}
          </p>
        </div>
      </div>
      <div
        v-if="page < userNotificationPaginate?.meta.pageCount"
        class="flex justify-center items-center"
      >
        <u-button
          :loading="userNotificationStatus=='pending'"
          @click="page++"
        >
          Xem thêm
        </u-button>
      </div>
    </div>
  </UDashboardSlideover>
</template>
