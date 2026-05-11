<template>
  <div class="chat-page">
    <aside class="session-panel">
      <div class="panel-head">
        <div>
          <h2>咨询会话</h2>
          <p>保存你的每次 AI 咨询记录</p>
        </div>
        <el-button type="primary" :icon="Plus" circle @click="startNewChat" />
      </div>

      <div v-loading="loadingSessions" class="session-list">
        <button
          v-for="session in sessions"
          :key="session.id || session.sessionId"
          class="session-item"
          :class="{ active: activeSessionId === getSessionId(session) }"
          @click="selectSession(session)"
        >
          <span class="session-title">{{ session.title || session.sessionTitle || '心理咨询' }}</span>
          <span class="session-preview">{{ session.lastMessageContent || '暂无消息' }}</span>
        </button>

        <el-empty v-if="!loadingSessions && sessions.length === 0" description="暂无会话" :image-size="90" />
      </div>
    </aside>

    <section class="chat-main">
      <div class="chat-toolbar">
        <div>
          <h2>{{ currentTitle }}</h2>
          <p>{{ activeSessionId ? '正在和 AI 助手对话' : '输入第一句话开始新的咨询' }}</p>
        </div>
        <div class="toolbar-actions">
          <el-button :icon="TrendCharts" :disabled="!activeSessionId" @click="loadEmotionAnalysis">
            会话分析
          </el-button>
          <el-button :icon="Delete" :disabled="!activeSessionId" @click="handleDeleteSession">
            删除
          </el-button>
        </div>
      </div>

      <div ref="messageListRef" class="message-list">
        <div v-if="messages.length === 0" class="empty-chat">
          <el-icon>
            <ChatRound />
          </el-icon>
          <h3>开始一次安全、私密的倾诉</h3>
          <p>描述你的感受、压力来源或今天发生的事,AI 会返回支持性建议。</p>
        </div>

        <div
          v-for="message in messages"
          :key="message.localId || message.id"
          class="message-row"
          :class="isUserMessage(message) ? 'from-user' : 'from-ai'"
        >
          <div class="message-bubble">
            <div class="message-meta">
              <span>{{ isUserMessage(message) ? '我' : 'AI 助手' }}</span>
              <span>{{ message.createdAt || message.createTime || '' }}</span>
            </div>
            <p>{{ message.content || message.messageContent || '正在生成回复...' }}</p>
          </div>
        </div>
      </div>

      <div class="composer">
        <el-input
          v-model="messageText"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          maxlength="800"
          show-word-limit
          placeholder="输入你想咨询的内容"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <el-button type="primary" :loading="sending" :icon="Promotion" @click="sendMessage">
          发送
        </el-button>
      </div>
    </section>

    <aside class="analysis-panel">
      <div class="panel-head compact">
        <div>
          <h2>AI 分析</h2>
          <p>来自会话情绪分析接口</p>
        </div>
      </div>

      <div v-if="emotionResult" class="analysis-content">
        <div class="metric">
          <span>主要情绪</span>
          <strong>{{ emotionResult.primaryEmotion || emotionResult.dominantEmotion || '未知' }}</strong>
        </div>
        <div class="metric">
          <span>风险等级</span>
          <el-tag :type="riskTagType(emotionResult.riskLevel)">
            {{ riskText(emotionResult.riskLevel) }}
          </el-tag>
        </div>
        <div class="metric" v-if="emotionResult.emotionScore !== undefined">
          <span>情绪强度</span>
          <el-progress :percentage="Number(emotionResult.emotionScore) || 0" :stroke-width="8" />
        </div>
        <div class="suggestion">
          <h3>建议</h3>
          <p>{{ emotionResult.suggestion || emotionResult.riskDescription || '暂无建议' }}</p>
        </div>
      </div>

      <el-empty v-else description="选择会话后查看分析" :image-size="90" />
    </aside>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { Delete, Plus, Promotion, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteUserSession,
  getSessionEmotion,
  getUserSessionMessages,
  getUserSessions,
  startChatSession,
  streamChatMessage
} from '@/api/user'

const sessions = ref([])
const messages = ref([])
const activeSessionId = ref('')
const currentTitle = ref('新的咨询')
const messageText = ref('')
const sending = ref(false)
const loadingSessions = ref(false)
const emotionResult = ref(null)
const messageListRef = ref(null)

onMounted(() => {
  loadSessions()
})

async function loadSessions() {
  loadingSessions.value = true

  try {
    const data = await getUserSessions({ pageNum: 1, pageSize: 30 })
    sessions.value = normalizeList(data)
  } finally {
    loadingSessions.value = false
  }
}

function normalizeList(data) {
  if (Array.isArray(data)) return data
  return data?.records || data?.list || data?.rows || data?.messages || []
}

function getSessionId(session) {
  return String(session?.id || session?.sessionId || '')
}

function startNewChat() {
  activeSessionId.value = ''
  currentTitle.value = '新的咨询'
  messages.value = []
  emotionResult.value = null
}

async function selectSession(session) {
  const sessionId = getSessionId(session)

  if (!sessionId) return

  activeSessionId.value = sessionId
  currentTitle.value = session.title || session.sessionTitle || '心理咨询'
  emotionResult.value = null

  const data = await getUserSessionMessages(sessionId)
  messages.value = normalizeList(data)
  scrollToBottom()
}

function isUserMessage(message) {
  return Number(message.senderType) === 1 || message.role === 'user'
}

async function sendMessage() {
  const text = messageText.value.trim()

  if (!text) {
    ElMessage.warning('请输入咨询内容')
    return
  }

  sending.value = true
  messageText.value = ''

  const userMessage = {
    localId: `user-${Date.now()}`,
    senderType: 1,
    content: text
  }
  const aiMessage = {
    localId: `ai-${Date.now()}`,
    senderType: 2,
    content: ''
  }

  messages.value.push(userMessage, aiMessage)
  scrollToBottom()

  try {
    const isNewSession = !activeSessionId.value
    let startReply = ''

    if (isNewSession) {
      const session = await startChatSession({
        initialMessage: text,
        sessionTitle: buildSessionTitle(text)
      })
      activeSessionId.value = extractSessionId(session)
      currentTitle.value = extractSessionTitle(session) || buildSessionTitle(text)
      startReply = extractReply(session)

      if (startReply) {
        aiMessage.content = startReply
      }
    }

    if (!activeSessionId.value) {
      throw new Error('后端未返回会话 ID')
    }

    if (!startReply) {
      const streamedText = await streamChatMessage(
        {
          sessionId: activeSessionId.value,
          userMessage: text
        },
        (_chunk, fullText) => {
          aiMessage.content = fullText
          scrollToBottom()
        }
      )

      if (streamedText) {
        aiMessage.content = streamedText
      }
    }

    if (!aiMessage.content) {
      aiMessage.content = 'AI 暂未返回内容，请稍后在会话记录中查看。'
    }

    await loadSessions()
  } catch (error) {
    aiMessage.content = '发送失败，请稍后重试。'
    ElMessage.error(error?.message || 'AI 对话失败')
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function buildSessionTitle(text) {
  return text.length > 18 ? `${text.slice(0, 18)}...` : text
}

function extractSessionId(data) {
  return String(data?.sessionId || data?.id || data?.session?.id || data?.data?.sessionId || data?.data?.id || '')
}

function extractSessionTitle(data) {
  return data?.title || data?.sessionTitle || data?.session?.title || data?.data?.title || ''
}

function extractReply(data) {
  const content =
    data?.aiMessage ||
    data?.assistantMessage ||
    data?.answer ||
    data?.reply ||
    data?.content ||
    data?.data?.aiMessage ||
    data?.data?.answer ||
    data?.data?.reply ||
    data?.message?.content

  return typeof content === 'string' ? content : ''
}

async function loadEmotionAnalysis() {
  if (!activeSessionId.value) return

  const data = await getSessionEmotion(activeSessionId.value)
  emotionResult.value = parseAnalysis(data)
}

function parseAnalysis(data) {
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

async function handleDeleteSession() {
  if (!activeSessionId.value) return

  await ElMessageBox.confirm('确认删除当前会话吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await deleteUserSession(activeSessionId.value)
  ElMessage.success('会话已删除')
  startNewChat()
  loadSessions()
}

function scrollToBottom() {
  nextTick(() => {
    if (!messageListRef.value) return
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  })
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
.chat-page {
  height: 100%;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 16px;
}

.session-panel,
.chat-main,
.analysis-panel {
  min-height: 0;
  border: 1px solid #e4ecf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.session-panel,
.analysis-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head.compact {
  margin-bottom: 22px;
}

.panel-head h2,
.chat-toolbar h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.panel-head p,
.chat-toolbar p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #64748b;
}

.session-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.session-item {
  width: 100%;
  display: block;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e8eef5;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.session-item.active {
  border-color: #4f9d8d;
  background: #eef8f4;
}

.session-title,
.session-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-title {
  font-weight: 700;
  color: #1e293b;
}

.session-preview {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-toolbar {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid #eef2f6;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 18px;
  overflow: auto;
  background: #fbfdff;
}

.empty-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
}

.empty-chat .el-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: #eef8f4;
  color: #3d8a7a;
  font-size: 28px;
}

.empty-chat h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #1e293b;
}

.empty-chat p {
  width: min(420px, 100%);
  line-height: 1.7;
}

.message-row {
  display: flex;
  margin-bottom: 14px;
}

.message-row.from-user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(72%, 680px);
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e4ecf2;
  background: #fff;
}

.from-user .message-bubble {
  border-color: #3d8a7a;
  background: #3d8a7a;
  color: #fff;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.72;
}

.message-bubble p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid #eef2f6;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.metric {
  padding: 12px;
  border: 1px solid #e8eef5;
  border-radius: 10px;
  background: #fbfdff;
}

.metric span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748b;
}

.metric strong {
  color: #0f172a;
  font-size: 18px;
}

.suggestion {
  padding: 12px;
  border-radius: 10px;
  background: #f7f3ea;
}

.suggestion h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1e293b;
}

.suggestion p {
  margin: 0;
  line-height: 1.7;
  color: #475569;
}

@media (max-width: 1100px) {
  .chat-page {
    grid-template-columns: 240px 1fr;
  }

  .analysis-panel {
    display: none;
  }
}

@media (max-width: 760px) {
  .chat-page {
    height: auto;
    grid-template-columns: 1fr;
  }

  .session-panel,
  .chat-main {
    min-height: 420px;
  }

  .chat-toolbar,
  .composer {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .message-bubble {
    max-width: 90%;
  }
}
</style>
