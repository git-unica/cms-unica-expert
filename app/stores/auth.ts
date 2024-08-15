import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const accessToken = useCookie('accessToken', {
    domain: config.public.domain,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : false,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  })
  const refreshToken = useCookie('refreshToken', {
    domain: config.public.domain,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : false,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30
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

  const logout = async () => {
    await $fetch('/v1/auth/logout', {
      baseURL: config.public.apiUrl,
      credentials: 'include'
    })

    accessToken.value = undefined
    user.value = undefined
    refreshToken.value = undefined
  }

  async function getUserInfo() {
    try {
      user.value = await $fetch<User>('/v1/users/me', {
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
      'user'
    ],
    storage: persistedState.cookiesWithOptions({
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : false,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24
    })
  }
})
