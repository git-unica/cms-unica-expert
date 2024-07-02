<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'

const emit = defineEmits(['close'])

const state = reactive({
  name: undefined,
  email: undefined
})

// https://ui.nuxt.com/components/form
const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.name) errors.push({ path: 'name', message: 'Please enter a name.' })
  if (!state.email) errors.push({ path: 'email', message: 'Please enter an email.' })
  return errors
}

async function onSubmit(event: FormSubmitEvent<any>) {
  // Do something with data
  console.log(event.data)

  emit('close')
}
</script>

<template>
  <UForm
    :state="state"
    :validate="validate"
    :validate-on="['submit']"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormGroup
      label="Name"
      name="name"
    >
      <UInput
        v-model="state.name"
        autofocus
        placeholder="John Doe"
      />
    </UFormGroup>

    <UFormGroup
      label="Email"
      name="email"
    >
      <UInput
        v-model="state.email"
        placeholder="john.doe@example.com"
        type="email"
      />
    </UFormGroup>

    <div class="flex justify-end gap-3">
      <UButton
        color="gray"
        label="Cancel"
        variant="ghost"
        @click="emit('close')"
      />
      <UButton
        color="black"
        label="Save"
        type="submit"
      />
    </div>
  </UForm>
</template>
