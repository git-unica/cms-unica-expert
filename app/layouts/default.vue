<script lang="ts" setup>
// const appConfig = useAppConfig()
import { ERole } from '~/enums/role.enum'

const { isHelpSlideoverOpen } = useDashboard()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const links = [{
  id: 'home',
  label: 'Home',
  icon: 'i-heroicons-home',
  to: '/',
  tooltip: {
    text: 'Home',
    shortcuts: ['G', 'H']
  }
}, {
  id: 'users',
  label: 'Thành viên',
  icon: 'i-heroicons-user-group',
  to: '/users',
  tooltip: {
    text: 'Thành viên',
    shortcuts: ['G', 'U']
  }
},
{
  id: 'communities',
  label: 'Cộng đồng',
  icon: 'i-heroicons-rectangle-group',
  to: '/communities',
  tooltip: {
    text: 'Cộng đồng',
    shortcuts: ['G', 'C']
  }
}, {
  id: 'topic',
  label: 'Chủ đề',
  icon: 'i-heroicons-rectangle-group',
  to: '/topic',
  roles: [ERole.Admin, ERole.Support],
  tooltip: {
    text: 'Chủ đề',
    shortcuts: ['G', 'T']
  }
},
{
  id: 'post',
  label: 'Bài viết',
  icon: 'i-heroicons-newspaper',
  to: '/post',
  roles: [ERole.Admin, ERole.Marketing],
  tooltip: {
    text: 'Bài viết',
    shortcuts: ['G', 'P']
  }
},
{
  id: 'level',
  label: 'Cấp độ thành viên',
  icon: 'i-heroicons-rectangle-stack',
  to: '/level',
  roles: [ERole.Admin, ERole.Support],
  tooltip: {
    text: 'Cấp độ thành viên',
    shortcuts: ['G', 'L']
  }
}, {
  id: 'order',
  label: 'Đơn hàng',
  to: '/order',
  icon: 'i-heroicons-clipboard-document-list',
  children: [{
    label: 'Phần mềm',
    to: '/order/software-order',
    roles: [ERole.Admin, ERole.Support, ERole.Sale, ERole.Accountant],
    exact: true
  }, {
    label: 'Cộng đồng',
    to: '/order/community-order',
    roles: [ERole.Admin, ERole.Support, ERole.Accountant]
  }],
  tooltip: {
    text: 'Đơn hàng',
    shortcuts: ['G', 'D']
  }
}, {
  id: 'settings',
  label: 'Settings',
  to: '/settings',
  icon: 'i-heroicons-cog-8-tooth',
  children: [{
    label: 'Chung',
    to: '/settings',
    exact: true
  }, {
    label: 'Quản trị viên',
    to: '/settings/members',
    roles: [ERole.Admin]
  }],
  tooltip: {
    text: 'Settings',
    shortcuts: ['G', 'S']
  }
}]

const footerLinks = [{
  label: 'Thêm nhân viên',
  icon: 'i-heroicons-plus',
  to: '/settings/members',
  roles: [ERole.Admin]
}, {
  label: 'Trợ giúp',
  icon: 'i-heroicons-question-mark-circle',
  click: () => isHelpSlideoverOpen.value = true
}]

const groups = [{
  key: 'links',
  label: 'Go to',
  commands: links.map(link => ({ ...link, shortcuts: link.tooltip?.shortcuts }))
}
// {
//   key: 'code',
//   label: 'Code',
//   commands: [{
//     id: 'source',
//     label: 'View page source',
//     icon: 'i-simple-icons-github',
//     click: () => {
//       window.open(`https://github.com/nuxt-ui-pro/dashboard/blob/main/pages${route.path === '/' ? '/index' : route.path}.vue`, '_blank')
//     }
//   }]
// }
]

// const defaultColors = ref(['green', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet'].map(color => ({
//   label: color,
//   chip: color,
//   click: () => appConfig.ui.primary = color
// })))
// const colors = computed(() => defaultColors.value.map(color => ({
//   ...color,
//   active: appConfig.ui.primary === color.label
// })))

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
  <UDashboardLayout>
    <UDashboardPanel
      :resizable="{ min: 200, max: 300 }"
      :width="250"
      collapsible
    >
      <UDashboardNavbar
        :ui="{ left: 'flex-1' }"
        class="!border-transparent"
      >
        <template #left>
          <TeamsDropdown />
        </template>
      </UDashboardNavbar>

      <UDashboardSidebar>
        <template #header>
          <UDashboardSearchButton />
        </template>

        <UDashboardSidebarLinks :links="getAccessibleMenus(links, user.roles)" />

        <!--        <UDivider /> -->

        <!--        <UDashboardSidebarLinks -->
        <!--          :links="[{ label: 'Colors', draggable: true, children: colors }]" -->
        <!--          @update:links="colors => defaultColors = colors" -->
        <!--        /> -->

        <div class="flex-1" />

        <UDashboardSidebarLinks :links="getAccessibleMenus(footerLinks, user.roles)" />

        <UDivider class="sticky bottom-0" />

        <template #footer>
          <!-- ~/components/UserDropdown.vue -->
          <UserDropdown />
        </template>
      </UDashboardSidebar>
    </UDashboardPanel>

    <slot />

    <!-- ~/components/HelpSlideover.vue -->
    <HelpSlideover />
    <!-- ~/components/NotificationsSlideover.vue -->
    <NotificationsSlideover />

    <ClientOnly>
      <LazyUDashboardSearch :groups="groups" />
    </ClientOnly>
  </UDashboardLayout>
</template>
