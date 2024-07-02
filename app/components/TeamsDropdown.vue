<script lang="ts" setup>
const teams = [{
  label: 'Unica',
  src: '/favicon.ico'
}]

// const actions = [{
//   label: 'Create team',
//   icon: 'i-heroicons-plus-circle'
// }, {
//   label: 'Manage teams',
//   icon: 'i-heroicons-cog-8-tooth'
// }]

const team = ref(teams[0])
</script>

<template>
  <UDropdown
    v-slot="{ open }"
    :items="[teams]"
    :popper="{ strategy: 'absolute' }"
    :ui="{ width: 'w-full' }"
    class="w-full"
    mode="hover"
  >
    <UButton
      :class="[open && 'bg-gray-50 dark:bg-gray-800']"
      class="w-full"
      color="gray"
      variant="ghost"
    >
      <UAvatar
        :src="team.src"
        size="2xs"
      />

      <span class="truncate text-gray-900 dark:text-white font-semibold">{{ team.label }}</span>
    </UButton>
  </UDropdown>
</template>
