import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
    baseURL: '/api',
    timeout: 30000
})

// --- 请求拦截器 ---
request.interceptors.request.use(
    (config) => {
        // ⚠️ 检查点1：确保登录时存的 key 也是 'token'
        const token = localStorage.getItem('token')
        
        if (token) {
            // ⚠️ 检查点2：确认后端要的头是 'token' 还是 'Authorization'
            // 如果后端要 Authorization，请改成: config.headers['Authorization'] = 'Bearer ' + token
            config.headers['token'] = token
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// --- 响应拦截器 ---
request.interceptors.response.use(
    (response) => {
        const { data } = response
        
        // 1. 成功状态
        if (data.code === '200' || data.code === 200) {
            return data.data
        }
        
        // 2. 未登录/Token过期状态
        if (data.code === '-1') {
            if (!response.config.url?.includes('/login')) {
                ElMessage.error(data.msg || '登录过期，请重新登录')
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                router.push({ path: '/auth/login' })
            }
            // ⚠️ 必须抛出错误，否则页面上的 try/catch 捕获不到，会误以为请求成功！
            return Promise.reject(new Error(data.msg || '用户未登录'))
        }
        
        // 3. 其他业务报错状态
        ElMessage.error(data.msg || '请求失败')
        return Promise.reject(new Error(data.msg || '请求失败'))
    },
    (error) => {
        ElMessage.error(error.message || '网络异常')
        return Promise.reject(error)
    }
)

// ⚠️ 最佳实践：将导出放在最后，确保实例已经挂载了所有的拦截器
export default request
