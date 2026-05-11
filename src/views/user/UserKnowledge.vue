<template>
  <div class="knowledge-user-page">
    <section class="knowledge-head">
      <div>
        <h2>心理知识阅读</h2>
        <p>阅读后台发布的心理健康文章，支持按阅读量推荐排序。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadArticles">刷新</el-button>
    </section>

    <section v-loading="loading" class="article-grid">
      <article v-for="article in articles" :key="article.id" class="article-card" @click="openArticle(article)">
        <el-image :src="coverUrl(article.coverImage)" class="cover" fit="cover" />
        <div class="article-body">
          <div class="article-meta">
            <el-tag size="small">{{ article.categoryName || '心理知识' }}</el-tag>
            <span>{{ article.readCount || 0 }} 阅读</span>
          </div>
          <h3>{{ article.title }}</h3>
          <p>{{ article.summary || stripHtml(article.content) || '暂无摘要' }}</p>
          <div class="article-foot">
            <span>{{ article.authorName || '心理健康助手' }}</span>
            <span>{{ article.createdAt || article.createTime || '' }}</span>
          </div>
        </div>
      </article>

      <el-empty v-if="!loading && articles.length === 0" description="暂无文章" />
    </section>

    <div class="pagination-wrap">
      <el-pagination
        layout="prev, pager, next"
        :total="pagination.total"
        :page-size="pagination.size"
        :current-page="pagination.currentPage"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="currentArticle.title || '文章详情'" width="760px">
      <div v-loading="detailLoading" class="article-detail">
        <el-image :src="coverUrl(currentArticle.coverImage)" class="detail-cover" fit="cover" />
        <div class="detail-meta">
          <span>{{ currentArticle.authorName || '心理健康助手' }}</span>
          <span>{{ currentArticle.createdAt || currentArticle.createTime || '' }}</span>
          <span>{{ currentArticle.readCount || 0 }} 阅读</span>
        </div>
        <p v-if="currentArticle.summary" class="summary">{{ currentArticle.summary }}</p>
        <div class="content" v-html="currentArticle.content || '暂无内容'"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getUserArticleDetail, getUserArticles } from '@/api/user'
import { fileBaseUrl } from '@/config'
import fallbackCover from '@/assets/hero.png'

const loading = ref(false)
const detailLoading = ref(false)
const articles = ref([])
const dialogVisible = ref(false)
const currentArticle = ref({})

const pagination = reactive({
  currentPage: 1,
  size: 6,
  total: 0
})

onMounted(() => {
  loadArticles()
})

async function loadArticles() {
  loading.value = true

  try {
    const data = await getUserArticles({
      currentPage: pagination.currentPage,
      size: pagination.size,
      sortField: 'readCount',
      sortDirection: 'desc'
    })

    articles.value = data?.records || data?.list || []
    pagination.total = data?.total || articles.value.length
  } finally {
    loading.value = false
  }
}

async function openArticle(article) {
  dialogVisible.value = true
  detailLoading.value = true
  currentArticle.value = article

  try {
    currentArticle.value = await getUserArticleDetail(article.id)
  } finally {
    detailLoading.value = false
  }
}

function handlePageChange(page) {
  pagination.currentPage = page
  loadArticles()
}

function coverUrl(value) {
  if (!value) return fallbackCover
  if (/^https?:\/\//.test(value)) return value
  return `${fileBaseUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, '').slice(0, 80)
}
</script>

<style scoped>
.knowledge-user-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e4ecf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.knowledge-head h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.knowledge-head p {
  margin: 8px 0 0;
  color: #64748b;
}

.article-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  overflow: auto;
}

.article-card {
  min-height: 330px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4ecf2;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.1);
}

.cover {
  width: 100%;
  height: 148px;
  flex-shrink: 0;
}

.article-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.article-meta,
.article-foot,
.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.article-body h3 {
  margin: 14px 0 8px;
  font-size: 18px;
  color: #0f172a;
  line-height: 1.35;
}

.article-body p {
  flex: 1;
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.article-foot {
  margin-top: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.article-detail {
  min-height: 240px;
}

.detail-cover {
  width: 100%;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
}

.detail-meta {
  justify-content: flex-start;
  margin: 14px 0;
}

.summary {
  margin: 0 0 16px;
  padding: 12px;
  border-radius: 10px;
  background: #f7f3ea;
  color: #475569;
  line-height: 1.7;
}

.content {
  line-height: 1.9;
  color: #1f2937;
}

.content :deep(img) {
  max-width: 100%;
  border-radius: 10px;
}

@media (max-width: 1100px) {
  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .knowledge-head,
  .article-meta,
  .article-foot {
    align-items: flex-start;
    flex-direction: column;
  }

  .article-grid {
    grid-template-columns: 1fr;
  }
}
</style>
