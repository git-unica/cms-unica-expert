<script lang="ts" setup>
const links = [[{
  label: 'Chung',
  icon: 'i-heroicons-user-circle',
  to: '/settings',
  exact: true
}, {
  label: 'Nhân viên',
  icon: 'i-heroicons-user-group',
  to: '/settings/members'
}
// {
//   label: 'Notifications',
//   icon: 'i-heroicons-bell',
//   to: '/settings/notifications'
// }
], [{
  label: 'Tài liệu',
  icon: 'i-heroicons-book-open',
  to: 'https://ui.nuxt.com/pro',
  target: '_blank'
}]]
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Settings" />

      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <UHorizontalNavigation :links="links" />
      </UDashboardToolbar>

      <NuxtPage />
    </UDashboardPanel>
  </UDashboardPage>
</template>
