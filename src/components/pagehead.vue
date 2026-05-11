<template>
  <div class="page-head">
    <div>
      <p class="page-title">{{ props.title }}</p>
      <p class="page-desc">{{ props.desc }}</p>
    </div>
    <div class="action-btn">
      <slot name="buttons"></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '页面标题'
  },
  desc: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e7edf6;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.page-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.action-btn :deep(.el-button) {
  border-radius: 8px;
}
</style>
