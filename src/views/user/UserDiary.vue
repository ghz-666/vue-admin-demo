<template>
  <div class="diary-page">
    <section class="diary-form-panel">
      <div class="page-title">
        <h2>记录今日情绪</h2>
        <p>提交后会调用后端 AI 分析结果，帮助你复盘情绪状态。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="diary-form">
        <el-form-item label="日期" prop="diaryDate">
          <el-date-picker
            v-model="form.diaryDate"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="选择日期"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="情绪评分" prop="moodScore">
          <el-slider v-model="form.moodScore" :min="1" :max="10" show-input />
        </el-form-item>

        <el-form-item label="主要情绪" prop="dominantEmotion">
          <el-select v-model="form.dominantEmotion" placeholder="请选择主要情绪" style="width: 100%;">
            <el-option v-for="item in emotions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="触发因素" prop="emotionTriggers">
          <el-input v-model="form.emotionTriggers" placeholder="例如工作压力、人际沟通、睡眠不足" />
        </el-form-item>

        <el-form-item label="睡眠质量" prop="sleepQuality">
          <el-slider v-model="form.sleepQuality" :min="1" :max="5" show-input />
        </el-form-item>

        <el-form-item label="压力水平" prop="stressLevel">
          <el-slider v-model="form.stressLevel" :min="1" :max="5" show-input />
        </el-form-item>

        <el-form-item label="今日感想" prop="diaryContent">
          <el-input
            v-model="form.diaryContent"
            type="textarea"
            :rows="7"
            maxlength="1000"
            show-word-limit
            placeholder="写下今天的经历、感受和你希望改善的地方"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            保存并分析
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="analysis-panel">
      <div class="page-title">
        <h2>AI 情绪分析</h2>
        <p>保存成功后展示后端返回的大模型分析数据。</p>
      </div>

      <div v-if="analysis" class="analysis-content">
        <div class="analysis-grid">
          <div class="analysis-card">
            <span>主要情绪</span>
            <strong>{{ analysis.primaryEmotion || analysis.dominantEmotion || form.dominantEmotion }}</strong>
          </div>
          <div class="analysis-card">
            <span>风险等级</span>
            <el-tag :type="riskTagType(analysis.riskLevel)">
              {{ riskText(analysis.riskLevel) }}
            </el-tag>
          </div>
          <div class="analysis-card">
            <span>情绪强度</span>
            <el-progress :percentage="Number(analysis.emotionScore) || form.moodScore * 10" />
          </div>
        </div>

        <div class="suggestion-block">
          <h3>专业建议</h3>
          <p>{{ analysis.suggestion || '暂未返回建议' }}</p>
        </div>

        <div class="suggestion-block" v-if="analysis.riskDescription">
          <h3>风险说明</h3>
          <p>{{ analysis.riskDescription }}</p>
        </div>

        <div class="suggestion-block" v-if="analysis.improvementSuggestions?.length">
          <h3>改进建议</h3>
          <ul>
            <li v-for="item in analysis.improvementSuggestions" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>

      <el-empty v-else description="暂无分析结果" :image-size="120" />
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { saveEmotionDiary } from '@/api/user'

const formRef = ref(null)
const submitting = ref(false)
const analysis = ref(null)
const emotions = ['开心', '平静', '焦虑', '悲伤', '愤怒', '疲惫', '困惑', '兴奋']

const form = reactive(getDefaultForm())

const rules = {
  diaryDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  moodScore: [{ required: true, message: '请选择情绪评分', trigger: 'change' }],
  dominantEmotion: [{ required: true, message: '请选择主要情绪', trigger: 'change' }],
  emotionTriggers: [{ required: true, message: '请输入触发因素', trigger: 'blur' }],
  diaryContent: [{ required: true, message: '请输入今日感想', trigger: 'blur' }],
  sleepQuality: [{ required: true, message: '请选择睡眠质量', trigger: 'change' }],
  stressLevel: [{ required: true, message: '请选择压力水平', trigger: 'change' }]
}

async function handleSubmit() {
  const valid = await formRef.value.validate()

  if (!valid) return

  submitting.value = true

  try {
    const data = await saveEmotionDiary({ ...form })
    analysis.value = normalizeAnalysis(data)
    ElMessage.success('情绪日记已保存')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  Object.assign(form, getDefaultForm())
  analysis.value = null
  formRef.value?.clearValidate()
}

function getDefaultForm() {
  return {
    diaryDate: formatDate(new Date()),
    moodScore: 6,
    dominantEmotion: '',
    emotionTriggers: '',
    diaryContent: '',
    sleepQuality: 3,
    stressLevel: 3
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeAnalysis(data) {
  if (!data) return null

  if (typeof data === 'string') {
    return safeJsonParse(data) || { suggestion: data }
  }

  if (typeof data.aiEmotionAnalysis === 'string') {
    return safeJsonParse(data.aiEmotionAnalysis) || data
  }

  return data.analysis || data.aiEmotionAnalysis || data
}

function riskText(level) {
  const map = {
    0: '正常',
    1: '关注',
    2: '预警',
    3: '危机'
  }

  return map[Number(level)] || '未知'
}

function riskTagType(level) {
  const map = {
    0: 'success',
    1: 'info',
    2: 'warning',
    3: 'danger'
  }

  return map[Number(level)] || 'info'
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
</script>

<style scoped>
.diary-page {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 16px;
}

.diary-form-panel,
.analysis-panel {
  min-height: 0;
  overflow: auto;
  padding: 22px;
  border: 1px solid #e4ecf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.page-title {
  margin-bottom: 22px;
}

.page-title h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.page-title p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.diary-form {
  max-width: 780px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.analysis-card {
  min-height: 96px;
  padding: 14px;
  border: 1px solid #e8eef5;
  border-radius: 12px;
  background: #fbfdff;
}

.analysis-card span {
  display: block;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
}

.analysis-card strong {
  color: #0f172a;
  font-size: 20px;
}

.suggestion-block {
  padding: 16px;
  border-radius: 12px;
  background: #f7f3ea;
}

.suggestion-block h3 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #1e293b;
}

.suggestion-block p,
.suggestion-block li {
  color: #475569;
  line-height: 1.7;
}

.suggestion-block ul {
  margin: 0;
  padding-left: 18px;
}

@media (max-width: 900px) {
  .diary-page,
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}
</style>
