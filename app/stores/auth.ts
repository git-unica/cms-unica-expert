import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const { clear, session } = useNestSession()
  const user = ref<User>()
  const userId = ref(session.value?.userId)
  const isLogin = computed(() => session.value?.isAuthenticated || false)

  const setUserInfo = (userInfo?: User) => {
    user.value = userInfo
  }

  const logout = async () => {
    user.value = undefined

    await clear()
  }

  async function getUserInfo() {
    try {
      user.value = await $fetch<User>('/api/v1/users/me', {
        headers: useRequestHeaders(['cookie'])
      })
    } catch (e) {
      console.log(e)
    }
  }

  return {
    getUserInfo,
    setUserInfo,
    user,
    userId,
    isLogin,
    logout
  }
})
