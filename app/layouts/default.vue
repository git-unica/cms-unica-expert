<script lang="ts" setup>
// const appConfig = useAppConfig()
const { isHelpSlideoverOpen } = useDashboard()

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
  tooltip: {
    text: 'Cấp độ thành viên',
    shortcuts: ['G', 'L']
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
    to: '/settings/members'
  }],
  tooltip: {
    text: 'Settings',
    shortcuts: ['G', 'S']
  }
}]

const footerLinks = [{
  label: 'Thêm nhân viên',
  icon: 'i-heroicons-plus',
  to: '/settings/members'
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

        <UDashboardSidebarLinks :links="links" />

        <!--        <UDivider /> -->

        <!--        <UDashboardSidebarLinks -->
        <!--          :links="[{ label: 'Colors', draggable: true, children: colors }]" -->
        <!--          @update:links="colors => defaultColors = colors" -->
        <!--        /> -->

        <div class="flex-1" />

        <UDashboardSidebarLinks :links="footerLinks" />

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
