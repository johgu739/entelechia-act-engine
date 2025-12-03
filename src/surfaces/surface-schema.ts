/**
 * ✅ ENTELECHIA: Surface YAML Schema
 * 
 * Zod schema for validating surface view YAML files.
 * 
 * PRINCIPLE: Surface views describe UI structure declaratively.
 * All visual structure comes from FORM, rendered by SurfaceRenderer.
 * 
 * FORM → ACT → STATE → RUNTIME:
 * - FORM: *.view.yaml files
 * - ACT: surface-canonicalizer.ts
 * - STATE: *.surface.generated.ts
 * - RUNTIME: SurfaceRenderer component
 */

import { z } from 'zod'

/**
 * Surface View Kind
 * 
 * Defines the type of surface view.
 */
export const SurfaceViewKindSchema = z.enum([
  'form',
  'list',
  'grid',
  'dashboard',
  'topology',
  'detail',
  'graph',
  'metric-panel',
  'card-grid',
])

/**
 * Surface Layout Schema
 * 
 * Defines layout structure for the view.
 */
export const SurfaceLayoutSchema = z.enum([
  'single-column',
  'two-column',
  'three-column',
  'with-sidebar',
  'full-width',
])

/**
 * Surface Section Kind
 * 
 * Defines the type of section within a view.
 */
export const SurfaceSectionKindSchema = z.enum([
  'card-list',
  'metric-row',
  'topology-map',
  'repo-grid',
  'table',
  'form-section',
  'detail-panel',
  'graph-view',
])

/**
 * Surface Block Type
 * 
 * Defines individual UI blocks within sections.
 */
export const SurfaceBlockTypeSchema = z.enum([
  'metric-card',
  'repo-card',
  'table-row',
  'topology-node',
  'form-field',
  'graph-edge',
  'badge',
  'text',
  'link',
])

/**
 * Data Source Reference Schema
 * 
 * References data from generated STATE descriptors.
 * Uses JSONPath-like syntax: "$topology.repos", "$contractWall.audits"
 */
const DataSourceRefSchema = z.string().regex(
  /^\$[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*|\[[0-9]+\])*$/,
  'Data source must start with $ and use dot notation (e.g., "$topology.repos")'
)

/**
 * Surface Block Props Schema
 * 
 * Generic props for any block type.
 */
const SurfaceBlockPropsSchema = z.object({
  // Data source reference
  source: DataSourceRefSchema.optional(),
  
  // Field mappings (for table/list rows)
  fields: z.record(z.string()).optional(),
  
  // Display configuration
  label: z.string().optional(),
  valueFrom: DataSourceRefSchema.optional(),
  
  // Styling (must use canonical tokens)
  variant: z.enum(['default', 'primary', 'secondary', 'success', 'warning', 'error']).optional(),
  
  // Layout
  span: z.number().int().min(1).max(12).optional(), // Grid span (1-12)
  
  // Actions
  onClick: z.string().optional(), // Intent/action reference
  
  // Conditional rendering
  showIf: z.string().optional(), // Condition expression
  
  // Additional type-specific props
  extra: z.record(z.any()).optional(),
})

/**
 * Surface Block Schema
 * 
 * Individual UI block within a section.
 */
const SurfaceBlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  type: SurfaceBlockTypeSchema,
  props: SurfaceBlockPropsSchema,
})

/**
 * Surface Section Schema
 * 
 * Section within a view.
 */
const SurfaceSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().optional(),
  kind: SurfaceSectionKindSchema,
  blocks: z.array(SurfaceBlockSchema).min(1, 'Section must have at least one block'),
  
  // Layout within section
  layout: z.enum(['grid', 'stack', 'row']).optional().default('stack'),
  columns: z.number().int().min(1).max(12).optional(), // For grid layout
})

/**
 * Surface View Schema
 * 
 * Top-level view definition.
 */
const SurfaceViewSchema = z.object({
  id: z.string().min(1, 'View ID is required'),
  title: z.string().min(1, 'View title is required'),
  kind: SurfaceViewKindSchema,
  layout: SurfaceLayoutSchema.optional().default('single-column'),
  
  sections: z.array(SurfaceSectionSchema).min(1, 'View must have at least one section'),
  
  // Metadata
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * Surface YAML Schema
 * 
 * Root schema for surface view YAML files.
 */
export const SurfaceYamlSchema = z.object({
  version: z.string().default('1.0.0'),
  views: z.array(SurfaceViewSchema).min(1, 'Must define at least one view'),
})

/**
 * Type exports
 */
export type SurfaceViewKind = z.infer<typeof SurfaceViewKindSchema>
export type SurfaceLayout = z.infer<typeof SurfaceLayoutSchema>
export type SurfaceSectionKind = z.infer<typeof SurfaceSectionKindSchema>
export type SurfaceBlockType = z.infer<typeof SurfaceBlockTypeSchema>
export type SurfaceBlockProps = z.infer<typeof SurfaceBlockPropsSchema>
export type SurfaceBlock = z.infer<typeof SurfaceBlockSchema>
export type SurfaceSection = z.infer<typeof SurfaceSectionSchema>
export type SurfaceView = z.infer<typeof SurfaceViewSchema>
export type SurfaceYaml = z.infer<typeof SurfaceYamlSchema>

