<template>
  <el-aside :width="isCollapsed ? '64px' : '264px'" class="sidebar-wrap">
    <div class="brand" :class="{ collapsed: isCollapsed }">
      <el-image :src="robotImage" alt="logo" class="brand-logo" />
      <div class="info-card" v-show="!isCollapsed">
        <h1 class="brand-title">心理健康助手</h1>
        <p class="brand-subtitle">管理后台</p>
      </div>
    </div>

    <el-menu
      :collapse="isCollapsed"
      :collapse-transition="false"
      :default-active="route.path"
      class="sidebar-menu"
      :router="true"
    >
      <el-menu-item
        v-for="item in menuItems"
        :key="item.path" 
        :index="item.path.startsWith('/') ? item.path : `/back/${item.path}`"
      >
        <el-icon><component :is="item.meta.icon"/></el-icon>
        <span>{{ item.meta.title }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import robotImage from '../assets/images/机器人.png'
import useAdminStore from '../stores/admin.js'
const adminStore = useAdminStore()
const isCollapsed = computed(() => adminStore.isCollapsed)
const route = useRoute()
const router = useRouter()
const menuItems=computed(
  ()=>{const backroute=router.options.routes.find((r) => r.path === '/back')
  return backroute?.children || []
}
)
</script>

<style scoped lang="scss">
.sidebar-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 78px;
  padding: 18px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f5f9ff, #edf4ff);
  border-bottom: 1px solid #e6ecf7;
}

.brand.collapsed {
  justify-content: center;
  padding: 16px 0;
}

.brand-logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  flex-shrink: 0;
}

.brand.collapsed .brand-logo {
  margin-right: 0;
}

.info-card {
  min-width: 0;
}

.brand-title {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.brand-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.sidebar-menu {
  flex: 1;
  min-height: 0;
  border-right: 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 8px 10px;
  border-radius: 10px;
  color: #475569;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #eef4ff;
  color: #2563eb;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #e8f0ff, #f2f7ff);
  color: #1d4ed8;
  font-weight: 600;
}

.sidebar-menu :deep(.el-menu--collapse .el-menu-item) {
  width: calc(100% - 16px);
  margin: 8px;
  padding: 0 !important;
  justify-content: center;
}
</style>
