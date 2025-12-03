/**
 * ✅ ENTELECHIA: Surface Canonicalizer
 * 
 * Transforms surface YAML into canonical surface descriptors.
 * 
 * PRINCIPLE: Canonical descriptors are generated at build time
 * and saved into src/generated/surfaces/
 * 
 * FORM → ACT → STATE → RUNTIME:
 * - FORM: *.view.yaml files
 * - ACT: This canonicalizer
 * - STATE: *.surface.generated.ts
 * - RUNTIME: SurfaceRenderer component
 */

import type { SurfaceYaml, SurfaceView, SurfaceSection, SurfaceBlock } from './surface-schema.js'

/**
 * Canonical Surface Descriptor
 * 
 * Normalized, validated structure for runtime consumption.
 */
export interface CanonicalSurfaceDescriptor {
  version: string
  generatedAt: string
  views: CanonicalSurfaceView[]
}

/**
 * Canonical Surface View
 */
export interface CanonicalSurfaceView {
  id: string
  title: string
  kind: SurfaceView['kind']
  layout: SurfaceView['layout']
  sections: CanonicalSurfaceSection[]
  description?: string
  tags?: string[]
}

/**
 * Canonical Surface Section
 */
export interface CanonicalSurfaceSection {
  id: string
  title?: string
  kind: SurfaceSection['kind']
  blocks: CanonicalSurfaceBlock[]
  layout: 'grid' | 'stack' | 'row'
  columns?: number
}

/**
 * Canonical Surface Block
 */
export interface CanonicalSurfaceBlock {
  id: string
  type: SurfaceBlock['type']
  props: SurfaceBlock['props']
}

/**
 * Canonicalize Surface YAML
 * 
 * Transforms YAML into canonical descriptor.
 * 
 * @param yaml Surface YAML
 * @returns Canonical surface descriptor
 */
export function canonicalizeSurface(yaml: SurfaceYaml): CanonicalSurfaceDescriptor {
  // Validate all view IDs are unique
  const viewIds = yaml.views.map(v => v.id)
  const duplicateViewIds = viewIds.filter((id, index) => viewIds.indexOf(id) !== index)
  if (duplicateViewIds.length > 0) {
    throw new Error(`Duplicate view IDs found: ${duplicateViewIds.join(', ')}`)
  }

  // Validate all section IDs are unique within each view
  for (const view of yaml.views) {
    const sectionIds = view.sections.map(s => s.id)
    const duplicateSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index)
    if (duplicateSectionIds.length > 0) {
      throw new Error(`Duplicate section IDs in view "${view.id}": ${duplicateSectionIds.join(', ')}`)
    }

    // Validate all block IDs are unique within each section
    for (const section of view.sections) {
      const blockIds = section.blocks.map(b => b.id)
      const duplicateBlockIds = blockIds.filter((id, index) => blockIds.indexOf(id) !== index)
      if (duplicateBlockIds.length > 0) {
        throw new Error(`Duplicate block IDs in section "${section.id}": ${duplicateBlockIds.join(', ')}`)
      }
    }
  }

  // Normalize and canonicalize
  const canonicalViews: CanonicalSurfaceView[] = yaml.views.map(view => ({
    id: view.id,
    title: view.title,
    kind: view.kind,
    layout: view.layout || 'single-column',
    sections: view.sections.map(section => ({
      id: section.id,
      title: section.title,
      kind: section.kind,
      blocks: section.blocks.map(block => ({
        id: block.id,
        type: block.type,
        props: {
          ...block.props,
          // Normalize props
          span: block.props.span || undefined,
          variant: block.props.variant || 'default',
        },
      })),
      layout: section.layout || 'stack',
      columns: section.columns,
    })),
    description: view.description,
    tags: view.tags,
  }))

  return {
    version: yaml.version || '1.0.0',
    generatedAt: new Date().toISOString(),
    views: canonicalViews,
  }
}

