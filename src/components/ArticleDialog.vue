<template>
    <el-dialog :title="isEdit ? '编辑文章' : '文章详情'" 
    v-model="dialogVisible" 
    width="80%"
    @close="handleClose"
    >
    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="文章标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入文章标题" maxlength="200" show-word-limit clearable />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
            <el-select v-model="formData.categoryId" placeholder="请选择所属分类">
                <el-option v-for="item in categories" :key="item.id" :label="item.label" :value="item.value" />
            </el-select>
        </el-form-item>
        <el-form-item label="文章摘要" prop="summary">
            <el-input  type="textarea" v-model="formData.summary" placeholder="请输入文章摘要" maxlength="2000" show-word-limit clearable :rows="4" />
        </el-form-item>
        <el-form-item label="文章标签" prop="tags">
            <el-select v-model="formData.tags" placeholder="请输入文章标签" maxlength="200" multiple filterable width="100%" >
                <el-option v-for="item in commonTags" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <el-form-item label="封面图片">
            <div class="cover-upload">
                <el-upload
                    class="avatar-uploader"
                    action="#"
                    :before-upload="beforeUpload"
                    :http-request="handleUpRequest"
                    accept="image/*"
                    :show-file-list="false"
                >
                <div v-if="!coverImage" class="cover-placeholder">
                    <p>点击上传封面图片</p>
                </div>
                    <img v-else :src="coverImage" alt="封面图片" class="cover-image" />
                </el-upload>
                <el-button style="margin-left: 10px;" size="small" type="primary" @click="handleRemove">删除</el-button>
            </div>
        </el-form-item>
        <el-form-item label="文章内容" prop="content">
            <RichTextEditor 
            v-model="formData.content"
            :max-char-count="2000"
            @change="handleEditorChange"
            placeholder="请输入文章内容"
            @created="handleEditorCreated"
            min-height="400px"
            />
        </el-form-item>
    </el-form>
    <template #footer>
            <el-button type="primary" @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit">{{isEdit ? '更新' : '提交'}}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref,computed,reactive,nextTick,watch} from 'vue'
import { uploadFile } from '@/api/admin'
import { ElMessage } from 'element-plus'
import RichTextEditor from '../components/RichTextEditor.vue'
import { fileBaseUrl } from '@/config/index'
import { addArticle, updateArticle } from '@/api/admin'
const formRef = ref(null)
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  if (!isJPG && !isPNG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
    return false
  }
}
const businessID = ref('')
const handleUpRequest = async ({file})=> {
    businessID.value = crypto.randomUUID()
    const fileRes=await uploadFile(file,{
        businessId: businessID.value
    })
    console.log(fileRes)
    coverImage.value = `${fileBaseUrl}${fileRes.filePath}`
    formData.coverImage = fileRes.filePath
}
const coverImage = ref('')
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
  ,
  categories: {
    type: Array,
    default: () => []
  }
  ,
  currentArticle: {
    type: Object,
    default: null
  }
})
const handleClose = () => {
  emit('update:modelValue', false)
  formRef.value?.resetFields()
  businessID.value = ''
  coverImage.value = ''

}
const handleRemove = () => {
    coverImage.value = ''
    formData.coverImage = ''
}
const emit = defineEmits(['update:modelValue','submit'])
const dialogVisible = computed({
    get(){
        return props.modelValue
    },
    set(val){
        emit('update:modelValue',val)
    }
   })
const formData = reactive({
    "title": "",
    "content": "",
    "coverImage": "",
    "categoryId": 0,
    "summary": "",
    "tags": [],
    "id": ""
})
const rules = reactive({
    title: [
        { required: true, message: '请输入文章标题', trigger: 'blur' }
    ],
    categoryId: [
        { required: true, message: '请选择所属分类', trigger: 'change' }
    ],
    summary: [
        { required: true, message: '请输入文章摘要', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入文章内容', trigger: 'blur' },
        { min: 1, max: 2000, message: '文章内容长度必须在 100 到 2000 个字符之间', trigger: 'blur' }
    ],
    tags: [
        { required: true, message: '请选择文章标签', trigger: 'change' }
    ],
})
const commonTags = [ '情绪管理','焦虑','抑郁','压力','睡眠','冥想','正念','放松','心理健康','自我成长','人际关系','工作压力','学习方法','生活技巧' ]
const handleEditorChange = (data) => {
    formData.content = data.html
}
const editorRef = ref(null)

const handleEditorCreated = (editor) => {
  editorRef.value = editor
  if (editor) {
    nextTick(() => {
      editor.setHtml(formData.content || '')
    })
  }
}
const handleSubmit = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  try {
    const submitData = {
      ...formData,
      tags: Array.isArray(formData.tags) ? formData.tags.join(',') : formData.tags
    }

    if (isEdit.value) {
      // 编辑模式：使用更新接口
      await updateArticle(submitData)
      ElMessage.success('更新成功')
    } else {
      // 新增模式：使用创建接口
      await addArticle(submitData)
      ElMessage.success('提交成功')
    }
    dialogVisible.value = false
    emit('submit')
  } catch (err) {
    console.error(err)
    ElMessage.error(isEdit.value ? '更新失败' : '提交失败')
  }
}
const isEdit = computed(() => !!props.currentArticle?.id)
watch(() => props.currentArticle, (newVal) => {
  if (newVal) {
    Object.assign(formData, newVal)
    // 确保 tags 是数组格式
    if (typeof formData.tags === 'string') {
      formData.tags = formData.tags ? formData.tags.split(',') : []
    }
    businessID.value = newVal.id
    coverImage.value = `${fileBaseUrl}${newVal.coverImage}`
  }
})

</script>

<style lang="scss" scoped>
.cover-upload{
  display: flex;
  align-items: center;
  gap: 10px;
}
.cover-placeholder{
  width: 120px;
  height: 120px;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8b949e;
}
.cover-image{
  width: 100px;
  height: 100px;
  display: block;
}
</style>
