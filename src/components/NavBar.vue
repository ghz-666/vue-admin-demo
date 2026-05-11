<template>
  <div class="nav-bar">
    <div class="flex-box1">
      <el-button circle class="collapse-btn" @click="handleCollapse">
        <el-icon>
          <Expand />
        </el-icon>
      </el-button>
      <div class="title-group">
        <p class="page-title">后台工作台</p>
        <p class="page-subtitle">欢迎回来，今天也顺利推进</p>
      </div>
    </div>

    <div class="flex-box2">
      <el-avatar :size="38" :src="userImage" class="user-avatar" />
      <el-dropdown trigger="click" class="user-dropdown">
        <span class="el-dropdown-link">
          {{ username }}
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Expand } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import userImage from '../assets/images/user.jpg'
import useAdminStore from '../stores/admin.js'

const router = useRouter()
const username = computed(() => {
  const userInfo = localStorage.getItem('userInfo')

  if (!userInfo) {
    return 'admin'
  }

  try {
    const user = JSON.parse(userInfo)
    return user.username || user.nickName || user.name || 'admin'
  } catch {
    return 'admin'
  }
})

function handleCollapse() {
  useAdminStore().toggleCollapse()
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  ElMessage.success('已退出登录')
  router.replace('/auth/login')
}
</script>

<style scoped>
.nav-bar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e8edf5;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.flex-box1 {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-group {
  line-height: 1.2;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.collapse-btn {
  color: #334155;
  border-color: #e2e8f0;
}

.flex-box2 {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  border: 2px solid #f1f5f9;
}

.user-dropdown {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.el-dropdown-link:hover {
  background-color: #f1f5f9;
}
</style>
