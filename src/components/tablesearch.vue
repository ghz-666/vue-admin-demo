<template>
  <div class="table-search-container">
    <el-form :model="formData" class="search-form" label-width="auto">
      <el-row :gutter="16" class="search-row">
        <el-col v-for="item in formItem" :key="item.prop" :xs="24" :sm="12" :md="8" :lg="7" :xl="6" class="field-col">
          <el-form-item :label="item.label" :prop="item.prop" class="form-item">
            <component v-model="formData[item.prop]" :is="iscomp(item.comp)" :placeholder="item.placeholder"
              class="form-control">
              <template v-if="item.comp === 'select'">
                <el-option label="全部" value="" />
                <el-option v-for="option in item.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </template>
            </component>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="8" :lg="10" :xl="12" class="button-col">
          <div class="button-group action-right">
            <el-button style="margin-top: 10px;" type="primary" @click="search" class="search-btn">搜索</el-button>
            <el-button style="margin-top: 10px;" @click="reset" class="reset-btn">重置</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
const props = defineProps({
  formItem: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['search'])
const formData = reactive({})

const iscomp = (comp) => {
  if (comp === 'input') return 'el-input'
  if (comp === 'select') return 'el-select'
}
watch(formData, (newVal) => {
  console.log(newVal) 
}, { deep: true })

const reset = () => {
  Object.keys(formData).forEach((key) => {
    formData[key] = ''
  })
}

const search = () => {
  emit('search', formData)
}


</script>

<style lang="scss" scoped>
.table-search-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e7edf6;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.search-form {
  width: 100%;
}

.search-row {
  align-items: flex-end;
}

.form-item {
  margin-bottom: 0;

  :deep(.el-form-item__label) {
    font-size: 14px;
    color: #475569;
    font-weight: 500;
  }
}

.field-col {
  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.form-control {
  width: 100%;
}

.button-col {
  display: flex;
  align-items: flex-end;
}

.button-group {
  display: flex;
  gap: 10px;
}

.action-right {
  margin-left: auto;
  justify-content: flex-end;
}

.search-btn,
.reset-btn {
  min-width: 88px;
  height: 36px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 991px) {
  .button-col {
    margin-top: 8px;
  }

  .action-right {
    margin-left: 0;
  }
}

@media (max-width: 767px) {
  .button-group {
    width: 100%;
  }

  .button-group .el-button {
    flex: 1;
  }
}
</style>
