/**
 * ✅ ENTELECHIA: Navigation YAML Schema
 * 
 * Zod schemas for validating navigation YAML files.
 * 
 * PRINCIPLE: YAML only describes UI navigation/layout structure.
 */

import { z } from 'zod'

/**
 * UI Realm Form Schema
 */
const UIRealmFormSchema = z.object({
  layout: z.enum(['standard', 'fullscreen', 'minimal']),
  navigation: z.enum(['sidebar', 'none', 'tabs']),
  header: z.enum(['fixed', 'none', 'scrollable']),
  scroll: z.enum(['content', 'none', 'full']),
})

/**
 * UI Realm Layout Schema
 */
const UIRealmLayoutSchema = z.object({
  sidebarWidthPercent: z.number().min(0).max(100),
  headerHeightPx: z.number().min(0),
  contentPaddingPx: z.number().min(0),
})

/**
 * UI Realm Definition Schema
 */
const UIRealmDefinitionSchema = z.object({
  id: z.string().min(1, 'Realm ID is required'),
  name: z.string().min(1, 'Realm name is required'),
  form: UIRealmFormSchema,
  telos: z.string().min(1, 'Telos is required'),
  layout: UIRealmLayoutSchema,
})

/**
 * UI Realms YAML Schema
 */
export const UIRealmsYamlSchema = z.object({
  version: z.number().int().positive(),
  realms: z.array(UIRealmDefinitionSchema).min(1, 'At least one realm is required'),
})

export type UIRealmsYaml = z.infer<typeof UIRealmsYamlSchema>

/**
 * Navigation Item Schema
 */
const NavigationItemSchema = z.object({
  id: z.string().min(1, 'Navigation item ID is required'),
  label: z.string().min(1, 'Navigation item label is required'),
  href: z.string().min(1, 'Navigation item href is required'),
  icon: z.string().optional(),
})

/**
 * Navigation Shell Header Schema
 */
const NavigationShellHeaderSchema = z.object({
  title: z.string().min(1, 'Header title is required'),
  showAccountMenu: z.boolean(),
})

/**
 * Navigation Shell Nav Schema
 */
const NavigationShellNavSchema = z.object({
  type: z.enum(['tabs', 'links', 'none']),
  items: z.array(NavigationItemSchema),
})

/**
 * Navigation Shell Schema
 */
const NavigationShellSchema = z.object({
  realmId: z.string().min(1, 'Realm ID is required'),
  header: NavigationShellHeaderSchema,
  primaryNav: NavigationShellNavSchema,
  secondaryNav: NavigationShellNavSchema.optional(),
})

/**
 * Navigation Shells YAML Schema
 */
export const NavigationShellsYamlSchema = z.object({
  version: z.number().int().positive(),
  shells: z.array(NavigationShellSchema).min(1, 'At least one shell is required'),
})

export type NavigationShellsYaml = z.infer<typeof NavigationShellsYamlSchema>

/**
 * Node Detail Section Schema
 */
const NodeDetailSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  label: z.string().min(1, 'Section label is required'),
  pathSuffix: z.string(),
  default: z.boolean().optional(),
})

/**
 * Node Detail Sections YAML Schema
 */
export const NodeDetailSectionsYamlSchema = z.object({
  version: z.number().int().positive(),
  sections: z.array(NodeDetailSectionSchema).min(1, 'At least one section is required'),
})

export type NodeDetailSectionsYaml = z.infer<typeof NodeDetailSectionsYamlSchema>

/**
 * Chat Layout YAML Schema
 */
export const ChatLayoutYamlSchema = z.object({
  version: z.number().int().positive(),
  chat: z.object({
    container: z.object({
      layout: z.string(),
      height: z.string(),
      minHeight: z.number(),
      background: z.string(),
      darkBackground: z.string(),
    }),
    scrollRegion: z.object({
      flex: z.number(),
      minHeight: z.number(),
      overflowY: z.string(),
      overflowX: z.string(),
      paddingX: z.number(),
      paddingY: z.number(),
      maxWidth: z.number(),
      centerContent: z.boolean(),
    }),
    emptyState: z.object({
      text: z.string(),
      fontSize: z.string(),
      color: z.string(),
      darkColor: z.string(),
      paddingY: z.number(),
    }),
    messageList: z.object({
      spacing: z.number(),
      sameSenderSpacing: z.number(),
      differentSenderSpacing: z.number(),
    }),
    message: z.object({
      maxWidth: z.string(),
      borderRadius: z.string(),
      paddingX: z.number(),
      paddingY: z.number(),
      fontSize: z.string(),
      lineHeight: z.string(),
      whitespace: z.string(),
      user: z.object({
        background: z.string(),
        border: z.string(),
        textColor: z.string(),
        alignment: z.string(),
      }),
      assistant: z.object({
        background: z.string(),
        darkBackground: z.string(),
        textColor: z.string(),
        darkTextColor: z.string(),
        alignment: z.string(),
      }),
      timestamp: z.object({
        fontSize: z.string(),
        color: z.string(),
        darkColor: z.string(),
        marginTop: z.number(),
      }),
    }),
    inputBar: z.object({
      flexShrink: z.number(),
      borderTop: z.string(),
      darkBorderTop: z.string(),
      background: z.string(),
      darkBackground: z.string(),
      paddingX: z.number(),
      paddingY: z.number(),
      shadow: z.string(),
      maxWidth: z.number(),
      centerContent: z.boolean(),
      input: z.object({
        flex: z.number(),
        background: z.string(),
        darkBackground: z.string(),
        borderRadius: z.string(),
        paddingX: z.number(),
        paddingY: z.number(),
        border: z.string(),
        darkBorder: z.string(),
        fontSize: z.string(),
        lineHeight: z.string(),
        minHeight: z.number(),
        maxHeight: z.number(),
        placeholder: z.string(),
        focus: z.object({
          outline: z.string(),
          border: z.string(),
          darkBorder: z.string(),
          background: z.string(),
          darkBackground: z.string(),
        }),
      }),
      sendButton: z.object({
        padding: z.number(),
        borderRadius: z.string(),
        color: z.string(),
        hoverColor: z.string(),
        darkColor: z.string(),
        darkHoverColor: z.string(),
        disabledOpacity: z.number(),
        iconSize: z.string(),
        iconStroke: z.string(),
      }),
    }),
    changeInspector: z.object({
      enabled: z.boolean(),
      maxWidth: z.number(),
      centerContent: z.boolean(),
      marginTop: z.number(),
      paddingTop: z.number(),
      borderTop: z.string(),
      darkBorderTop: z.string(),
      title: z.object({
        fontSize: z.string(),
        fontWeight: z.string(),
        color: z.string(),
        darkColor: z.string(),
        marginBottom: z.number(),
      }),
      content: z.object({
        fontSize: z.string(),
        color: z.string(),
        darkColor: z.string(),
      }),
    }).optional(),
  }),
})

export type ChatLayoutYaml = z.infer<typeof ChatLayoutYamlSchema>

/**
 * Workspace Sidebar YAML Schema
 */
const WorkspaceSidebarTreeSchema = z.object({
  rootNodeIds: z.array(z.string()),
  maxDepth: z.number().int().min(0),
  defaultExpanded: z.boolean(),
  showExpandButtons: z.boolean(),
  nodeTypes: z.array(z.object({
    type: z.string(),
    icon: z.string().nullable(),
    showInTree: z.boolean(),
    defaultExpanded: z.boolean(),
  })),
})

const WorkspaceSidebarStylingSchema = z.object({
  nodeTextSize: z.string(),
  nodeTextWeight: z.string(),
  nodeTextFamily: z.string(),
  nodeLineHeight: z.string(),
  horizontalPadding: z.number().int().min(0),
  verticalPadding: z.number().int().min(0),
  nodeSpacing: z.number().int().min(0),
  indentPerLevel: z.number().int().min(0),
  defaultTextColor: z.string(),
  selectedTextColor: z.string(),
  selectedBackground: z.string(),
  hoverBackground: z.string(),
  transitionDuration: z.number().int().min(0),
  transitionEasing: z.string(),
})

const WorkspaceSidebarHeaderSchema = z.object({
  showHeader: z.boolean(),
  title: z.string(),
  titleSize: z.string(),
  titleWeight: z.string(),
  titleColor: z.string(),
  showDataFreshness: z.boolean(),
  showCollapseButton: z.boolean(),
})

const WorkspaceSidebarBehaviorSchema = z.object({
  highlightSource: z.enum(['url', 'store']),
  enableHoverPreload: z.boolean(),
  cacheTreeStructure: z.boolean(),
  allowScroll: z.boolean(),
})

const WorkspaceSidebarSchema = z.object({
  tree: WorkspaceSidebarTreeSchema,
  styling: WorkspaceSidebarStylingSchema,
  header: WorkspaceSidebarHeaderSchema,
  behavior: WorkspaceSidebarBehaviorSchema,
})

export const WorkspaceSidebarYamlSchema = z.object({
  version: z.number().int().positive(),
  sidebar: WorkspaceSidebarSchema,
})

export type WorkspaceSidebarYaml = z.infer<typeof WorkspaceSidebarYamlSchema>

/**
 * Dashboard YAML Schema
 */
const DashboardLayoutSchema = z.object({
  maxWidth: z.number().int().min(0),
  horizontalPadding: z.number().int().min(0),
  verticalPadding: z.number().int().min(0),
  sectionSpacing: z.number().int().min(0),
})

const DashboardActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  variant: z.enum(['link', 'button']),
})

const DashboardHeaderSchema = z.object({
  title: z.string(),
  showGeneratedAt: z.boolean(),
  generatedAtField: z.string().optional(),
  actions: z.array(DashboardActionSchema).optional(),
  description: z.string().optional(),
})

const DashboardMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  valueField: z.string(),
  variant: z.enum(['neutral', 'success', 'warning', 'error']),
  variantCondition: z.string().optional(),
  format: z.enum(['relative-time', 'percentage', 'number']).optional(),
})

const DashboardMetricGridSchema = z.object({
  gridColumns: z.number().int().min(1),
  gap: z.number().int().min(0),
  metrics: z.array(DashboardMetricSchema),
})

const DashboardListSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  dataField: z.string(),
  itemRenderer: z.string(),
  maxHeight: z.number().int().min(0).optional(),
  showIf: z.string().optional(),
  emptyState: z.string().optional(),
  titleSuffix: z.string().optional(),
  titleSuffixField: z.string().optional(),
})

const DashboardPanelContentSchema = z.union([
  z.object({
    type: z.literal('metric_grid'),
    gridColumns: z.number().int().min(1),
    gap: z.number().int().min(0),
    metrics: z.array(DashboardMetricSchema),
  }),
  DashboardListSchema.extend({
    type: z.literal('list'),
  }),
])

const DashboardPanelSchema = z.object({
  id: z.string(),
  type: z.literal('panel'),
  title: z.string(),
  description: z.string().optional(),
  panelType: z.literal('card'),
  content: z.array(DashboardPanelContentSchema),
  dataSource: z.string().optional(),
  titleSuffix: z.string().optional(),
  titleSuffixField: z.string().optional(),
})

const DashboardMetricGridSectionSchema = z.object({
  id: z.string(),
  type: z.literal('metric_grid'),
  title: z.string().nullable(),
  gridColumns: z.number().int().min(1),
  gap: z.number().int().min(0),
  metrics: z.array(DashboardMetricSchema),
})

const DashboardSectionSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal('header'),
    title: z.string(),
    showGeneratedAt: z.boolean(),
    generatedAtField: z.string().optional(),
    actions: z.array(DashboardActionSchema).optional(),
    description: z.string().optional(),
  }),
  DashboardMetricGridSectionSchema,
  DashboardPanelSchema,
  z.object({
    id: z.string(),
    type: z.literal('empty'),
    showIf: z.string(),
    message: z.string(),
  }),
])

const DashboardDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  layout: DashboardLayoutSchema,
  sections: z.array(DashboardSectionSchema).min(1),
})

export const DashboardYamlSchema = z.object({
  version: z.number().int().positive(),
  dashboard: DashboardDefinitionSchema,
})

export type DashboardYaml = z.infer<typeof DashboardYamlSchema>

/**
 * Invariant YAML Schema
 */
const InvariantViewModeSchema = z.object({
  id: z.string(),
  label: z.string(),
  default: z.boolean().optional(),
})

const InvariantSidebarContentSchema = z.object({
  type: z.literal('list'),
  dataField: z.string(),
  itemRenderer: z.string(),
  itemProps: z.record(z.any()).optional(),
})

const InvariantSidebarSchema = z.object({
  id: z.string(),
  type: z.literal('sidebar'),
  title: z.string(),
  position: z.enum(['left', 'right']),
  width: z.number().int().min(0),
  content: z.array(InvariantSidebarContentSchema),
})

const InvariantCollapsibleSectionContentSchema = z.object({
  type: z.literal('list'),
  dataField: z.string(),
  itemRenderer: z.string(),
  maxHeight: z.number().int().min(0).optional(),
})

const InvariantCollapsibleSectionSchema = z.object({
  id: z.string(),
  type: z.literal('collapsible_section'),
  title: z.string(),
  titleSuffixField: z.string().optional(),
  defaultExpanded: z.boolean(),
  showIf: z.string().optional(),
  content: z.array(InvariantCollapsibleSectionContentSchema),
})

const InvariantPanelContentSchema = z.union([
  z.object({
    type: z.literal('metric_grid'),
    gridColumns: z.number().int().min(1),
    gap: z.number().int().min(0),
    metrics: z.array(DashboardMetricSchema),
  }),
  z.object({
    type: z.literal('list'),
    id: z.string().optional(),
    title: z.string().optional(),
    dataField: z.string(),
    itemRenderer: z.string(),
    maxHeight: z.number().int().min(0).optional(),
    showIf: z.string().optional(),
    emptyState: z.string().optional(),
    titleSuffix: z.string().optional(),
    titleSuffixField: z.string().optional(),
    groupBy: z.string().optional(),
  }),
  z.object({
    type: z.literal('feed'),
    dataField: z.string(),
    itemRenderer: z.string(),
    maxEntries: z.number().int().min(0).optional(),
  }),
  InvariantCollapsibleSectionSchema,
])

const InvariantPanelSchema = z.object({
  id: z.string(),
  type: z.literal('panel'),
  title: z.string(),
  description: z.string().optional(),
  panelType: z.literal('card'),
  content: z.array(InvariantPanelContentSchema),
  dataSource: z.string().optional(),
  titleSuffix: z.string().optional(),
  titleSuffixField: z.string().optional(),
})

const InvariantListSectionSchema = z.object({
  id: z.string(),
  type: z.literal('list'),
  dataField: z.string(),
  itemRenderer: z.string(),
  itemProps: z.record(z.any()).optional(),
  emptyState: z.string().optional(),
  showIf: z.string().optional(),
})

const InvariantSectionSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal('header'),
    title: z.string(),
    showGeneratedAt: z.boolean(),
    generatedAtField: z.string().optional(),
    description: z.string().optional(),
  }),
  InvariantPanelSchema, // Put panel before sidebar to avoid union matching issues
  InvariantSidebarSchema,
  InvariantListSectionSchema,
  InvariantCollapsibleSectionSchema,
])

const InvariantDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  layout: DashboardLayoutSchema,
  viewModes: z.array(InvariantViewModeSchema).optional(),
  sections: z.array(InvariantSectionSchema).min(1),
})

export const InvariantYamlSchema = z.object({
  version: z.number().int().positive(),
  invariant: InvariantDefinitionSchema,
})

export type InvariantYaml = z.infer<typeof InvariantYamlSchema>

