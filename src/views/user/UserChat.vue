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

      <div v-if="messages.length === 0" class="message-list">
        <div class="empty-chat">
          <el-icon>
            <ChatRound />
          </el-icon>
          <h3>开始一次安全、私密的倾诉</h3>
          <p>描述你的感受、压力来源或今天发生的事,AI 会返回支持性建议。</p>
        </div>
      </div>

      <DynamicScroller
        v-else
        ref="messageScrollerRef"
        class="message-list virtual-message-list"
        :items="messages"
        :min-item-size="MESSAGE_SCROLLER_MIN_ITEM_SIZE"
        :key-field="CHAT_MESSAGE_KEY_FIELD"
        :buffer="480"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :index="index"
            :size-dependencies="[getRawMessageContent(item), item.createdAt, item.createTime]"
            :data-index="index"
            class="message-scroller-item"
          >
            <div class="message-row" :class="isUserMessage(item) ? 'from-user' : 'from-ai'">
              <div class="message-bubble">
                <div class="message-meta">
                  <span>{{ isUserMessage(item) ? '我' : 'AI 助手' }}</span>
                  <span>{{ item.createdAt || item.createTime || '' }}</span>
                </div>
                <div class="message-content" v-html="renderMessageContent(item)"></div>
              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>

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
        <el-button
          v-if="sending"
          class="composer-action"
          type="danger"
          plain
          :icon="CircleClose"
          @click="stopGenerating"
        >
          停止生成
        </el-button>
        <el-button v-else class="composer-action" type="primary" :icon="Promotion" @click="sendMessage">
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
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { CircleClose, Delete, Plus, Promotion, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
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
const messageScrollerRef = ref(null)
const abortController = ref(null)
const stopSilently = ref(false)
const MESSAGE_CACHE_STORAGE_KEY = 'user-chat-message-cache:v1'
const CHAT_MESSAGE_KEY_FIELD = 'virtualId'
const MESSAGE_SCROLLER_MIN_ITEM_SIZE = 96
const messageCache = ref(loadMessageCache())
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

const defaultLinkOpen =
  markdown.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')

  return defaultLinkOpen(tokens, idx, options, env, self)
}

onMounted(() => {
  loadSessions()
})

onBeforeUnmount(() => {
  stopGenerating({ silent: true })
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

function prepareMessagesForVirtualScroll(nextMessages) {
  return nextMessages.map((message, index) => ensureMessageVirtualKey(message, index)).filter(Boolean)
}

function ensureMessageVirtualKey(message, index) {
  if (!message) return null

  if (!message[CHAT_MESSAGE_KEY_FIELD]) {
    message[CHAT_MESSAGE_KEY_FIELD] = buildMessageVirtualKey(message, index)
  }

  return message
}

function buildMessageVirtualKey(message, index) {
  const id = message.localId || message.id || message.messageId

  if (id) return String(id)

  const role = getAiMessageRole(message)
  const createdAt = message.createdAt || message.createTime || ''
  const contentHash = hashString(getRawMessageContent(message))

  return `${role}-${createdAt}-${index}-${contentHash}`
}

function hashString(value = '') {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

function getSessionId(session) {
  return String(session?.id || session?.sessionId || '')
}

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getMessageCacheStorageKey() {
  const storage = getStorage()
  const userInfo = storage ? safeJsonParse(storage.getItem('userInfo')) : null
  const userId = userInfo?.id || userInfo?.userId || userInfo?.username || userInfo?.account || 'guest'

  return `${MESSAGE_CACHE_STORAGE_KEY}:${userId}`
}

function loadMessageCache() {
  const storage = getStorage()

  if (!storage) return {}

  const parsed = safeJsonParse(storage.getItem(getMessageCacheStorageKey()))

  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function persistMessageCache() {
  const storage = getStorage()

  if (!storage) return

  try {
    storage.setItem(getMessageCacheStorageKey(), JSON.stringify(messageCache.value))
  } catch {
    // localStorage can be full or disabled; the chat still works without the cache.
  }
}

function getCachedSessionMessages(sessionId) {
  const cachedMessages = messageCache.value[String(sessionId)] || []

  return Array.isArray(cachedMessages) ? cachedMessages : []
}

function cacheSessionMessages(sessionId, nextMessages) {
  const key = String(sessionId || '')

  if (!key) return

  const cachedMessages = nextMessages.map(normalizeCachedMessage).filter(Boolean)

  if (cachedMessages.length === 0) return

  messageCache.value = {
    ...messageCache.value,
    [key]: cachedMessages
  }
  persistMessageCache()
}

function removeCachedSession(sessionId) {
  const key = String(sessionId || '')

  if (!key || !messageCache.value[key]) return

  const nextCache = { ...messageCache.value }
  delete nextCache[key]
  messageCache.value = nextCache
  persistMessageCache()
}

function normalizeCachedMessage(message) {
  if (!message) return null

  const content = getRawMessageContent(message)

  if (!content && !message.localId && !message.id && !message.messageId) return null

  return {
    id: message.id,
    messageId: message.messageId,
    localId: message.localId,
    senderType: message.senderType,
    role: message.role,
    content,
    createdAt: message.createdAt || message.createTime || ''
  }
}

function mergeSessionMessages(remoteMessages, cachedMessages) {
  const mergedMessages = []
  const identities = new Set()
  const remoteSignatureCounts = new Map()

  const addRemoteMessage = (message) => {
    const identity = getMessageIdentity(message)
    const signature = getMessageSignature(message)

    if (identity && identities.has(identity)) return

    if (identity) identities.add(identity)
    if (signature) {
      remoteSignatureCounts.set(signature, (remoteSignatureCounts.get(signature) || 0) + 1)
    }

    mergedMessages.push(message)
  }

  remoteMessages.forEach(addRemoteMessage)

  cachedMessages.forEach((message) => {
    const identity = getMessageIdentity(message)
    const signature = getMessageSignature(message)
    const remoteSignatureCount = signature ? remoteSignatureCounts.get(signature) || 0 : 0

    if (identity && identities.has(identity)) return

    if (remoteSignatureCount > 0) {
      remoteSignatureCounts.set(signature, remoteSignatureCount - 1)
      return
    }

    if (identity) identities.add(identity)

    mergedMessages.push(message)
  })

  return mergedMessages
}

function getMessageIdentity(message) {
  const id = message?.id || message?.messageId

  return id ? `id:${id}` : ''
}

function getMessageSignature(message) {
  const content = getRawMessageContent(message).trim()

  if (!content) return ''

  return `${getAiMessageRole(message)}:${content}`
}

function formatMessageTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`
}

function startNewChat() {
  stopGenerating({ silent: true })
  activeSessionId.value = ''
  currentTitle.value = '新的咨询'
  messages.value = []
  emotionResult.value = null
}

async function selectSession(session) {
  const sessionId = getSessionId(session)

  if (!sessionId) return

  stopGenerating({ silent: true })
  activeSessionId.value = sessionId
  currentTitle.value = session.title || session.sessionTitle || '心理咨询'
  emotionResult.value = null

  const data = await getUserSessionMessages(sessionId)
  const remoteMessages = normalizeList(data)
  messages.value = prepareMessagesForVirtualScroll(mergeSessionMessages(remoteMessages, getCachedSessionMessages(sessionId)))
  cacheSessionMessages(sessionId, messages.value)
  scrollToBottom()
}

function isUserMessage(message) {
  return Number(message.senderType) === 1 || message.role === 'user'
}

function getMessageContent(message) {
  return getRawMessageContent(message) || '正在生成回复...'
}

function renderMessageContent(message) {
  return markdown.render(getMessageContent(message))
}

function getRawMessageContent(message) {
  return message.content || message.messageContent || ''
}

function setMessageContent(messageList, targetMessage, content) {
  targetMessage.content = content

  const message = messageList.find((item) => item.localId === targetMessage.localId)

  if (message) {
    message.content = content
  }
}

function buildAiMessages(excludedLocalId, sourceMessages = messages.value) {
  return sourceMessages
    .filter((message) => message.localId !== excludedLocalId)
    .map((message) => {
      const content = getRawMessageContent(message).trim()

      if (!content) return null

      return {
        role: getAiMessageRole(message),
        content
      }
    })
    .filter(Boolean)
}

function getAiMessageRole(message) {
  if (['system', 'user', 'assistant'].includes(message.role)) {
    return message.role
  }

  return isUserMessage(message) ? 'user' : 'assistant'
}

async function sendMessage() {
  if (sending.value) return

  const text = messageText.value.trim()

  if (!text) {
    ElMessage.warning('请输入咨询内容')
    return
  }

  sending.value = true
  stopSilently.value = false
  const controller = new AbortController()
  abortController.value = controller
  messageText.value = ''
  let targetSessionId = activeSessionId.value
  const sessionMessages = messages.value
  const createdAt = formatMessageTime()

  const userMessage = {
    localId: `user-${Date.now()}`,
    senderType: 1,
    content: text,
    createdAt
  }
  const aiMessage = {
    localId: `ai-${Date.now()}`,
    senderType: 2,
    content: '',
    createdAt
  }

  sessionMessages.push(
    ensureMessageVirtualKey(userMessage, sessionMessages.length),
    ensureMessageVirtualKey(aiMessage, sessionMessages.length + 1)
  )
  if (targetSessionId) {
    cacheSessionMessages(targetSessionId, sessionMessages)
  }
  scrollToBottom()

  try {
    const isNewSession = !targetSessionId

    if (isNewSession) {
      const session = await startChatSession(
        {
          initialMessage: text,
          sessionTitle: buildSessionTitle(text)
        },
        { signal: controller.signal }
      )
      targetSessionId = extractSessionId(session)
      activeSessionId.value = targetSessionId
      currentTitle.value = extractSessionTitle(session) || buildSessionTitle(text)
    }

    if (!targetSessionId) {
      throw new Error('后端未返回会话 ID')
    }

    cacheSessionMessages(targetSessionId, sessionMessages)

    const streamedText = await streamChatMessage(
      {
        messages: buildAiMessages(aiMessage.localId, sessionMessages)
      },
      (_chunk, fullText) => {
        setMessageContent(sessionMessages, aiMessage, fullText)
        scrollToBottom()
      },
      { signal: controller.signal }
    )

    if (streamedText) {
      setMessageContent(sessionMessages, aiMessage, streamedText)
    }

    if (!aiMessage.content) {
      setMessageContent(sessionMessages, aiMessage, 'AI 暂未返回内容，请稍后在会话记录中查看。')
    }

    cacheSessionMessages(targetSessionId, sessionMessages)
    await loadSessions()
  } catch (error) {
    if (isAbortError(error) || controller.signal.aborted) {
      setMessageContent(sessionMessages, aiMessage, aiMessage.content || '已停止生成。')
      cacheSessionMessages(targetSessionId, sessionMessages)

      if (!stopSilently.value) {
        ElMessage.info('已停止生成')
      }

      return
    }

    setMessageContent(sessionMessages, aiMessage, '发送失败，请稍后重试。')
    cacheSessionMessages(targetSessionId, sessionMessages)
    ElMessage.error(error?.message || 'AI 对话失败')
  } finally {
    if (abortController.value === controller) {
      abortController.value = null
      stopSilently.value = false
    }

    sending.value = false
    scrollToBottom()
  }
}

function stopGenerating(options = {}) {
  const controller = abortController.value

  if (!sending.value || !controller || controller.signal.aborted) return

  stopSilently.value = Boolean(options.silent)
  controller.abort()
}

function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ERR_CANCELED'
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

  const sessionId = activeSessionId.value

  await ElMessageBox.confirm('确认删除当前会话吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await deleteUserSession(sessionId)
  removeCachedSession(sessionId)
  ElMessage.success('会话已删除')
  startNewChat()
  loadSessions()
}

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const scroller = messageScrollerRef.value
      const lastIndex = messages.value.length - 1

      if (!scroller || lastIndex < 0) return

      if (typeof scroller.scrollToBottom === 'function') {
        scroller.scrollToBottom()
      } else if (typeof scroller.scrollToItem === 'function') {
        scroller.scrollToItem(lastIndex)
      }

      requestAnimationFrame(() => {
        const scrollElement = scroller.$el

        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }
      })
    })
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
  box-sizing: border-box;
  overflow: auto;
  background: #fbfdff;
}

.message-scroller-item {
  box-sizing: border-box;
  padding-bottom: 14px;
}

.virtual-message-list .message-row {
  margin-bottom: 0;
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

.message-content {
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.message-content :deep(*) {
  max-width: 100%;
}

.message-content :deep(p),
.message-content :deep(ul),
.message-content :deep(ol),
.message-content :deep(blockquote),
.message-content :deep(pre),
.message-content :deep(table) {
  margin: 0 0 10px;
}

.message-content :deep(*:last-child) {
  margin-bottom: 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 20px;
}

.message-content :deep(li + li) {
  margin-top: 4px;
}

.message-content :deep(a) {
  color: #2f7f72;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-content :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #eef2f6;
  color: #334155;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 0.92em;
}

.message-content :deep(pre) {
  overflow-x: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
}

.message-content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.message-content :deep(blockquote) {
  padding: 8px 12px;
  border-left: 3px solid #9fcfc5;
  background: #f3faf7;
  color: #475569;
}

.message-content :deep(table) {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 6px 10px;
  border: 1px solid #d8e2ea;
}

.message-content :deep(th) {
  background: #f3f7fa;
  font-weight: 700;
}

.from-user .message-content :deep(a) {
  color: #fff;
}

.from-user .message-content :deep(code) {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.from-user .message-content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid #eef2f6;
}

.composer-action {
  min-width: 96px;
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
