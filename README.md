# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## 本地启动

先启动 AI 对话代理服务：

```bash
cd backend
npm install
cp .env.example .env
# 填写 backend/.env 中的 XUNFEI_API_KEY
npm run dev
```

再启动前端：

```bash
cd ..
npm install
npm run dev
```

AI 对话前端会请求 `http://localhost:3000/ai/chat`，由 `backend` 代理到讯飞 MaaS OpenAI 兼容接口。不要提交 `backend/.env` 或真实 APIKey。
