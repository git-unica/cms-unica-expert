<script lang="ts" setup>
const { isHelpSlideoverOpen } = useDashboard()
const { isDashboardSearchModalOpen } = useUIState()
const { metaSymbol } = useShortcuts()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const items = computed(() => [
  [{
    slot: 'account',
    label: '',
    disabled: true
  }], [{
    label: 'Settings',
    icon: 'i-heroicons-cog-8-tooth',
    to: '/settings'
  }, {
    label: 'Command menu',
    icon: 'i-heroicons-command-line',
    shortcuts: [metaSymbol.value, 'K'],
    click: () => {
      isDashboardSearchModalOpen.value = true
    }
  }, {
    label: 'Trợ giúp',
    icon: 'i-heroicons-question-mark-circle',
    shortcuts: ['?'],
    click: () => isHelpSlideoverOpen.value = true
  }], [{
    label: 'Tài liệu',
    icon: 'i-heroicons-book-open',
    to: 'https://ui.nuxt.com/pro/getting-started',
    target: '_blank'
  }, {
    label: 'GitHub repository',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/nuxt-ui-pro/dashboard',
    target: '_blank'
  }], [{
    label: 'Đăng xuất',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: () => {
      authStore.logout()
      navigateTo('/login')
    }
  }]
])
</script>

<template>
  <UDropdown
    :items="items"
    :popper="{ strategy: 'absolute', placement: 'top' }"
    :ui="{ width: 'w-full', item: { disabled: 'cursor-text select-text' } }"
    class="w-full"
    mode="hover"
  >
    <template #default="{ open }">
      <UButton
        :class="[open && 'bg-gray-50 dark:bg-gray-800']"
        :label="user.full_name"
        class="w-full"
        color="gray"
        variant="ghost"
      >
        <template #leading>
          <UAvatar
            :src="user.avatar"
            size="2xs"
          />
        </template>

        <template #trailing>
          <UIcon
            class="w-5 h-5 ml-auto"
            name="i-heroicons-ellipsis-vertical"
          />
        </template>
      </UButton>
    </template>

    <template #account>
      <div class="text-left">
        <p class="truncate font-medium text-gray-900 dark:text-white">
          {{ user.full_name }}
        </p>
      </div>
    </template>
  </UDropdown>
</template>
