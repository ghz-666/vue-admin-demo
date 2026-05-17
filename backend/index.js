import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 3000
const xunfeiApiKey = process.env.XUNFEI_API_KEY
const xunfeiModel = process.env.XUNFEI_MODEL || 'xop35qwen2b'
const xunfeiChatUrl = 'https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions'
const allowedRoles = new Set(['system', 'user', 'assistant'])
const passthroughParams = [
  'temperature',
  'top_p',
  'max_tokens',
  'presence_penalty',
  'frequency_penalty',
  'stop'
]

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/ai/chat', async (req, res) => {
  if (!xunfeiApiKey) {
    res.status(500).json({ message: '服务端未配置 XUNFEI_API_KEY' })
    return
  }

  const messages = normalizeMessages(req.body?.messages)

  if (messages.length === 0) {
    res.status(400).json({ message: 'messages 不能为空' })
    return
  }

  const abortController = new AbortController()

  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort()
    }
  })

  try {
    const upstreamResponse = await fetch(xunfeiChatUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xunfeiApiKey}`,
        Accept: 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: xunfeiModel,
        messages,
        stream: true,
        ...pickPassthroughParams(req.body)
      }),
      signal: abortController.signal
    })

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      res.status(upstreamResponse.status).json({
        message: '讯飞 MaaS 接口请求失败',
        detail: safeJsonParse(errorText) || errorText
      })
      return
    }

    res.status(200)
    res.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()

    const reader = upstreamResponse.body?.getReader()

    if (!reader) {
      res.end()
      return
    }

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      res.write(Buffer.from(value))
    }

    res.end()
  } catch (error) {
    if (error?.name === 'AbortError') return

    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'AI 对话代理服务异常' })}\n\n`)
      res.end()
      return
    }

    res.status(500).json({ message: 'AI 对话代理服务异常' })
  }
})

app.listen(port, () => {
  console.log(`AI proxy server is running at http://localhost:${port}`)
})

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .map((message) => {
      const role = allowedRoles.has(message?.role) ? message.role : ''
      const content = typeof message?.content === 'string' ? message.content.trim() : ''

      if (!role || !content) return null

      return { role, content }
    })
    .filter(Boolean)
}

function pickPassthroughParams(body = {}) {
  const source = body && typeof body === 'object' ? body : {}

  return passthroughParams.reduce((params, key) => {
    if (source[key] !== undefined) {
      params[key] = source[key]
    }

    return params
  }, {})
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
