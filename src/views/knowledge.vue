<template>
  <div class="knowledge-page">
    <PageHead title="知识清单" desc="在这里管理你的知识内容">
      <template #buttons>
        <el-button @click="handleEdit({})" type="primary">新增</el-button>
      </template>
    </PageHead>
    <div class="content-card">
      <TableSearch :formItem="formItem" @search="handleSearch" />
      <el-table :data="tableData" style="width: 100%; margin-top: 25px;">
        <el-table-column label="标题" width="200" fixed="left">
          <template #default="scope">
            <div style="display: flex; align-items: center;">
              <el-icon>
                <timer />
              </el-icon>
              {{ scope.row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center;">
              <el-icon>
                <timer />
              </el-icon>
              {{ categoryMap[scope.row.categoryId] }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="150" />
        <el-table-column prop="readCount" label="阅读量" width="150" />
        <el-table-column prop="createdAt" label="发布时间" width="150" />
        <el-table-column label="操作" width="240">
          <template #default="scope">
            <el-button @click="handleEdit(scope.row)" text type="primary">编辑</el-button>
            <el-button @click="handlePublish(scope.row)" v-if="scope.row.status === 0 || scope.row.status === 2" text type="success">已发布</el-button>
            <el-button @click="handleUnpublish(scope.row)" v-if="scope.row.status === 1" text type="warning">已下线</el-button>
            <el-button @click="handleDelete(scope.row)" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination layout="prev, pager, next" :total="pagination.total" :page-size="pagination.size"
        @change="handleChange" />
      <ArticleDialog :currentArticle="currentArticle" v-model:modelValue="dialogVisible" :categories="categories"
        @submit="handleSearch" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHead from '../components/pagehead.vue'
import TableSearch from '../components/tablesearch.vue'
import { categoryTree, articlePage } from '../api/admin'
import { onMounted, reactive, ref } from 'vue'
import ArticleDialog from '../components/ArticleDialog.vue'
import { getarticleDetail } from '../api/admin'
import { ElMessage } from 'element-plus'
import {ElMessageBox} from 'element-plus'
import { deleteArticle, changeArticleStatus } from '../api/admin'
const dialogVisible = ref(false)
const tableData = ref([])
const formItem = [
  { comp: 'input', prop: 'title', label: '标题', placeholder: '请输入标题' },
  { comp: 'select', prop: 'category', label: '分类', placeholder: '请选择分类' },
  {
    comp: 'select', prop: 'status', label: '状态', placeholder: '请选择状态', options: [
      { label: '草稿', value: 0 },
      { label: '已发布', value: 1 },
      { label: '已下线', value: 2 }
    ]
  },
]
const pagination = reactive({
  total: 0,
  size: 10,
  currentPage: 1
})
const handleChange = (page: number) => {
  pagination.currentPage = page
  handleSearch()
}
const handleSearch = async (formData:  any = {}) => {
  const params = {
    ...pagination,
    ...formData,
  }
  
  const { records, total } = await articlePage(params)
  tableData.value = records
  pagination.total = total
}

const categoryMap = reactive({})
const categories = ref([])
onMounted(async () => {
  const data = await categoryTree()

  // 遍历处理
  categories.value = data.map(item => {
    // 1. 做映射
    categoryMap[item.id] = item.categoryName
    // 2. 返回下拉需要的对象
    return {
      label: item.categoryName,
      value: item.id
    }
  })
  formItem[1].options = categories.value
  handleSearch()
})
const currentArticle = ref({})
const handleEdit = async (row: any) => {
  if (!row.id) {
    currentArticle.value = {}
    dialogVisible.value = true
  }
  else {
    const data = await getarticleDetail(row.id)
    currentArticle.value = data
    dialogVisible.value = true
  }
}
const handlePublish = async (row: any) => {
  ElMessageBox.confirm('确认发布吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    await changeArticleStatus(row.id, { status: 1 })
    ElMessage.success('发布成功')
    handleSearch()
  })
  
}
const handleUnpublish = async (row: any) => {  
  ElMessageBox.confirm('确认下线吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await changeArticleStatus(row.id, { status: 2 })
    ElMessage.success('下线成功')
    handleSearch()
  })
  
}
const handleDelete = async (row: any) => {
  ElMessageBox.confirm('确认删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(async () => {
    await deleteArticle(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  })
  
}
</script>
<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.content-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e7edf6;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
}
</style>
