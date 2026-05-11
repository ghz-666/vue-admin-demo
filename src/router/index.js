import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/auth/login'
    },
    {
      path: '/back',
      component: () => import('@/components/BackendLayout.vue'),
      redirect: '/back/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('@/views/dashboard.vue'),
          meta: {
            title: '数据分析',
            icon: 'PieChart'
          }
        },
        {
          path: 'knowledge',
          component: () => import('@/views/knowledge.vue'),
          meta: {
            title: '知识文章',
            icon: 'Document'
          }
        },
        {
          path: 'consult',
          component: () => import('@/views/consult.vue'),
          meta: {
            title: '咨询记录',
            icon: 'ChatLineRound'
          }
        },
        {
          path: 'emotion',
          component: () => import('@/views/emotion.vue'),
          meta: {
            title: '情绪日记',
            icon: 'User'
          }
        }
      ]
    },
    {
      path: '/user',
      component: () => import('@/components/UserLayout.vue'),
      redirect: '/user/chat',
      children: [
        {
          path: 'chat',
          component: () => import('@/views/user/UserChat.vue'),
          meta: {
            title: 'AI 咨询',
            icon: 'ChatRound'
          }
        },
        {
          path: 'diary',
          component: () => import('@/views/user/UserDiary.vue'),
          meta: {
            title: '情绪日记',
            icon: 'Notebook'
          }
        },
        {
          path: 'knowledge',
          component: () => import('@/views/user/UserKnowledge.vue'),
          meta: {
            title: '知识阅读',
            icon: 'Reading'
          }
        }
      ]
    },
    {
      path: '/auth',
      component: () => import('@/components/AuthLayout.vue'),
      redirect: '/auth/login',
      children: [
        {
          path: 'login',
          component: () => import('@/views/login.vue'),
          meta: {
            title: '登录',
            icon: 'Login'
          }
        },
        {
          path: 'register',
          component: () => import('@/views/register.vue'),
          meta: {
            title: '注册'
          }
        }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const userInfo = getUserInfo()
  const isAuthPage = to.path === '/auth/login' || to.path === '/auth/register'
  const needsLogin = to.path.startsWith('/back') || to.path.startsWith('/user')
  const userType = Number(userInfo?.userType)

  if (to.meta?.title) {
    document.title = `${to.meta.title} - 心理健康助手`
  }

  if (token && !userInfo) {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    if (!isAuthPage) {
      return '/auth/login'
    }
  }

  if (!token && needsLogin) {
    return {
      path: '/auth/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (!token && !isAuthPage && to.path !== '/') {
    return '/auth/login'
  }

  if (token && isAuthPage) {
    return userType === 1 ? '/user/chat' : '/back/dashboard'
  }

  if (token && ![1, 2].includes(userType)) {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    return '/auth/login'
  }

  if (token && to.path.startsWith('/back') && userType !== 2) {
    return '/user/chat'
  }

  if (token && to.path.startsWith('/user') && userType !== 1) {
    return '/back/dashboard'
  }
})

function getUserInfo() {
  const raw = localStorage.getItem('userInfo')

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default router
