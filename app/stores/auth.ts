import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const { clear, session } = useNestSession()
  const user = ref(session.value?.user)
  const isLogin = computed(() => session.value?.isAuthenticated || false)

  const setUserInfo = (userInfo?: User) => {
    user.value = userInfo
  }

  const logout = async () => {
    user.value = undefined

    await clear()
  }

  return {
    setUserInfo,
    user,
    isLogin,
    logout
  }
})
