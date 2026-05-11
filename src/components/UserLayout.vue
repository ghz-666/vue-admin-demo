<template>
  <div class="user-layout">
    <header class="user-header">
      <div class="brand">
        <el-image :src="robotImage" class="brand-logo" fit="contain" />
        <div>
          <h1>心理健康助手</h1>
          <p>用户端</p>
        </div>
      </div>

      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        class="user-menu"
        :ellipsis="false"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="`/user/${item.path}`">
          <el-icon>
            <component :is="item.meta.icon" />
          </el-icon>
          <span>{{ item.meta.title }}</span>
        </el-menu-item>
      </el-menu>

      <el-dropdown trigger="click">
        <button class="user-entry">
          <el-avatar :size="34" :src="userImage" />
          <span>{{ username }}</span>
          <el-icon>
            <ArrowDown />
          </el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="user-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import robotImage from '@/assets/images/机器人.png'
import userImage from '@/assets/images/user.jpg'

const route = useRoute()
const router = useRouter()

const menuItems = computed(() => {
  return router.options.routes.find((item) => item.path === '/user')?.children || []
})

const username = computed(() => {
  const raw = localStorage.getItem('userInfo')

  if (!raw) return '用户'

  try {
    const user = JSON.parse(raw)
    return user.nickname || user.nickName || user.username || '用户'
  } catch {
    return '用户'
  }
})

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  ElMessage.success('已退出登录')
  router.replace('/auth/login')
}
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f7fbff 0%, #f3f7f4 100%);
}

.user-header {
  height: 68px;
  display: grid;
  grid-template-columns: minmax(210px, 280px) 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  border: 1px solid #e4ecf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-logo {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.brand h1 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.brand p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.user-menu {
  min-width: 0;
  border-bottom: 0;
}

.user-menu :deep(.el-menu-item) {
  height: 46px;
  border-radius: 10px;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

.user-main {
  height: calc(100vh - 100px);
  margin-top: 16px;
  overflow: hidden;
}

@media (max-width: 900px) {
  .user-layout {
    padding: 10px;
  }

  .user-header {
    height: auto;
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .user-main {
    height: auto;
    min-height: calc(100vh - 180px);
    overflow: visible;
  }
}
</style>
