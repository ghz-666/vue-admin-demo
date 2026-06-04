<template>
  <div class="property-panel">
    <div class="panel-header">
      <div>
        <h3>配置面板</h3>
        <p>{{ currentComponent ? currentComponent.name : '页面级配置 / 组件配置' }}</p>
      </div>
      <el-button v-if="currentComponent" type="danger" size="small" @click="deleteCurrentComponent">删除</el-button>
    </div>

    <div class="property-content">
      <el-scrollbar>
        <div class="property-section">
          <h4>页面信息</h4>
          <div class="property-grid">
            <div class="property-item">
              <label>页面标题</label>
              <el-input v-model="pageTitle" @change="commitPageMeta" />
            </div>
            <div class="property-item">
              <label>页面描述</label>
              <el-input v-model="pageDescription" type="textarea" :rows="3" @change="commitPageMeta" />
            </div>
            <div class="property-item">
              <label>场景</label>
              <el-select v-model="pageScene" @change="commitPageMeta">
                <el-option label="营销活动" value="marketing" />
                <el-option label="落地页" value="landing" />
                <el-option label="表单页" value="form" />
              </el-select>
            </div>
            <div class="property-item">
              <label>页面宽度</label>
              <el-input-number v-model="pageWidth" :min="320" :step="10" @change="commitPageStyle" />
            </div>
            <div class="property-item">
              <label>页面高度</label>
              <el-input-number v-model="pageHeight" :min="400" :step="10" @change="commitPageStyle" />
            </div>
            <div class="property-item">
              <label>背景色</label>
              <el-color-picker v-model="pageBgColor" @change="commitPageStyle" />
            </div>
            <div class="property-item full-width">
              <label>背景样式</label>
              <el-input v-model="pageBgImage" placeholder="可填写 url(...)，留空则使用纯色背景" @change="commitPageStyle" />
            </div>
          </div>
        </div>

        <template v-if="currentComponent && localStyle && localProps">
          <div class="property-section">
            <h4>位置和大小</h4>
            <div class="property-grid two-columns">
              <div class="property-item"><label>X</label><el-input-number v-model="localStyle.left" :min="0" @change="commitStyle" /></div>
              <div class="property-item"><label>Y</label><el-input-number v-model="localStyle.top" :min="0" @change="commitStyle" /></div>
              <div class="property-item"><label>宽度</label><el-input-number v-model="localStyle.width" :min="40" @change="commitStyle" /></div>
              <div class="property-item"><label>高度</label><el-input-number v-model="localStyle.height" :min="40" @change="commitStyle" /></div>
              <div class="property-item"><label>旋转</label><el-input-number v-model="localStyle.rotate" :min="-180" :max="180" @change="commitStyle" /></div>
              <div class="property-item"><label>透明度</label><el-slider v-model="localStyle.opacity" :min="0" :max="1" :step="0.1" @change="commitStyle" /></div>
            </div>
          </div>

          <div class="property-section">
            <h4>图层管理</h4>
            <div class="property-buttons">
              <el-button-group>
                <el-button @click="moveLayer('up')">上移</el-button>
                <el-button @click="moveLayer('down')">下移</el-button>
                <el-button @click="moveLayer('top')">置顶</el-button>
                <el-button @click="moveLayer('bottom')">置底</el-button>
              </el-button-group>
            </div>
          </div>

          <div class="property-section">
            <h4>样式设置</h4>
            <div class="property-grid two-columns">
              <div class="property-item"><label>字体大小</label><el-input-number v-model="localStyle.fontSize" :min="8" :max="72" @change="commitStyle" /></div>
              <div class="property-item"><label>字重</label><el-input-number v-model="localStyle.fontWeight" :min="100" :max="900" :step="100" @change="commitStyle" /></div>
              <div class="property-item"><label>文字颜色</label><el-color-picker v-model="localStyle.color" @change="commitStyle" /></div>
              <div class="property-item"><label>背景颜色</label><el-color-picker v-model="localStyle.backgroundColor" @change="commitStyle" /></div>
              <div class="property-item"><label>边框宽度</label><el-input-number v-model="localStyle.borderWidth" :min="0" :max="10" @change="commitStyle" /></div>
              <div class="property-item"><label>圆角</label><el-input-number v-model="localStyle.borderRadius" :min="0" :max="999" @change="commitStyle" /></div>
              <div class="property-item"><label>边框颜色</label><el-color-picker v-model="localStyle.borderColor" @change="commitStyle" /></div>
              <div class="property-item"><label>对齐方式</label><el-select v-model="localStyle.textAlign" @change="commitStyle"><el-option label="左对齐" value="left" /><el-option label="居中" value="center" /><el-option label="右对齐" value="right" /></el-select></div>
            </div>
          </div>

          <div class="property-section">
            <h4>组件属性</h4>
            <div class="property-grid">
              <template v-if="currentComponent.type === 'Text'">
                <div class="property-item full-width"><label>文本内容</label><el-input v-model="(localProps as Record<string, unknown>).content" type="textarea" :rows="4" @change="commitProps" /></div>
              </template>
              <template v-else-if="currentComponent.type === 'Image'">
                <div class="property-item full-width"><label>图片地址</label><el-input v-model="(localProps as Record<string, unknown>).src" @change="commitProps" /></div>
                <div class="property-item"><label>填充模式</label><el-select v-model="(localProps as Record<string, unknown>).objectFit" @change="commitProps"><el-option label="cover" value="cover" /><el-option label="contain" value="contain" /><el-option label="fill" value="fill" /></el-select></div>
              </template>
              <template v-else-if="currentComponent.type === 'Button'">
                <div class="property-item full-width"><label>按钮文案</label><el-input v-model="(localProps as Record<string, unknown>).content" @change="commitProps" /></div>
              </template>
              <template v-else-if="currentComponent.type === 'Input'">
                <div class="property-item full-width"><label>占位文本</label><el-input v-model="(localProps as Record<string, unknown>).placeholder" @change="commitProps" /></div>
                <div class="property-item"><label>输入类型</label><el-select v-model="(localProps as Record<string, unknown>).inputType" @change="commitProps"><el-option label="text" value="text" /><el-option label="email" value="email" /><el-option label="tel" value="tel" /><el-option label="number" value="number" /></el-select></div>
              </template>
              <template v-else-if="currentComponent.type === 'Form'">
                <div class="property-item full-width"><label>表单标题</label><el-input v-model="(localProps as Record<string, unknown>).title" @change="commitProps" /></div>
                <div class="property-item full-width"><label>提交按钮文案</label><el-input v-model="(localProps as Record<string, unknown>).submitText" @change="commitProps" /></div>
              </template>
            </div>
          </div>

          <div class="property-section">
            <h4>事件配置</h4>
            <div class="property-grid" v-if="localEventConfig">
              <div class="property-item"><label>点击动作</label><el-select v-model="localEventConfig.action" @change="commitEvents"><el-option label="无动作" value="none" /><el-option label="打开链接" value="url" /><el-option label="提示消息" value="message" /></el-select></div>
              <div class="property-item full-width" v-if="localEventConfig.action === 'url'"><label>链接地址</label><el-input v-model="localEventConfig.url" @change="commitEvents" /></div>
              <div class="property-item" v-if="localEventConfig.action === 'url'"><label>新窗口打开</label><el-switch v-model="localEventConfig.newTab" @change="commitEvents" /></div>
              <div class="property-item full-width" v-if="localEventConfig.action === 'message'"><label>提示内容</label><el-input v-model="localEventConfig.message" @change="commitEvents" /></div>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <el-icon><InfoFilled /></el-icon>
          <p>当前未选中组件，可先配置页面，再从左侧拖入组件。</p>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { InfoFilled } from '@element-plus/icons-vue'
import type { ClickEventAction, ComponentData, ComponentStyle } from '@/types'

const editorStore = useEditorStore()
const currentComponent = computed(() => editorStore.currentComponent)
const currentPage = computed(() => editorStore.currentPage)

const pageTitle = ref('')
const pageDescription = ref('')
const pageScene = ref<'marketing' | 'landing' | 'form'>('marketing')
const pageWidth = ref(1200)
const pageHeight = ref(800)
const pageBgColor = ref('#ffffff')
const pageBgImage = ref('')

const localStyle = ref<ComponentStyle | null>(null)
const localProps = ref<ComponentData['props'] | null>(null)
const localEventConfig = ref<ClickEventAction | null>(null)

watch(currentPage, (page) => {
  if (!page) return
  pageTitle.value = page.meta.title
  pageDescription.value = page.meta.description
  pageScene.value = page.meta.scene
  pageWidth.value = page.style.width
  pageHeight.value = page.style.height
  pageBgColor.value = page.style.backgroundColor
  pageBgImage.value = page.style.backgroundImage || ''
}, { immediate: true, deep: true })

const clone = <T>(val: T): T => JSON.parse(JSON.stringify(toRaw(val)))

watch(currentComponent, (component) => {
  localStyle.value = component ? clone(component.style) : null
  localProps.value = component ? clone(component.props) : null
  localEventConfig.value = component?.events?.[0]?.config ? clone(component.events[0].config) : { action: 'none' }
}, { immediate: true, deep: true })

const commitPageMeta = () => {
  editorStore.updatePageMeta({ title: pageTitle.value, description: pageDescription.value, scene: pageScene.value })
}

const commitPageStyle = () => {
  editorStore.updatePageStyle({ width: pageWidth.value, height: pageHeight.value, backgroundColor: pageBgColor.value, backgroundImage: pageBgImage.value })
}

const commitStyle = () => {
  if (!currentComponent.value || !localStyle.value) return
  editorStore.commitComponentStyle(currentComponent.value.id, clone(localStyle.value))
}

const commitProps = () => {
  if (!currentComponent.value || !localProps.value) return
  editorStore.commitComponentProps(currentComponent.value.id, clone(localProps.value))
}

const commitEvents = () => {
  if (!currentComponent.value || !localEventConfig.value) return
  editorStore.commitComponentEvents(currentComponent.value.id, [{ type: 'click', config: clone(localEventConfig.value) }])
}

const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (!currentComponent.value) return
  editorStore.moveComponentLayer(currentComponent.value.id, direction)
}

const deleteCurrentComponent = () => {
  if (!currentComponent.value) return
  editorStore.deleteComponent(currentComponent.value.id)
}
</script>

<style scoped>
.property-panel { width: 340px; background: #fff; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.panel-header { padding: 18px; border-bottom: 1px solid #eef2f7; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.panel-header h3 { margin: 0; font-size: 16px; color: #111827; }
.panel-header p { margin: 6px 0 0; font-size: 12px; color: #6b7280; }
.property-content { flex: 1; min-height: 0; }
.property-section { padding: 16px; border-bottom: 1px solid #f3f4f6; }
.property-section h4 { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #374151; }
.property-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.property-grid.two-columns { grid-template-columns: 1fr 1fr; }
.property-item { display: flex; flex-direction: column; gap: 6px; }
.property-item.full-width { grid-column: 1 / -1; }
.property-item label { font-size: 12px; color: #6b7280; font-weight: 600; }
.property-buttons .el-button-group { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.empty-state { padding: 32px 20px; color: #9ca3af; text-align: center; }
.empty-state .el-icon { font-size: 40px; margin-bottom: 12px; }
</style>
