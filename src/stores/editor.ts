import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ComponentData,
  ComponentEvent,
  ComponentStyle,
  Command,
  PageData,
  PageMeta
} from '@/types'
import { ComponentType } from '@/types'
import { useHistoryStore } from './history'
import { getComponentProtocol } from '@/components/components/registry'

const STORAGE_KEY = 'marketing-editor-page'
const SCHEMA_VERSION = '2026.03'
const GRID_SIZE = 10
const MIN_FORM_HEIGHT = 420

const createPageMeta = (title = '营销活动页'): PageMeta => ({
  title,
  description: '面向营销活动与落地页场景的低代码页面',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: SCHEMA_VERSION,
  scene: 'marketing'
})

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const createProtocolComponent = (
  type: ComponentType,
  overrides: {
    style?: Partial<ComponentStyle>
    props?: Record<string, unknown>
    events?: ComponentEvent[]
    name?: string
  } = {}
): ComponentData => {
  const protocol = getComponentProtocol(type)
  if (!protocol) {
    throw new Error(`Unknown component type: ${type}`)
  }

  return {
    id: `comp_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type,
    name: overrides.name || protocol.label,
    schemaVersion: SCHEMA_VERSION,
    style: {
      ...clone(protocol.defaultStyle),
      ...clone(overrides.style || {})
    },
    props: {
      ...clone(protocol.defaultProps),
      ...clone(overrides.props || {})
    } as ComponentData['props'],
    events: clone(overrides.events || [{ type: 'click', config: { action: 'none' } }])
  }
}

const createStarterComponents = (): ComponentData[] => [
  createProtocolComponent(ComponentType.TEXT, {
    name: '主标题',
    style: { top: 72, left: 72, width: 420, height: 80, fontSize: 36, fontWeight: 700, color: '#111827' },
    props: { content: '2026 春季增长活动，限时开启' }
  }),
  createProtocolComponent(ComponentType.TEXT, {
    name: '卖点描述',
    style: { top: 162, left: 72, width: 420, height: 72, fontSize: 16, fontWeight: 400, color: '#4b5563' },
    props: { content: '低代码搭建营销落地页，支持拖拽布局、图层管理、属性配置、实时预览与页面 JSON 导入导出。' }
  }),
  createProtocolComponent(ComponentType.BUTTON, {
    name: '主 CTA',
    style: { top: 258, left: 72, width: 180, height: 46, backgroundColor: '#2563eb', borderColor: '#2563eb' },
    props: { content: '立即报名' },
    events: [{ type: 'click', config: { action: 'url', url: 'https://example.com', newTab: true } }]
  }),
  createProtocolComponent(ComponentType.INPUT, {
    name: '手机号输入',
    style: { top: 258, left: 270, width: 220, height: 46, backgroundColor: '#ffffff', borderColor: '#d1d5db' },
    props: { placeholder: '请输入手机号', inputType: 'tel' }
  }),
  createProtocolComponent(ComponentType.IMAGE, {
    name: '活动主视觉',
    style: { top: 348, left: 72, width: 420, height: 240, backgroundColor: '#f3f4f6', borderRadius: 18 },
    props: { src: '', alt: '活动主视觉', objectFit: 'cover' }
  }),
  createProtocolComponent(ComponentType.FORM, {
    name: '报名表单',
    style: { top: 96, left: 600, width: 360, height: 420, backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
    props: { title: '活动报名信息', submitText: '提交线索' }
  })
].map((item, index) => ({
  ...item,
  style: {
    ...item.style,
    zIndex: index + 1
  }
}))

const createDefaultPage = (title = '营销活动页'): PageData => ({
  id: `page_${Date.now()}`,
  meta: createPageMeta(title),
  components: createStarterComponents(),
  style: {
    width: 1200,
    height: 820,
    backgroundColor: '#f9fafb',
    backgroundImage: ''
  }
})

const normalizeComponentLayout = (component: ComponentData, page: PageData): ComponentData => {
  const next = clone(component)
  const maxWidth = Math.max(120, page.style.width)
  const maxHeight = Math.max(120, page.style.height)

  next.style.width = Math.min(next.style.width, maxWidth)
  next.style.height = Math.min(next.style.height, maxHeight)

  if (next.type === ComponentType.FORM) {
    next.style.height = Math.max(next.style.height, MIN_FORM_HEIGHT)
    next.style.width = Math.max(next.style.width, 320)
  }

  next.style.left = Math.max(0, Math.min(next.style.left, Math.max(0, page.style.width - next.style.width)))
  next.style.top = Math.max(0, Math.min(next.style.top, Math.max(0, page.style.height - next.style.height)))

  return next
}

const normalizePageData = (page: PageData): PageData => {
  const nextPage = clone(page)
  nextPage.style.width = Math.max(nextPage.style.width || 1200, 960)
  nextPage.style.height = Math.max(nextPage.style.height || 820, 720)
  nextPage.style.backgroundColor = nextPage.style.backgroundColor || '#f9fafb'
  nextPage.style.backgroundImage = nextPage.style.backgroundImage || ''
  nextPage.meta.version = SCHEMA_VERSION
  nextPage.components = nextPage.components.map((component, index) => {
    const normalized = normalizeComponentLayout(component, nextPage)
    normalized.style.zIndex = index + 1
    return normalized
  })
  return nextPage
}

export const useEditorStore = defineStore('editor', () => {
  const currentPage = ref<PageData | null>(null)
  const currentComponent = ref<ComponentData | null>(null)
  const canvasScale = ref(0.9)
  const snapToGrid = ref(true)
  const showGuidelines = ref(true)
  const lastSavedAt = ref('')

  const touchPageMeta = () => {
    if (!currentPage.value) return
    currentPage.value.meta.updatedAt = new Date().toISOString()
  }

  const createNewPage = (title = '营销活动页') => {
    currentPage.value = normalizePageData(createDefaultPage(title))
    currentComponent.value = null
    lastSavedAt.value = ''
    persistPage()
  }

  const ensurePage = () => {
    if (!currentPage.value) createNewPage()
  }

  const addComponent = (
    type: ComponentType,
    initialData: {
      style?: Partial<ComponentStyle>
      props?: Record<string, unknown>
      events?: ComponentEvent[]
    } = {}
  ) => {
    ensurePage()
    if (!currentPage.value) return

    const protocol = getComponentProtocol(type)
    if (!protocol) return

    const historyStore = useHistoryStore()
    const nextZIndex = currentPage.value.components.length + 1
    const component = createProtocolComponent(type, {
      ...initialData,
      style: {
        zIndex: nextZIndex,
        ...initialData.style
      }
    })

    const command: Command = {
      label: `新增${protocol.label}`,
      execute: () => {
        if (!currentPage.value) return
        const normalized = normalizeComponentLayout(component, currentPage.value)
        currentPage.value.components.push(normalized)
        currentComponent.value = normalized
        touchPageMeta()
      },
      undo: () => {
        if (!currentPage.value) return
        const index = currentPage.value.components.findIndex((item) => item.id === component.id)
        if (index >= 0) currentPage.value.components.splice(index, 1)
        if (currentComponent.value?.id === component.id) currentComponent.value = null
        touchPageMeta()
      }
    }

    historyStore.executeCommand(command)
  }

  const selectComponent = (component: ComponentData | null) => {
    currentComponent.value = component
  }

  const commitComponentStyle = (componentId: string, nextStyle: ComponentStyle) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((item) => item.id === componentId)
    if (!component) return

    const prevStyle = clone(component.style)
    const nextComponent = normalizeComponentLayout({
      ...component,
      style: clone(nextStyle)
    }, currentPage.value)
    const newStyle = clone(nextComponent.style)

    useHistoryStore().executeCommand({
      label: '更新组件样式',
      execute: () => {
        component.style = clone(newStyle)
        touchPageMeta()
      },
      undo: () => {
        component.style = clone(prevStyle)
        touchPageMeta()
      }
    })
  }

  const applyComponentStyle = (componentId: string, styleUpdates: Partial<ComponentStyle>) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((item) => item.id === componentId)
    if (!component) return

    component.style = normalizeComponentLayout({ ...component, style: {
      ...component.style,
      ...styleUpdates
    } }, currentPage.value).style
  }

  const commitComponentProps = (componentId: string, nextProps: ComponentData['props']) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((item) => item.id === componentId)
    if (!component) return

    const prevProps = clone(component.props)
    const newProps = clone(nextProps)

    useHistoryStore().executeCommand({
      label: '更新组件属性',
      execute: () => {
        component.props = clone(newProps)
        touchPageMeta()
      },
      undo: () => {
        component.props = clone(prevProps)
        touchPageMeta()
      }
    })
  }

  const commitComponentEvents = (componentId: string, nextEvents: ComponentEvent[]) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((item) => item.id === componentId)
    if (!component) return

    const prevEvents = clone(component.events)
    const newEvents = clone(nextEvents)

    useHistoryStore().executeCommand({
      label: '更新组件事件',
      execute: () => {
        component.events = clone(newEvents)
        touchPageMeta()
      },
      undo: () => {
        component.events = clone(prevEvents)
        touchPageMeta()
      }
    })
  }

  const deleteComponent = (componentId: string) => {
    if (!currentPage.value) return

    const index = currentPage.value.components.findIndex((item) => item.id === componentId)
    if (index < 0) return

    const rawComponent = currentPage.value.components[index]
    if (!rawComponent) return
    const component = clone(rawComponent)
    const wasSelected = currentComponent.value?.id === componentId

    useHistoryStore().executeCommand({
      label: '删除组件',
      execute: () => {
        currentPage.value?.components.splice(index, 1)
        if (wasSelected) currentComponent.value = null
        touchPageMeta()
      },
      undo: () => {
        currentPage.value?.components.splice(index, 0, component)
        if (wasSelected) currentComponent.value = component
        touchPageMeta()
      }
    })
  }

  const moveComponentLayer = (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!currentPage.value) return

    const before = clone(currentPage.value.components)
    const next = clone(currentPage.value.components)
    const index = next.findIndex((item) => item.id === componentId)
    if (index < 0) return

    if (direction === 'up' && index < next.length - 1) {
      const item = next[index]
      if (!item) return
      next.splice(index, 1)
      next.splice(index + 1, 0, item)
    } else if (direction === 'down' && index > 0) {
      const item = next[index]
      if (!item) return
      next.splice(index, 1)
      next.splice(index - 1, 0, item)
    } else if (direction === 'top') {
      const item = next.splice(index, 1)[0]
      if (!item) return
      next.push(item)
    } else if (direction === 'bottom') {
      const item = next.splice(index, 1)[0]
      if (!item) return
      next.unshift(item)
    } else {
      return
    }

    next.forEach((item, order) => {
      item.style.zIndex = order + 1
    })

    useHistoryStore().executeCommand({
      label: '调整图层',
      execute: () => {
        if (!currentPage.value) return
        currentPage.value.components = clone(next)
        currentComponent.value = currentPage.value.components.find((item) => item.id === componentId) || null
        touchPageMeta()
      },
      undo: () => {
        if (!currentPage.value) return
        currentPage.value.components = clone(before)
        currentComponent.value = currentPage.value.components.find((item) => item.id === componentId) || null
        touchPageMeta()
      }
    })
  }

  const updatePageMeta = (metaUpdates: Partial<PageMeta>) => {
    if (!currentPage.value) return
    currentPage.value.meta = {
      ...currentPage.value.meta,
      ...metaUpdates,
      updatedAt: new Date().toISOString()
    }
  }

  const updatePageStyle = (styleUpdates: Partial<PageData['style']>) => {
    if (!currentPage.value) return
    currentPage.value.style = {
      ...currentPage.value.style,
      ...styleUpdates
    }
    touchPageMeta()
  }

  const exportPageData = () => (currentPage.value ? JSON.stringify(currentPage.value, null, 2) : null)

  const importPageData = (payload: string) => {
    const parsed = normalizePageData(JSON.parse(payload) as PageData)
    currentPage.value = parsed
    currentComponent.value = null
    touchPageMeta()
  }

  const persistPage = () => {
    if (!currentPage.value) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPage.value))
    lastSavedAt.value = new Date().toLocaleString('zh-CN')
  }

  const loadPersistedPage = () => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      createNewPage()
      return
    }

    try {
      currentPage.value = normalizePageData(JSON.parse(raw) as PageData)
      currentComponent.value = null
    } catch {
      createNewPage()
    }
  }

  const nudgeComponent = (componentId: string, deltaX: number, deltaY: number) => {
    if (!currentPage.value) return
    const component = currentPage.value.components.find((item) => item.id === componentId)
    if (!component) return

    commitComponentStyle(componentId, {
      ...component.style,
      left: Math.max(0, component.style.left + deltaX),
      top: Math.max(0, component.style.top + deltaY)
    })
  }

  return {
    GRID_SIZE,
    currentPage: computed(() => currentPage.value),
    currentComponent: computed(() => currentComponent.value),
    canvasScale: computed(() => canvasScale.value),
    snapToGrid: computed(() => snapToGrid.value),
    showGuidelines: computed(() => showGuidelines.value),
    lastSavedAt: computed(() => lastSavedAt.value),
    createNewPage,
    loadPersistedPage,
    persistPage,
    addComponent,
    selectComponent,
    commitComponentStyle,
    applyComponentStyle,
    commitComponentProps,
    commitComponentEvents,
    deleteComponent,
    moveComponentLayer,
    updatePageMeta,
    updatePageStyle,
    exportPageData,
    importPageData,
    nudgeComponent,
    setCanvasScale: (scale: number) => (canvasScale.value = scale),
    setSnapToGrid: (enabled: boolean) => (snapToGrid.value = enabled),
    setShowGuidelines: (enabled: boolean) => (showGuidelines.value = enabled)
  }
})
