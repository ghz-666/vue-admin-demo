<template>
  <div>
    <pagehead title="情感分析" />

    <Tablesearch :formItem="formItem" @search="handleSearch" />

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="userId" label="用户ID" width="100" />

      <el-table-column label="会话ID" width="100">
        <template #default="scope">
          <el-avatar>{{ scope.row.nickname }}</el-avatar>
        </template>
      </el-table-column>

      <el-table-column prop="diaryDate" label="记录时间" width="100" />

      <el-table-column label="情绪评分" width="180">
        <template #default="scope">
          <el-rate v-model="scope.row.moodScore" :max="10" disabled />
        </template>
      </el-table-column>

      <el-table-column label="生活指标" width="180">
        <template #default="scope">
          <p>睡眠：{{ scope.row.sleepQuality }}/5</p>
          <p>压力：{{ scope.row.stressLevel }}/5</p>
        </template>
      </el-table-column>

      <el-table-column prop="emotionTriggers" label="情绪触发因素" width="180" />
      <el-table-column prop="diaryContent" label="日记内容" width="180" />

      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button @click="handleDetail(scope.row)" type="primary" size="small">
            查看详情
          </el-button>
          <el-button type="danger" size="small">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      layout="prev, pager, next"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current-page="pagination.currentPage"
      @current-change="handleChange"
    />

    <el-dialog v-model="dialogVisible" title="会话详情" width="50%">
      <div v-if="currentDetail" class="detail-content">
        <div class="detail-section">
          <h4>用户信息:</h4>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ currentDetail.username }}
            </el-descriptions-item>

            <el-descriptions-item label="昵称">
              {{ currentDetail.nickname }}
            </el-descriptions-item>

            <el-descriptions-item label="用户ID">
              {{ currentDetail.userId }}
            </el-descriptions-item>

            <el-descriptions-item label="记录时间">
              {{ currentDetail.updatedAt }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>情绪评分:</h4>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="情绪评分">
              <el-rate v-model="currentDetail.moodScore" :max="10" disabled />
            </el-descriptions-item>

            <el-descriptions-item label="主要情绪">
              <el-tag :type="getEmotionTagType(currentDetail.dominantEmotion)">
                {{ currentDetail.dominantEmotion }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="睡眠质量">
              {{ currentDetail.sleepQuality }}/5
            </el-descriptions-item>

            <el-descriptions-item label="压力">
              {{ currentDetail.stressLevel }}/5
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>日记内容:</h4>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="情绪触发因素">
              {{ currentDetail.emotionTriggers }}
            </el-descriptions-item>

            <el-descriptions-item label="日记内容">
              {{ currentDetail.diaryContent }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="aiData">
          <h4>AI情绪分析:</h4>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="主要情绪">
              <el-tag :type="getAiEmotionTagType(aiData.primaryEmotion)">
                {{ aiData.primaryEmotion }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="情绪强度">
              <el-progress
                :percentage="aiData.emotionScore"
                :stroke-width="8"
                :color="getEmotionScoreColor(aiData.emotionScore)"
              />
            </el-descriptions-item>

            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskLevelTagType(aiData.riskLevel)">
                {{ getRiskLevelText(aiData.riskLevel) }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="情绪性质">
              <el-tag :type="aiData.isNegative ? 'danger' : 'success'">
                {{ aiData.isNegative ? '负面' : '正面' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="ai-suggestion-section">
            <h5>专业建议</h5>
            <div class="suggestion-content">
              {{ aiData.suggestion }}
            </div>
          </div>

          <div class="ai-risk-section">
            <h5>风险评估</h5>
            <div class="risk-content">
              {{ aiData.riskDescription }}
            </div>
          </div>

          <div class="ai-improvements-section">
            <h5>改进建议</h5>
            <ul class="improvement-list">
              <li
                v-for="(item, index) in aiData.improvementSuggestions || []"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import pagehead from '../components/pagehead.vue'
import Tablesearch from '../components/tablesearch.vue'
import { GetEmotionPage } from '@/api/admin'
import { onMounted, ref } from 'vue'

const tableData = ref([])

const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1
})

const dialogVisible = ref(false)
const currentDetail = ref(null)
const aiData = ref(null)

const formItem = [
  {
    comp: 'input',
    label: '用户ID',
    prop: 'userId',
    placeholder: '请输入用户ID'
  },
  {
    comp: 'select',
    label: '情感',
    prop: 'moodScreRange',
    placeholder: '请选择评分范围',
    options: [
      {
        label: '1-3',
        value: '1-3'
      },
      {
        label: '4-6',
        value: '4-6'
      },
      {
        label: '7-10',
        value: '7-10'
      }
    ]
  }
]

const handleSearch = async (formData = {}) => {
  const params = {
    ...pagination.value,
    ...formData
  }

  const { records, total } = await GetEmotionPage(params)

  tableData.value = records || []
  pagination.value.total = total || 0
}

onMounted(() => {
  handleSearch()
})

const handleChange = (val) => {
  pagination.value.currentPage = val
  handleSearch()
}

const handleDetail = (row) => {
  dialogVisible.value = true
  currentDetail.value = row
  console.log(row)
  if (row.aiEmotionAnalysis) {
    try {
      aiData.value = JSON.parse(row.aiEmotionAnalysis)
    } catch (error) {
      console.error('AI情绪分析 JSON 解析失败:', error)
      aiData.value = null
    }
  } else {
    aiData.value = null
  }
}

const getEmotionTagType = (emotion) => {
  const emotionTypes = {
    快乐: 'success',
    平静: 'info',
    兴奋: 'warning',
    愤怒: 'danger',
    悲伤: 'info',
    焦虑: 'warning'
  }

  return emotionTypes[emotion] || 'info'
}

const getAiEmotionTagType = (emotion) => {
  const emotionTagMap = {
    快乐: 'success',
    平静: 'success',
    兴奋: 'warning',
    满足: 'success',
    愤怒: 'danger',
    悲伤: 'info',
    焦虑: 'warning',
    恐惧: 'danger',
    沮丧: 'info',
    压力: 'warning'
  }

  return emotionTagMap[emotion] || 'info'
}

const getEmotionScoreColor = (score) => {
  if (score >= 80) return '#f56c6c'
  if (score >= 60) return '#e6a23c'
  if (score >= 40) return '#909399'
  return '#67c23a'
}

const getRiskLevelTagType = (riskLevel) => {
  const riskTagMap = {
    0: 'success',
    1: 'info',
    2: 'warning',
    3: 'danger'
  }

  return riskTagMap[riskLevel] || 'info'
}

const getRiskLevelText = (riskLevel) => {
  const riskTextMap = {
    0: '正常',
    1: '关注',
    2: '预警',
    3: '危机'
  }

  return riskTextMap[riskLevel] || '未知风险等级'
}
</script>

<style scoped>
.detail-content {
  padding: 4px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.ai-suggestion-section,
.ai-risk-section,
.ai-improvements-section {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.ai-suggestion-section h5,
.ai-risk-section h5,
.ai-improvements-section h5 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.suggestion-content,
.risk-content {
  line-height: 1.6;
  color: #606266;
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.improvement-list {
  margin: 0;
  padding-left: 20px;
}

.improvement-list li {
  margin-bottom: 4px;
  color: #606266;
  line-height: 1.5;
}
</style>