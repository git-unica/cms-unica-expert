import { defineStore } from 'pinia'
import type { Ref } from 'vue'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const accessToken: Ref<string | undefined> = ref()
  const refreshToken = useCookie('refreshToken', {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 1 month
  })

  const user = ref<User | undefined>()

  const isLogin = computed(() => !!user.value && !!accessToken.value)

  const setAccessToken = (token?: string) => {
    accessToken.value = token
  }

  const setUserInfo = (userInfo: User) => {
    user.value = userInfo
  }

  const setRefreshToken = (token?: string) => {
    refreshToken.value = token
  }

  const logout = () => {
    accessToken.value = undefined
    user.value = undefined
    refreshToken.value = undefined
  }

  async function getUserInfo() {
    try {
      user.value = await $fetch<User>('/v1/users/me', {
        method: 'GET',
        query: {
          v: Date.now()
        },
        baseURL: config.public.apiUrl,
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
    setUserInfo,
    user,
    isLogin,
    logout,
    getUserInfo
  }
}, {
  persist: {
    paths: [
      'accessToken', 'user'
    ],
    storage: persistedState.cookiesWithOptions({
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 0.5) // half day
    })
  }
})
