import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
  const newNotificationCount = ref(0)
  const getCountNewNotification = async () => {
    const res = await $fetch.raw('/api/v1/notification/new-count-cms', {
      query: {},
      headers: useRequestHeaders(['cookie'])
    })
    newNotificationCount.value = Number(res._data)
  }

  const setNewNotificationRemove = async () => {
    const res = await $fetch.raw('/api/v1/notification/new-remove-cms', {
      method: 'PATCH',
      headers: useRequestHeaders(['cookie'])
    })
    if (res.ok) {
      newNotificationCount.value = 0
    }
  }
  return {
    newNotificationCount,
    getCountNewNotification,
    setNewNotificationRemove
  }
})
