// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [process.env.NUXT_UI_PRO_PATH || '@nuxt/ui-pro'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    'dayjs-nuxt'
  ],
  runtimeConfig: {
    public: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      apiUrl: process.env.NUXT_API_URL || 'http://localhost:3333',
      domain: process.env.NUXT_DOMAIN || 'localhost'
    }
  },
  ui: {
    icons: ['heroicons', 'simple-icons'],
    safelistColors: ['primary', 'red', 'orange', 'green']
  },
  colorMode: {
    disableTransition: true
  },
  devtools: {
    enabled: true
  },
  typescript: {
    strict: false
  },
  future: {
    compatibilityVersion: 4
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  dayjs: {
    locales: ['vi'],
    plugins: ['relativeTime', 'utc', 'timezone'],
    defaultLocale: 'vi',
    defaultTimezone: 'Asia/Ho_Chi_Minh'
  }
})
