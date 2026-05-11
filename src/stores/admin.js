import { ref } from 'vue'
import { defineStore } from 'pinia'

const useAdminStore = defineStore('admin', () => {
  const isCollapsed = ref(false)

  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
  }
  return {
    isCollapsed,
    toggleCollapse,
  }
})

export default useAdminStore
