<template>
  <div class="backend-layout">
    <el-container class="main-container">
      <Sidebar />
      <el-container>
        <el-header class="header-container">
          <NavBar />
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import NavBar from './NavBar.vue'
</script>

<style scoped lang="scss">
.backend-layout {
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;

  .main-container {
    height: 100%;
    gap: 16px;
  }

  .header-container {
    height: 64px;
    background-color: transparent;
    padding: 0;
    margin-bottom: 16px;
  }

  .main-content {
    height: calc(100% - 80px);
    padding: 0;
    background-color: transparent;
    overflow: auto;
  }
}
</style>
