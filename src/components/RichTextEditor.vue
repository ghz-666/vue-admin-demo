<template>
  <div class="rich-text-editor">
    <div class="editor-container">
      <WangToolbar 
        :editor="editorRef" 
        :defaultConfig="toolbarConfig" 
        mode="default" 
        class="editor-toolbar"
      />
      <WangEditor
        v-model="content"
        :defaultConfig="editorConfig"
        mode="default"
        class="wang-editor"
        @onCreated="handleEditorCreated"
        @onChange="handleEditorChange"
        @onDestroyed="handleEditorDestroyed"
      />
    </div>

    <div v-if="showWordCount" class="editor-footer">
      <div class="word-count">
        <span class="count-text">{{ currentCharCount }} / {{ maxCharCount }}</span>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: Math.min((currentCharCount / maxCharCount) * 100, 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import '@wangeditor/editor/dist/css/style.css'
import { Editor as WangEditor, Toolbar as WangToolbar } from '@wangeditor/editor-for-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  maxCharCount: {
    type: Number,
    default: 2000
  },
  showWordCount: {
    type: Boolean,
    default: true
  },
  showSecurityTip: {
    type: Boolean,
    default: true
  },
  toolbarKeys: {
    type: Array,
    default: () => [
      'bold', 'italic', 'underline', 'color', 'bgColor', '|',
      'fontSize', 'fontFamily', '|',
      'header1', 'header2', 'header3', '|',
      'bulletedList', 'numberedList', 'blockquote', '|',
      'insertLink', '|',
      'undo', 'redo'
    ]
  },
  minHeight: {
    type: String,
    default: '300px'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'created'])

const editorRef = shallowRef(null)
const currentCharCount = ref(0)

const content = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editorConfig = reactive({
  placeholder: props.placeholder,
  MENU_CONF: {
    fontSize: {
      fontSizeList: [
        '12px', '13px', '14px', '15px', '16px', '17px', '18px', 
        '19px', '20px', '22px', '24px', '26px', '28px', '30px', '32px'
      ]
    },
    fontFamily: {
      fontFamilyList: [
        'Arial',
        'Tahoma',
        'Verdana',
        '"Times New Roman"',
        '"Courier New"',
        '"Microsoft YaHei"',
        '"微软雅黑"',
        '"SimSun"',
        '"宋体"',
        '"SimHei"',
        '"黑体"',
        '"KaiTi"',
        '"楷体"'
      ]
    },
    color: {
      colors: [
        '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
        '#4A90E2', '#7ED321', '#F5A623', '#9013FE',
        '#FF6B6B', '#FF4757', '#FF3838', '#FF2D2D', '#DC3545',
        '#FFA502', '#FF6348', '#FF7675', '#FDCB6E', '#F39C12',
        '#FFC312', '#F1C40F', '#F39801', '#FFD93D', '#FFDD59',
        '#2ED573', '#1DD1A1', '#10AC84', '#00B894', '#00A085',
        '#3742FA', '#2F3542', '#40739E', '#487EB0', '#0984E3',
        '#8E44AD', '#9B59B6', '#A55EEA', '#3D5AFE', '#667AFA',
        '#FD79A8', '#E84393', '#FF7675', '#FF6B9D', '#FF5722'
      ]
    },
    bgColor: {
      colors: [
        '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA',
        '#E3F2FD', '#E8F5E8', '#FFF3E0', '#F3E5F5',
        '#FFEBEE', '#FCE4EC', '#F8BBD9', '#F48FB1',
        '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D',
        '#FFFDE7', '#FFF9C4', '#FFF176', '#FFEB3B',
        '#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784',
        '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6',
        '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8',
        '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0'
      ]
    },
    lineHeight: {
      lineHeightList: ['1', '1.15', '1.2', '1.5', '1.75', '2', '2.5', '3']
    }
  }
})

const toolbarConfig = reactive({
  toolbarKeys: props.toolbarKeys
})

const handleEditorCreated = (editor) => {
  editorRef.value = editor
  updateCharCount()
  emit('created', editor)
}

const handleEditorChange = (editor) => {
  updateCharCount()
  emit('change', {
    html: editor.getHtml(),
    text: editor.getText()
  })
}

const handleEditorDestroyed = () => {
  editorRef.value = null
}

const updateCharCount = () => {
  if (!editorRef.value) return
  const text = editorRef.value.getText().replace(/\s+/g, ' ').trim()
  currentCharCount.value = text.length
  if (currentCharCount.value > props.maxCharCount) {
    ElMessage.warning(`不能超过 ${props.maxCharCount} 字符`)
  }
}

const getHtml = () => editorRef.value?.getHtml() || ''
const getText = () => editorRef.value?.getText() || ''
const setHtml = (html) => editorRef.value?.setHtml(html)
const clear = () => editorRef.value?.clear()
const insertText = (text) => editorRef.value?.insertText(text)
const focus = () => editorRef.value?.focus()

defineExpose({
  getHtml, getText, setHtml, clear, insertText, focus, editor: editorRef
})

watch(() => props.placeholder, (val) => {
  editorConfig.placeholder = val
})

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
}
.editor-container {
  display: flex;
  flex-direction: column;
}
.editor-toolbar {
  border-bottom: 1px solid #e5e7eb;
}
.wang-editor {
  min-height: v-bind(minHeight);
}
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}
.word-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}
.count-text {
  font-weight: 500;
}
.progress-bar {
  width: 60px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4A90E2;
  transition: all 0.3s ease;
  border-radius: 2px;
}
</style>