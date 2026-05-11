<template>
    <div class="container">
        <div class="title">
            <div class="back-home">
                <el-icon>
                    <Back />
                </el-icon>
                <span>返回首页</span>
            </div>
            <div class="title-text">
                <h2>登录你的账户</h2>
                <p>请输入你的登陆信息</p>
            </div>
        </div>
        <div class="form-container">
             <el-form
            ref="ruleFormRef"
            style="max-width:600px"
            :model="ruleForm"
            :rules="rules"
            label-width="auto"
            class="demo-ruleForm"
        >
    <el-form-item label="用户名" prop="username">
      <el-input v-model="ruleForm.username" type="text" autocomplete="off"  />
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="ruleForm.password" type="password" autocomplete="off" show-password />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleLogin">登录</el-button>
    </el-form-item>
    </el-form>
            <div class="footer">
                <p>还没有账号？<router-link to="/auth/register">去注册</router-link></p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { login } from '@/api/admin'
import { ElMessage } from 'element-plus'
import router from '@/router'
const route = useRoute()
const ruleForm = reactive({
    password: '',
    username: '',
})
const rules = reactive({
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
    ],
})
/* 登录表单引用, 用于校验表单数据 */
const ruleFormRef = ref(null)
const handleLogin = async () => {
    try{
    const valid = await ruleFormRef.value.validate()
    if(!valid) return
    const res = await login(ruleForm)
    const userType = Number(res.userInfo?.userType)

    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.userInfo))

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

    if (userType === 2) {
      router.push(redirect.startsWith('/back') ? redirect : '/back')
    } else if (userType === 1) {
      router.push(redirect.startsWith('/user') ? redirect : '/user')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.error('账号类型异常')
      return
    }

    ElMessage.success('登录成功')
        
    }
    catch(error){
       if (error?.username || error?.password) {
    return
  }
  // 其他错误（密码错误、无权限等）才弹窗
  ElMessage.error(error?.message || '登录失败')
}
}
</script>

<style lang="scss" scoped>
/* 样式部分不变，省略... */
.container {
    width: 384px;

    .title {
        .back-home {
            margin-bottom: 60px;
        }

        .title-text {
            text-align: center;

            h2 {
                margin-bottom: 10px;
                font-size: 36px;
            }

            p {
                font-size: 18px;
                color: #6b7280;
            }
        }
    }

    .form-container {
        margin-top: 60px;

        .btn {
            margin-top: 40px;
            width: 100%;
        }

        .footer {
            margin-top: 20px;
            text-align: center;
        }
    }
}
</style>
