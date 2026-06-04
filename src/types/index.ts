export interface ComponentStyle {
  top: number
  left: number
  width: number
  height: number
  zIndex: number
  rotate: number
  opacity: number
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  color?: string
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius?: number
  textAlign?: 'left' | 'center' | 'right'
}

export interface ClickEventAction {
  action: 'none' | 'url' | 'message'
  url?: string
  message?: string
  newTab?: boolean
}

export interface ComponentEvent {
  type: 'click'
  config: ClickEventAction
}

export interface TextProps {
  content: string
}

export interface ImageProps {
  src: string
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

export interface ButtonProps {
  content: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface InputProps {
  placeholder: string
  value?: string
  inputType?: 'text' | 'email' | 'tel' | 'number'
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel'
  placeholder: string
  required?: boolean
}

export interface FormProps {
  title: string
  submitText: string
  fields: FormField[]
}

export type ComponentPropsMap = {
  [ComponentType.TEXT]: TextProps
  [ComponentType.IMAGE]: ImageProps
  [ComponentType.BUTTON]: ButtonProps
  [ComponentType.INPUT]: InputProps
  [ComponentType.FORM]: FormProps
}

export type ComponentProps = ComponentPropsMap[ComponentType]

export interface ComponentData<T extends ComponentType = ComponentType> {
  id: string
  type: T
  name: string
  style: ComponentStyle
  props: ComponentPropsMap[T]
  events: ComponentEvent[]
  schemaVersion: string
}

export interface PageStyle {
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
}

export interface PageMeta {
  title: string
  description: string
  createdAt: string
  updatedAt: string
  version: string
  scene: 'marketing' | 'landing' | 'form'
}

export interface PageData {
  id: string
  meta: PageMeta
  components: ComponentData[]
  style: PageStyle
}

export enum ComponentType {
  TEXT = 'Text',
  IMAGE = 'Image',
  BUTTON = 'Button',
  INPUT = 'Input',
  FORM = 'Form'
}

export interface Command {
  label?: string
  execute(): void
  undo(): void
}

export interface EditorState {
  currentPage: PageData | null
  currentComponent: ComponentData | null
  canvasScale: number
  snapToGrid: boolean
  showGuidelines: boolean
}

export interface HistoryState {
  undoStack: Command[]
  redoStack: Command[]
  maxHistorySize: number
}

export interface ComponentSchemaField {
  key: string
  label: string
  type: 'string' | 'number' | 'color' | 'select' | 'array'
  options?: string[]
}

export interface ComponentProtocol<T extends ComponentType = ComponentType> {
  type: T
  label: string
  category: '基础' | '营销'
  description: string
  defaultStyle: ComponentStyle
  defaultProps: ComponentPropsMap[T]
  schema: ComponentSchemaField[]
}
