/**
 * ✅ ENTELECHIA: Navigation Code Generator
 * 
 * Generates TypeScript navigation descriptors from YAML metadata.
 * 
 * PRINCIPLE: Deterministic generation of canonical navigation descriptors.
 */

import { existsSync } from 'fs'
import { join } from 'path'
import type {
  UIRealmsMetadata,
  NavigationShellsMetadata,
  NodeDetailSectionsMetadata,
  ChatLayoutMetadata,
  WorkspaceSidebarMetadata,
  DashboardMetadata,
  InvariantMetadata,
} from '../../navigation/metadata/types.js'
import {
  loadUIRealmsMetadata,
  loadNavigationShellsMetadata,
  loadNodeDetailSectionsMetadata,
  loadChatLayoutMetadata,
  loadWorkspaceSidebarMetadata,
  loadDashboardMetadata,
  loadInvariantMetadata,
} from '../../navigation/metadata/loader.js'

/**
 * Generate UI Realms code
 */
export async function generateUIRealmsCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadUIRealmsMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateUIRealmsTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Navigation Shells code
 */
export async function generateNavigationShellsCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadNavigationShellsMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateNavigationShellsTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Node Detail Sections code
 */
export async function generateNodeDetailSectionsCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadNodeDetailSectionsMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateNodeDetailSectionsTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Chat Layout code
 */
export async function generateChatLayoutCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadChatLayoutMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateChatLayoutTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Workspace Sidebar code
 */
export async function generateWorkspaceSidebarCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadWorkspaceSidebarMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateWorkspaceSidebarTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Dashboard code
 */
export async function generateDashboardCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadDashboardMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateDashboardTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate Invariant code
 */
export async function generateInvariantCode(
  yamlPath: string,
  outputPath: string
): Promise<{ path: string; content: string }> {
  // Load metadata
  const metadata = await loadInvariantMetadata(yamlPath)

  // Generate TypeScript code
  const tsCode = generateInvariantTypeScript(metadata)

  return {
    path: outputPath,
    content: tsCode,
  }
}

/**
 * Generate TypeScript code for UI Realms
 */
function generateUIRealmsTypeScript(metadata: UIRealmsMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated UI Realms')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface GeneratedUIRealm {')
  lines.push("  id: string")
  lines.push("  name: string")
  lines.push("  form: {")
  lines.push("    layout: 'standard' | 'fullscreen' | 'minimal'")
  lines.push("    navigation: 'sidebar' | 'none' | 'tabs'")
  lines.push("    header: 'fixed' | 'none' | 'scrollable'")
  lines.push("    scroll: 'content' | 'none' | 'full'")
  lines.push("    scrollBehavior?: {")
  lines.push("      kind: 'standard' | 'elastic'")
  lines.push("      elasticity?: 'soft' | 'medium' | 'firm'")
  lines.push("      overscrollBehavior?: 'auto' | 'contain' | 'none'")
  lines.push("      invariants?: string[]")
  lines.push("    }")
  lines.push("  }")
  lines.push("  telos: string")
  lines.push("  layout: {")
  lines.push("    sidebarWidthPercent: number")
  lines.push("    headerHeightPx: number")
  lines.push("    contentPaddingPx: number")
  lines.push("  }")
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_UI_REALMS: GeneratedUIRealm[] = ')

  // Generate realms array
  const realmsJson = JSON.stringify(metadata.realms, null, 2)
  lines.push(realmsJson)
  lines.push('')
  lines.push('export default GENERATED_UI_REALMS')

  return lines.join('\n')
}

/**
 * Generate TypeScript code for Navigation Shells
 */
function generateNavigationShellsTypeScript(metadata: NavigationShellsMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Navigation Shells')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface GeneratedNavigationItem {')
  lines.push("  id: string")
  lines.push("  label: string")
  lines.push("  href: string")
  lines.push("  icon?: string")
  lines.push('}')
  lines.push('')
  lines.push('export interface GeneratedNavigationShellNav {')
  lines.push("  type: 'tabs' | 'links' | 'none'")
  lines.push("  items: GeneratedNavigationItem[]")
  lines.push('}')
  lines.push('')
  lines.push('export interface GeneratedNavigationShell {')
  lines.push("  realmId: string")
  lines.push("  header: {")
  lines.push("    title: string")
  lines.push("    showAccountMenu: boolean")
  lines.push("  }")
  lines.push("  primaryNav: GeneratedNavigationShellNav")
  lines.push("  secondaryNav?: GeneratedNavigationShellNav")
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_NAVIGATION_SHELLS: GeneratedNavigationShell[] = ')

  // Generate shells array
  const shellsJson = JSON.stringify(metadata.shells, null, 2)
  lines.push(shellsJson)
  lines.push('')
  lines.push('')
  lines.push('/**')
  lines.push(' * Get navigation shell for a realm')
  lines.push(' */')
  lines.push("export function getShellForRealm(realmId: string): GeneratedNavigationShell | undefined {")
  lines.push("  return GENERATED_NAVIGATION_SHELLS.find(shell => shell.realmId === realmId)")
  lines.push('}')
  lines.push('')
  lines.push('export default GENERATED_NAVIGATION_SHELLS')

  return lines.join('\n')
}

/**
 * Generate TypeScript code for Node Detail Sections
 */
function generateNodeDetailSectionsTypeScript(metadata: NodeDetailSectionsMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Node Detail Sections')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface GeneratedNodeDetailSection {')
  lines.push("  id: string")
  lines.push("  label: string")
  lines.push("  pathSuffix: string")
  lines.push("  default?: boolean")
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_NODE_DETAIL_SECTIONS: GeneratedNodeDetailSection[] = ')

  // Generate sections array
  const sectionsJson = JSON.stringify(metadata.sections, null, 2)
  lines.push(sectionsJson)
  lines.push('')
  lines.push('export default GENERATED_NODE_DETAIL_SECTIONS')

  return lines.join('\n')
}

/**
 * Generate TypeScript code for Chat Layout
 */
function generateChatLayoutTypeScript(metadata: ChatLayoutMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Chat Layout')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface GeneratedChatLayout {')
  lines.push('  container: {')
  lines.push('    layout: string')
  lines.push('    height: string')
  lines.push('    minHeight: number')
  lines.push('    background: string')
  lines.push('    darkBackground: string')
  lines.push('  }')
  lines.push('  scrollRegion: {')
  lines.push('    flex: number')
  lines.push('    minHeight: number')
  lines.push('    overflowY: string')
  lines.push('    overflowX: string')
  lines.push('    paddingX: number')
  lines.push('    paddingY: number')
  lines.push('    maxWidth: number')
  lines.push('    centerContent: boolean')
  lines.push('    scrollBehavior?: {')
  lines.push("      kind: 'standard' | 'elastic'")
  lines.push("      elasticity?: 'soft' | 'medium' | 'firm'")
  lines.push("      overscrollBehavior?: 'auto' | 'contain' | 'none'")
  lines.push("      invariants?: string[]")
  lines.push('    }')
  lines.push('  }')
  lines.push('  emptyState: {')
  lines.push('    text: string')
  lines.push('    fontSize: string')
  lines.push('    color: string')
  lines.push('    darkColor: string')
  lines.push('    paddingY: number')
  lines.push('  }')
  lines.push('  messageList: {')
  lines.push('    spacing: number')
  lines.push('    sameSenderSpacing: number')
  lines.push('    differentSenderSpacing: number')
  lines.push('  }')
  lines.push('  message: {')
  lines.push('    maxWidth: string')
  lines.push('    borderRadius: string')
  lines.push('    paddingX: number')
  lines.push('    paddingY: number')
  lines.push('    fontSize: string')
  lines.push('    lineHeight: string')
  lines.push('    whitespace: string')
  lines.push('    user: {')
  lines.push('      background: string')
  lines.push('      border: string')
  lines.push('      textColor: string')
  lines.push('      alignment: string')
  lines.push('    }')
  lines.push('    assistant: {')
  lines.push('      background: string')
  lines.push('      darkBackground: string')
  lines.push('      textColor: string')
  lines.push('      darkTextColor: string')
  lines.push('      alignment: string')
  lines.push('    }')
  lines.push('    timestamp: {')
  lines.push('      fontSize: string')
  lines.push('      color: string')
  lines.push('      darkColor: string')
  lines.push('      marginTop: number')
  lines.push('    }')
  lines.push('  }')
  lines.push('  inputBar: {')
  lines.push('    flexShrink: number')
  lines.push('    borderTop: string')
  lines.push('    darkBorderTop: string')
  lines.push('    background: string')
  lines.push('    darkBackground: string')
  lines.push('    paddingX: number')
  lines.push('    paddingY: number')
  lines.push('    shadow: string')
  lines.push('    maxWidth: number')
  lines.push('    centerContent: boolean')
  lines.push('    input: {')
  lines.push('      flex: number')
  lines.push('      background: string')
  lines.push('      darkBackground: string')
  lines.push('      borderRadius: string')
  lines.push('      paddingX: number')
  lines.push('      paddingY: number')
  lines.push('      border: string')
  lines.push('      darkBorder: string')
  lines.push('      fontSize: string')
  lines.push('      lineHeight: string')
  lines.push('      minHeight: number')
  lines.push('      maxHeight: number')
  lines.push('      placeholder: string')
  lines.push('      focus: {')
  lines.push('        outline: string')
  lines.push('        border: string')
  lines.push('        darkBorder: string')
  lines.push('        background: string')
  lines.push('        darkBackground: string')
  lines.push('      }')
  lines.push('    }')
  lines.push('    sendButton: {')
  lines.push('      padding: number')
  lines.push('      borderRadius: string')
  lines.push('      color: string')
  lines.push('      hoverColor: string')
  lines.push('      darkColor: string')
  lines.push('      darkHoverColor: string')
  lines.push('      disabledOpacity: number')
  lines.push('      iconSize: string')
  lines.push('      iconStroke: string')
  lines.push('    }')
  lines.push('  }')
  lines.push('  changeInspector?: {')
  lines.push('    enabled: boolean')
  lines.push('    maxWidth: number')
  lines.push('    centerContent: boolean')
  lines.push('    marginTop: number')
  lines.push('    paddingTop: number')
  lines.push('    borderTop: string')
  lines.push('    darkBorderTop: string')
  lines.push('    title: {')
  lines.push('      fontSize: string')
  lines.push('      fontWeight: string')
  lines.push('      color: string')
  lines.push('      darkColor: string')
  lines.push('      marginBottom: number')
  lines.push('    }')
  lines.push('    content: {')
  lines.push('      fontSize: string')
  lines.push('      color: string')
  lines.push('      darkColor: string')
  lines.push('    }')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_CHAT_LAYOUT: GeneratedChatLayout = ')

  // Generate layout object
  const layoutJson = JSON.stringify(metadata.chat, null, 2)
  lines.push(layoutJson)
  lines.push('')
  lines.push('export default GENERATED_CHAT_LAYOUT')

  return lines.join('\n')
}

/**
 * Generate TypeScript code for Workspace Sidebar
 */
function generateWorkspaceSidebarTypeScript(metadata: WorkspaceSidebarMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Workspace Sidebar')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface GeneratedWorkspaceSidebar {')
  lines.push('  tree: {')
  lines.push('    rootNodeIds: string[]')
  lines.push('    maxDepth: number')
  lines.push('    defaultExpanded: boolean')
  lines.push('    showExpandButtons: boolean')
  lines.push('    nodeTypes: Array<{')
  lines.push('      type: string')
  lines.push('      icon: string | null')
  lines.push('      showInTree: boolean')
  lines.push('      defaultExpanded: boolean')
  lines.push('    }>')
  lines.push('  }')
  lines.push('  styling: {')
  lines.push('    nodeTextSize: string')
  lines.push('    nodeTextWeight: string')
  lines.push('    nodeTextFamily: string')
  lines.push('    nodeLineHeight: string')
  lines.push('    horizontalPadding: number')
  lines.push('    verticalPadding: number')
  lines.push('    nodeSpacing: number')
  lines.push('    indentPerLevel: number')
  lines.push('    defaultTextColor: string')
  lines.push('    selectedTextColor: string')
  lines.push('    selectedBackground: string')
  lines.push('    hoverBackground: string')
  lines.push('    transitionDuration: number')
  lines.push('    transitionEasing: string')
  lines.push('  }')
  lines.push('  header: {')
  lines.push('    showHeader: boolean')
  lines.push('    title: string')
  lines.push('    titleSize: string')
  lines.push('    titleWeight: string')
  lines.push('    titleColor: string')
  lines.push('    showDataFreshness: boolean')
  lines.push('    showCollapseButton: boolean')
  lines.push('  }')
  lines.push('  behavior: {')
  lines.push('    highlightSource: "url" | "store"')
  lines.push('    enableHoverPreload: boolean')
  lines.push('    cacheTreeStructure: boolean')
  lines.push('    allowScroll: boolean')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_WORKSPACE_SIDEBAR: GeneratedWorkspaceSidebar = ')

  // Generate sidebar object
  const sidebarJson = JSON.stringify(metadata.sidebar, null, 2)
  lines.push(sidebarJson)
  lines.push('')
  lines.push('export default GENERATED_WORKSPACE_SIDEBAR')

  return lines.join('\n')
}

/**
 * Generate Dashboard TypeScript code
 */
function generateDashboardTypeScript(metadata: DashboardMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Dashboard')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')

  // Generate interface
  lines.push('export interface GeneratedDashboard {')
  lines.push('  id: string')
  lines.push('  title: string')
  lines.push('  description?: string')
  lines.push('  scrollBehavior?: {')
  lines.push("    kind: 'standard' | 'elastic'")
  lines.push("    elasticity?: 'soft' | 'medium' | 'firm'")
  lines.push("    overscrollBehavior?: 'auto' | 'contain' | 'none'")
  lines.push('    invariants?: string[]')
  lines.push('  }')
  lines.push('  layout: {')
  lines.push('    maxWidth: number')
  lines.push('    horizontalPadding: number')
  lines.push('    verticalPadding: number')
  lines.push('    sectionSpacing: number')
  lines.push('  }')
  lines.push('  sections: Array<')
  lines.push('    | {')
  lines.push('        id: string')
  lines.push('        type: "header"')
  lines.push('        title: string')
  lines.push('        showGeneratedAt: boolean')
  lines.push('        generatedAtField?: string')
  lines.push('        actions?: Array<{')
  lines.push('          id: string')
  lines.push('          label: string')
  lines.push('          href: string')
  lines.push('          variant: "link" | "button"')
  lines.push('        }>')
  lines.push('        description?: string')
  lines.push('      }')
  lines.push('    | {')
  lines.push('        id: string')
  lines.push('        type: "metric_grid"')
  lines.push('        title: string | null')
  lines.push('        gridColumns: number')
  lines.push('        gap: number')
  lines.push('        metrics: Array<{')
  lines.push('          id: string')
  lines.push('          label: string')
  lines.push('          valueField: string')
  lines.push('          variant: "neutral" | "success" | "warning" | "error"')
  lines.push('          variantCondition?: string')
  lines.push('          format?: "relative-time" | "percentage" | "number"')
  lines.push('        }>')
  lines.push('      }')
  lines.push('    | {')
  lines.push('        id: string')
  lines.push('        type: "panel"')
  lines.push('        title: string')
  lines.push('        description?: string')
  lines.push('        panelType: "card"')
  lines.push('        content: Array<')
  lines.push('          | {')
  lines.push('              type: "metric_grid"')
  lines.push('              gridColumns: number')
  lines.push('              gap: number')
  lines.push('              metrics: Array<{')
  lines.push('                id: string')
  lines.push('                label: string')
  lines.push('                valueField: string')
  lines.push('                variant: "neutral" | "success" | "warning" | "error"')
  lines.push('                variantCondition?: string')
  lines.push('                format?: "relative-time" | "percentage" | "number"')
  lines.push('              }>')
  lines.push('            }')
  lines.push('          | {')
  lines.push('              type: "list"')
  lines.push('              id: string')
  lines.push('              title?: string')
  lines.push('              dataField: string')
  lines.push('              itemRenderer: string')
  lines.push('              maxHeight?: number')
  lines.push('              showIf?: string')
  lines.push('              emptyState?: string')
  lines.push('              titleSuffix?: string')
  lines.push('              titleSuffixField?: string')
  lines.push('            }')
  lines.push('        >')
  lines.push('        dataSource?: string')
  lines.push('        titleSuffix?: string')
  lines.push('        titleSuffixField?: string')
  lines.push('      }')
  lines.push('    | {')
  lines.push('        id: string')
  lines.push('        type: "empty"')
  lines.push('        showIf: string')
  lines.push('        message: string')
  lines.push('      }')
  lines.push('  >')
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_DASHBOARD: GeneratedDashboard = ')

  // Generate dashboard object
  const dashboardJson = JSON.stringify(metadata.dashboard, null, 2)
  lines.push(dashboardJson)
  lines.push('')
  lines.push('export default GENERATED_DASHBOARD')

  return lines.join('\n')
}

/**
 * Generate Invariant TypeScript code
 */
function generateInvariantTypeScript(metadata: InvariantMetadata): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated Invariant Display')
  lines.push(' * ')
  lines.push(' * Generated from YAML - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')

  // Generate interface (simplified - similar to dashboard)
  lines.push('export interface GeneratedInvariant {')
  lines.push('  id: string')
  lines.push('  title: string')
  lines.push('  description?: string')
  lines.push('  layout: {')
  lines.push('    maxWidth: number')
  lines.push('    horizontalPadding: number')
  lines.push('    verticalPadding: number')
  lines.push('    sectionSpacing: number')
  lines.push('  }')
  lines.push('  viewModes?: Array<{')
  lines.push('    id: string')
  lines.push('    label: string')
  lines.push('    default?: boolean')
  lines.push('  }>')
  lines.push('  sections: Array<any>') // Simplified for now
  lines.push('}')
  lines.push('')
  lines.push('export const GENERATED_INVARIANT: GeneratedInvariant = ')

  // Generate invariant object
  const invariantJson = JSON.stringify(metadata.invariant, null, 2)
  lines.push(invariantJson)
  lines.push('')
  lines.push('export default GENERATED_INVARIANT')

  return lines.join('\n')
}

