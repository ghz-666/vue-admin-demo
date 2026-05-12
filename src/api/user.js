import request from '../utils/request'

export function registerUser(data) {
  return request.post('/user/add', data)
}

export function getUserArticles(params) {
  return request.get('/knowledge/article/page', { params })
}

export function getUserArticleDetail(id) {
  return request.get(`/knowledge/article/${id}`)
}

export function getUserSessions(params) {
  return request.get('/psychological-chat/sessions', { params })
}

export function getUserSessionMessages(sessionId) {
  return request.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

export function startChatSession(data, config = {}) {
  return request.post('/psychological-chat/session/start', data, config)
}

export function deleteUserSession(sessionId) {
  return request.delete(`/psychological-chat/sessions/${sessionId}`)
}

export function getSessionEmotion(sessionId) {
  return request.get(`/psychological-chat/session/${sessionId}/emotion`)
}

export function saveEmotionDiary(data) {
  return request.post('/emotion-diary', data)
}

function readStreamPayload(payload) {
  if (!payload) return ''

  if (typeof payload === 'string') {
    return payload
  }

  if (payload.choices?.[0]?.delta?.content) {
    return payload.choices[0].delta.content
  }

  if (payload.choices?.[0]?.message?.content) {
    return payload.choices[0].message.content
  }

  const data = payload.data

  if (typeof data === 'string') {
    return data
  }

  return (
    payload.content ||
    payload.answer ||
    payload.reply ||
    payload.message ||
    payload.text ||
    data?.content ||
    data?.answer ||
    data?.reply ||
    data?.message ||
    data?.text ||
    ''
  )
}

export async function streamChatMessage(data, onChunk, options = {}) {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/psychological-chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { token } : {})
    },
    body: JSON.stringify(data),
    signal: options.signal
  })

  if (!response.ok) {
    throw new Error(`AI 对话请求失败：${response.status}`)
  }

  const reader = response.body?.getReader()

  if (!reader) {
    const text = await response.text()
    const content = readStreamPayload(safeJsonParse(text) || text)
    onChunk?.(content, content)
    return content
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''

  const appendContent = (content) => {
    if (!content) return
    fullText += content
    onChunk?.(content, fullText)
  }

  const handleSseBlock = (rawBlock) => {
    const block = rawBlock.trim()

    if (!block) return

    const lines = block.split(/\r?\n/)
    let eventName = 'message'
    const dataLines = []
    let hasSseField = false

    lines.forEach((rawLine) => {
      const line = rawLine.trim()

      if (!line || line.startsWith(':')) return

      const separatorIndex = line.indexOf(':')
      const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
      let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)

      if (value.startsWith(' ')) {
        value = value.slice(1)
      }

      if (field === 'event') {
        hasSseField = true
        eventName = value || eventName
        return
      }

      if (field === 'data') {
        hasSseField = true
        dataLines.push(value)
        return
      }

      if (field === 'id' || field === 'retry') {
        hasSseField = true
      }
    })

    const payloadText = hasSseField ? dataLines.join('\n').trim() : block

    if (eventName === 'done' || payloadText === '[DONE]') return

    const parsed = safeJsonParse(payloadText)

    if (eventName === 'error') {
      throw new Error(readStreamError(parsed || payloadText) || 'AI 对话接口返回错误')
    }

    if (!payloadText) return

    if (isErrorPayload(parsed)) {
      throw new Error(readStreamError(parsed) || 'AI 对话接口返回错误')
    }

    appendContent(readStreamPayload(parsed || payloadText))
  }

  while (true) {
    const { value, done } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() || ''
    blocks.forEach(handleSseBlock)
  }

  buffer += decoder.decode()
  handleSseBlock(buffer)

  return fullText
}

function isErrorPayload(payload) {
  if (!payload || typeof payload !== 'object') return false

  const code = payload.code ?? payload.status

  return code !== undefined && !['200', 200, '0', 0].includes(code)
}

function readStreamError(payload) {
  if (!payload) return ''

  if (typeof payload === 'string') {
    return payload
  }

  const data = payload.data

  return (
    payload.msg ||
    payload.message ||
    payload.error ||
    data?.msg ||
    data?.message ||
    data?.error ||
    ''
  )
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
