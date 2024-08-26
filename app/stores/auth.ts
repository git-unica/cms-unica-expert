import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const { clear } = useNestSession()
  const accessToken = ref<string>()
  const refreshToken = ref<string>()
  const userId = ref<string>()
  const user = ref<User | undefined>()

  const isLogin = computed(() => !!userId.value && !!accessToken.value)

  const setAccessToken = (token?: string) => {
    accessToken.value = token
  }

  const setUserId = (id: string) => {
    userId.value = id
  }

  const setUserInfo = (userInfo: User) => {
    user.value = userInfo
  }

  const setRefreshToken = (token?: string) => {
    refreshToken.value = token
  }

  const logout = async () => {
    accessToken.value = undefined
    userId.value = undefined
    user.value = undefined
    refreshToken.value = undefined

    await clear()
  }

  async function getUserInfo() {
    try {
      user.value = await $fetch<User>('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${accessToken.value}` }
      })
    } catch (e) {
      console.log(e)
    }
  }

  return {
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    setUserId,
    setUserInfo,
    user,
    isLogin,
    logout,
    getUserInfo
  }
})
