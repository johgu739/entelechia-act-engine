/**
 * ✅ ENTELECHIA: Navigation Metadata Types
 * 
 * TypeScript types for navigation FORM metadata.
 * These types define the structure that drives navigation code generation.
 * 
 * PRINCIPLE: Navigation FORM is separate from contract FORM.
 * Navigation describes UI structure, not data structure.
 */

/**
 * UIRealmForm - Realm structure definition
 */
export interface UIRealmForm {
  layout: 'standard' | 'fullscreen' | 'minimal'
  navigation: 'sidebar' | 'none' | 'tabs'
  header: 'fixed' | 'none' | 'scrollable'
  scroll: 'content' | 'none' | 'full'
}

/**
 * UIRealmLayout - Realm geometry definition
 */
export interface UIRealmLayout {
  sidebarWidthPercent: number
  headerHeightPx: number
  contentPaddingPx: number
}

/**
 * UIRealmDefinition - Complete realm definition
 * This is the FORM - the essence that drives realm code generation
 */
export interface UIRealmDefinition {
  id: string
  name: string
  form: UIRealmForm
  telos: string
  layout: UIRealmLayout
}

/**
 * UIRealmsMetadata - Complete metadata for all UI realms
 */
export interface UIRealmsMetadata {
  version: number
  realms: UIRealmDefinition[]
}

/**
 * NavigationItem - Single navigation item
 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: string
}

/**
 * NavigationShellHeader - Header configuration
 */
export interface NavigationShellHeader {
  title: string
  showAccountMenu: boolean
}

/**
 * NavigationShellNav - Navigation configuration
 */
export interface NavigationShellNav {
  type: 'tabs' | 'links' | 'none'
  items: NavigationItem[]
}

/**
 * NavigationShell - Complete navigation shell definition
 * This is the FORM - the essence that drives navigation shell code generation
 */
export interface NavigationShell {
  realmId: string
  header: NavigationShellHeader
  primaryNav: NavigationShellNav
  secondaryNav?: NavigationShellNav
}

/**
 * NavigationShellsMetadata - Complete metadata for all navigation shells
 */
export interface NavigationShellsMetadata {
  version: number
  shells: NavigationShell[]
}

/**
 * NodeDetailSection - Single section definition
 */
export interface NodeDetailSection {
  id: string
  label: string
  pathSuffix: string
  default?: boolean
}

/**
 * NodeDetailSectionsMetadata - Complete metadata for node detail sections
 */
export interface NodeDetailSectionsMetadata {
  version: number
  sections: NodeDetailSection[]
}

/**
 * ChatLayout - Chat container layout definition
 */
export interface ChatLayout {
  container: {
    layout: string
    height: string
    minHeight: number
    background: string
    darkBackground: string
  }
  scrollRegion: {
    flex: number
    minHeight: number
    overflowY: string
    overflowX: string
    paddingX: number
    paddingY: number
    maxWidth: number
    centerContent: boolean
  }
  emptyState: {
    text: string
    fontSize: string
    color: string
    darkColor: string
    paddingY: number
  }
  messageList: {
    spacing: number
    sameSenderSpacing: number
    differentSenderSpacing: number
  }
  message: {
    maxWidth: string
    borderRadius: string
    paddingX: number
    paddingY: number
    fontSize: string
    lineHeight: string
    whitespace: string
    user: {
      background: string
      border: string
      textColor: string
      alignment: string
    }
    assistant: {
      background: string
      darkBackground: string
      textColor: string
      darkTextColor: string
      alignment: string
    }
    timestamp: {
      fontSize: string
      color: string
      darkColor: string
      marginTop: number
    }
  }
  inputBar: {
    flexShrink: number
    borderTop: string
    darkBorderTop: string
    background: string
    darkBackground: string
    paddingX: number
    paddingY: number
    shadow: string
    maxWidth: number
    centerContent: boolean
    input: {
      flex: number
      background: string
      darkBackground: string
      borderRadius: string
      paddingX: number
      paddingY: number
      border: string
      darkBorder: string
      fontSize: string
      lineHeight: string
      minHeight: number
      maxHeight: number
      placeholder: string
      focus: {
        outline: string
        border: string
        darkBorder: string
        background: string
        darkBackground: string
      }
    }
    sendButton: {
      padding: number
      borderRadius: string
      color: string
      hoverColor: string
      darkColor: string
      darkHoverColor: string
      disabledOpacity: number
      iconSize: string
      iconStroke: string
    }
  }
  changeInspector?: {
    enabled: boolean
    maxWidth: number
    centerContent: boolean
    marginTop: number
    paddingTop: number
    borderTop: string
    darkBorderTop: string
    title: {
      fontSize: string
      fontWeight: string
      color: string
      darkColor: string
      marginBottom: number
    }
    content: {
      fontSize: string
      color: string
      darkColor: string
    }
  }
}

/**
 * ChatLayoutMetadata - Complete metadata for chat layout
 */
export interface ChatLayoutMetadata {
  version: number
  chat: ChatLayout
}

/**
 * WorkspaceSidebarTree - Tree configuration
 */
export interface WorkspaceSidebarTree {
  rootNodeIds: string[]
  maxDepth: number
  defaultExpanded: boolean
  showExpandButtons: boolean
  nodeTypes: Array<{
    type: string
    icon: string | null
    showInTree: boolean
    defaultExpanded: boolean
  }>
}

/**
 * WorkspaceSidebarStyling - Visual styling configuration
 */
export interface WorkspaceSidebarStyling {
  nodeTextSize: string
  nodeTextWeight: string
  nodeTextFamily: string
  nodeLineHeight: string
  horizontalPadding: number
  verticalPadding: number
  nodeSpacing: number
  indentPerLevel: number
  defaultTextColor: string
  selectedTextColor: string
  selectedBackground: string
  hoverBackground: string
  transitionDuration: number
  transitionEasing: string
}

/**
 * WorkspaceSidebarHeader - Header configuration
 */
export interface WorkspaceSidebarHeader {
  showHeader: boolean
  title: string
  titleSize: string
  titleWeight: string
  titleColor: string
  showDataFreshness: boolean
  showCollapseButton: boolean
}

/**
 * WorkspaceSidebarBehavior - Behavior configuration
 */
export interface WorkspaceSidebarBehavior {
  highlightSource: 'url' | 'store'
  enableHoverPreload: boolean
  cacheTreeStructure: boolean
  allowScroll: boolean
}

/**
 * WorkspaceSidebar - Complete workspace sidebar definition
 * This is the FORM - the essence that drives sidebar code generation
 */
export interface WorkspaceSidebar {
  tree: WorkspaceSidebarTree
  styling: WorkspaceSidebarStyling
  header: WorkspaceSidebarHeader
  behavior: WorkspaceSidebarBehavior
}

/**
 * WorkspaceSidebarMetadata - Complete metadata for workspace sidebar
 */
export interface WorkspaceSidebarMetadata {
  version: number
  sidebar: WorkspaceSidebar
}

/**
 * DashboardLayout - Layout configuration
 */
export interface DashboardLayout {
  maxWidth: number
  horizontalPadding: number
  verticalPadding: number
  sectionSpacing: number
}

/**
 * DashboardAction - Action button/link
 */
export interface DashboardAction {
  id: string
  label: string
  href: string
  variant: 'link' | 'button'
}

/**
 * DashboardHeader - Header section
 */
export interface DashboardHeader {
  title: string
  showGeneratedAt: boolean
  generatedAtField?: string
  actions?: DashboardAction[]
  description?: string
}

/**
 * DashboardMetric - Single metric configuration
 */
export interface DashboardMetric {
  id: string
  label: string
  valueField: string
  variant: 'neutral' | 'success' | 'warning' | 'error'
  variantCondition?: string
  format?: 'relative-time' | 'percentage' | 'number'
}

/**
 * DashboardMetricGrid - Grid of metrics
 */
export interface DashboardMetricGrid {
  gridColumns: number
  gap: number
  metrics: DashboardMetric[]
}

/**
 * DashboardList - List configuration
 */
export interface DashboardList {
  id: string
  title?: string
  dataField: string
  itemRenderer: string
  maxHeight?: number
  showIf?: string
  emptyState?: string
  titleSuffix?: string
  titleSuffixField?: string
}

/**
 * DashboardPanelContent - Panel content item
 */
export type DashboardPanelContent = 
  | { type: 'metric_grid'; gridColumns: number; gap: number; metrics: DashboardMetric[] }
  | { type: 'list'; id: string; title?: string; dataField: string; itemRenderer: string; maxHeight?: number; showIf?: string; emptyState?: string; titleSuffix?: string; titleSuffixField?: string }

/**
 * DashboardPanel - Panel section
 */
export interface DashboardPanel {
  id: string
  type: 'panel'
  title: string
  description?: string
  panelType: 'card'
  content: DashboardPanelContent[]
  dataSource?: string
  titleSuffix?: string
  titleSuffixField?: string
}

/**
 * DashboardMetricGridSection - Metric grid section
 */
export interface DashboardMetricGridSection {
  id: string
  type: 'metric_grid'
  title: string | null
  gridColumns: number
  gap: number
  metrics: DashboardMetric[]
}

/**
 * DashboardSection - Dashboard section (union type)
 */
export type DashboardSection = 
  | { id: string; type: 'header'; title: string; showGeneratedAt: boolean; generatedAtField?: string; actions?: DashboardAction[]; description?: string }
  | DashboardMetricGridSection
  | DashboardPanel
  | { id: string; type: 'empty'; showIf: string; message: string }

/**
 * DashboardDefinition - Complete dashboard definition
 * This is the FORM - the essence that drives dashboard code generation
 */
export interface DashboardDefinition {
  id: string
  title: string
  description?: string
  layout: DashboardLayout
  sections: DashboardSection[]
}

/**
 * DashboardMetadata - Complete metadata for dashboard
 */
export interface DashboardMetadata {
  version: number
  dashboard: DashboardDefinition
}

/**
 * InvariantViewMode - View mode configuration
 */
export interface InvariantViewMode {
  id: string
  label: string
  default?: boolean
}

/**
 * InvariantSidebar - Sidebar section configuration
 */
export interface InvariantSidebar {
  id: string
  type: 'sidebar'
  title: string
  position: 'left' | 'right'
  width: number
  content: Array<{
    type: 'list'
    dataField: string
    itemRenderer: string
    itemProps?: Record<string, any>
  }>
}

/**
 * InvariantCollapsibleSection - Collapsible section configuration
 */
export interface InvariantCollapsibleSection {
  id: string
  type: 'collapsible_section'
  title: string
  titleSuffixField?: string
  defaultExpanded: boolean
  showIf?: string
  content: Array<{
    type: 'list'
    dataField: string
    itemRenderer: string
    maxHeight?: number
  }>
}

/**
 * InvariantSection - Invariant section (union type)
 */
export type InvariantSection =
  | { id: string; type: 'header'; title: string; showGeneratedAt: boolean; generatedAtField?: string; description?: string }
  | InvariantSidebar
  | DashboardPanel
  | { id: string; type: 'list'; dataField: string; itemRenderer: string; itemProps?: Record<string, any>; emptyState?: string; showIf?: string }
  | InvariantCollapsibleSection

/**
 * InvariantDefinition - Complete invariant definition
 */
export interface InvariantDefinition {
  id: string
  title: string
  description?: string
  layout: DashboardLayout
  viewModes?: InvariantViewMode[]
  sections: InvariantSection[]
}

/**
 * InvariantMetadata - Complete metadata for invariant display
 */
export interface InvariantMetadata {
  version: number
  invariant: InvariantDefinition
}

