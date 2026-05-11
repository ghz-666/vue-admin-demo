<template>
  <div class="register-container">
    <div class="title">
      <div class="back-home" @click="router.push('/auth/login')">
        <el-icon>
          <Back />
        </el-icon>
        <span>返回登录</span>
      </div>
      <div class="title-text">
        <h2>创建用户账户</h2>
        <p>注册后可使用 AI 咨询、情绪日记和知识阅读</p>
      </div>
    </div>

    <div class="form-container">
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="86px"
        class="register-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="ruleForm.username" autocomplete="off" />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="ruleForm.nickname" autocomplete="off" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="ruleForm.email" autocomplete="off" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="ruleForm.phone" autocomplete="off" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="ruleForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="ruleForm.password" type="password" autocomplete="off" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="ruleForm.confirmPassword"
            type="password"
            autocomplete="off"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button class="submit-btn" type="primary" :loading="submitting" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <p>已有账号？<router-link to="/auth/login">去登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { registerUser } from '@/api/user'

const router = useRouter()
const ruleFormRef = ref(null)
const submitting = ref(false)

const ruleForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  gender: 1,
  password: '',
  confirmPassword: '',
  userType: 1
})

const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }

  if (value !== ruleForm.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' }
  ],
  nickname: [{ max: 20, message: '昵称不能超过 20 个字符', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: 'blur'
    }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为 6-32 个字符', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

const handleRegister = async () => {
  try {
    const valid = await ruleFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    await registerUser({ ...ruleForm, userType: 1 })
    ElMessage.success('注册成功，请登录')
    router.push('/auth/login')
  } catch (error) {
    if (error && typeof error === 'object' && !error.message) return
    ElMessage.error(error?.message || '注册失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  width: min(460px, 88vw);

  .title {
    .back-home {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 36px;
      color: #4b5563;
      cursor: pointer;
      user-select: none;
    }

    .title-text {
      text-align: center;

      h2 {
        margin-bottom: 10px;
        font-size: 34px;
      }

      p {
        font-size: 16px;
        color: #6b7280;
        line-height: 1.6;
      }
    }
  }

  .form-container {
    margin-top: 34px;

    .register-form {
      width: 100%;
    }

    .submit-btn {
      width: 100%;
    }

    .footer {
      margin-top: 18px;
      text-align: center;
      color: #6b7280;
    }
  }
}
</style>
