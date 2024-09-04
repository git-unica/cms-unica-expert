import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor } from 'ckeditor5'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('ckeditor', Ckeditor)
  return {
    provide: {
      ckeditor: {
        classicEditor: ClassicEditor
      }
    }
  }
})
