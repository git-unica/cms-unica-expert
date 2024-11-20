<script lang="ts" setup>
import { ERole } from '~/enums/role.enum'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const leftLinks = [
  {
    label: 'Chung',
    icon: 'i-heroicons-user-circle',
    to: '/settings',
    exact: true
  }, {
    label: 'Nhân viên',
    icon: 'i-heroicons-user-group',
    to: '/settings/members',
    roles: [ERole.Admin]
  }
// {
//   label: 'Notifications',
//   icon: 'i-heroicons-bell',
//   to: '/settings/notifications'
// }
]

const rightLinks = [{
  label: 'Tài liệu',
  icon: 'i-heroicons-book-open',
  to: 'https://ui.nuxt.com/pro',
  target: '_blank'
}]

const links = [getAccessibleMenus(leftLinks, user.value?.roles), getAccessibleMenus(rightLinks, user.value?.roles)]

function getAccessibleMenus(links, userRoles) {
  return links
    .map((menu) => {
      const hasAccess
        = !menu.roles || menu.roles.some(role => userRoles.includes(role))

      if (hasAccess) {
        return menu
      }

      return null
    })
    .filter(menu => menu !== null)
}
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
