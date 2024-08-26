<script lang="ts" setup>
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'New mail',
  icon: 'i-heroicons-paper-airplane',
  to: '/inbox'
}, {
  label: 'New user',
  icon: 'i-heroicons-user-plus',
  to: '/users'
}]]

const range = ref<Range>({ start: sub(new Date(), { days: 14 }), end: new Date() })
const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Home">
        <template #right>
          <UTooltip
            :shortcuts="['N']"
            text="Notifications"
          >
            <UButton
              color="gray"
              square
              variant="ghost"
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                color="red"
                inset
              >
                <UIcon
                  class="w-5 h-5"
                  name="i-heroicons-bell"
                />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdown :items="items">
            <UButton
              class="ml-1.5 rounded-full"
              icon="i-heroicons-plus"
              size="md"
            />
          </UDropdown>
        </template>
      </UDashboardNavbar>

      <!--      <UDashboardToolbar> -->
      <!--        <template #left> -->
      <!--          &lt;!&ndash; ~/components/home/HomeDateRangePicker.vue &ndash;&gt; -->
      <!--          <HomeDateRangePicker -->
      <!--            v-model="range" -->
      <!--            class="-ml-2.5" -->
      <!--          /> -->

      <!--          &lt;!&ndash; ~/components/home/HomePeriodSelect.vue &ndash;&gt; -->
      <!--          <HomePeriodSelect -->
      <!--            v-model="period" -->
      <!--            :range="range" -->
      <!--          /> -->
      <!--        </template> -->
      <!--      </UDashboardToolbar> -->

      <!--      <UDashboardPanelContent> -->
      <!--        &lt;!&ndash; ~/components/home/HomeChart.vue &ndash;&gt; -->
      <!--        <HomeChart -->
      <!--          :period="period" -->
      <!--          :range="range" -->
      <!--        /> -->

      <!--        <div class="grid lg:grid-cols-2 lg:items-start gap-8 mt-8"> -->
      <!--          &lt;!&ndash; ~/components/home/HomeSales.vue &ndash;&gt; -->
      <!--          <HomeSales /> -->
      <!--          &lt;!&ndash; ~/components/home/HomeCountries.vue &ndash;&gt; -->
      <!--          <HomeCountries /> -->
      <!--        </div> -->
      <!--      </UDashboardPanelContent> -->
    </UDashboardPanel>
  </UDashboardPage>
</template>
