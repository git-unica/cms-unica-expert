<script lang="ts" setup>
import { ERole } from '~/enums/role.enum'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const links = [[{
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
], [{
  label: 'Tài liệu',
  icon: 'i-heroicons-book-open',
  to: 'https://ui.nuxt.com/pro',
  target: '_blank'
}]]

function getAccessibleMenus(links, userRoles) {
  return links
    .map((menu) => {
      // Kiểm tra nếu menu không có roles hoặc user có quyền truy cập
      const hasAccess
        = !menu.roles || menu.roles.some(role => userRoles.includes(role))

      // Kiểm tra children (nếu có)
      let accessibleChildren = []
      if (menu.children) {
        accessibleChildren = menu.children.filter(child =>
          !child.roles || child.roles.some(role => userRoles.includes(role))
        )
      }

      // Chỉ trả menu nếu user có quyền hoặc có children hợp lệ
      if (hasAccess || accessibleChildren.length > 0) {
        return {
          ...menu,
          children: accessibleChildren.length > 0 ? accessibleChildren : undefined
        }
      }

      // Loại bỏ menu nếu không có quyền
      return null
    })
    .filter(menu => menu !== null) // Loại bỏ các menu null
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Settings" />

      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <UHorizontalNavigation :links="getAccessibleMenus(links, user.roles)" />
      </UDashboardToolbar>

      <NuxtPage />
    </UDashboardPanel>
  </UDashboardPage>
</template>
