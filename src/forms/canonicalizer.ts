/**
 * ✅ ENTELECHIA: Form Canonicalizer
 * 
 * Transforms YAML + metadata into canonical form descriptors.
 * 
 * PRINCIPLE: Canonical descriptors are generated at build time
 * and saved into entelechia-ui/src/generated/forms/
 */

import type { ContractDefinition, FieldDefinition, ProjectionCapabilities } from '@entelechia/shared/contracts/metadata/types'
import type { FormYaml } from './yaml-schema.js'
import type { FunctionalBinding } from './functional-types.js'
import { validateFormInvariants } from './invariant-validator.js'

/**
 * Canonical form descriptor
 * 
 * This is the generated structure that the UI renderer consumes.
 */
/**
 * Scroll Container Descriptor
 * 
 * Represents a single scroll container (F82: Single Scroll Container).
 */
export interface ScrollContainer {
  id: string
  type: 'form' | 'content' | 'dashboard' | 'navigation'
  element?: 'content' | 'sidebar' | 'header'
}

/**
 * Invariant Enforcement Metadata
 */
export interface InvariantEnforcementMetadata {
  id: string
  enforceAt: 'build' | 'runtime' | 'both'
  layer: 'FORM' | 'ACT' | 'STATE' | 'RUNTIME' | 'BOTH'
}

/**
 * Canonical spacing values (from design system)
 * These are literal types to prevent non-canonical values
 */
type CanonicalSpacing = 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64
type CanonicalPaddingX = 24 // ✅ F004: Canonical horizontal padding (SPACING.XXLARGE)
type CanonicalPaddingY = 16 // ✅ F004: Canonical vertical padding (SPACING.LARGE)
type CanonicalGrid = 4 // ✅ F86: Spacing grid unity (4px base unit)

export interface CanonicalFormDescriptor {
  contract: string
  variant: string
  sections: CanonicalSectionDescriptor[]
  // ✅ NEW: Invariant metadata
  invariants: {
    declared: string[] // Invariant IDs declared in YAML
    enforced: InvariantEnforcementMetadata[] // Invariants enforced on this descriptor
  }
  // ✅ NEW: Invariant-encoded constraints (literal types prevent non-canonical values)
  scrollContainers: readonly [ScrollContainer] // ✅ F82: Tuple of length 1 (not array)
  padding: {
    x: CanonicalPaddingX // ✅ F004: Literal type (canonical padding - 24px)
    y: CanonicalPaddingY // ✅ F004: Literal type (canonical padding - 16px)
  }
  // ✅ NEW: Canonical spacing (literal type from design system)
  canonicalSpacing: CanonicalSpacing
  // ✅ NEW: Canonical grid (literal type)
  canonicalGrid: CanonicalGrid
  // ✅ PHASE 3: Functional bindings (optional - only if functional YAML exists)
  functional?: import('./functional-types.js').FunctionalBinding
}

/**
 * Canonical section descriptor
 */
export interface CanonicalSectionDescriptor {
  id: string
  title: string
  fields: CanonicalFieldDescriptor[]
  layout?: {
    columns?: 1 | 2 | 3
    collapsible?: boolean
  }
}

/**
 * Canonical field descriptor
 * 
 * Complete field metadata for rendering.
 */
export interface CanonicalFieldDescriptor {
  fieldName: string
  type: string
  widget: string
  required: boolean
  readonly: boolean
  label: string
  description?: string
  constraints?: {
    maxLength?: number
    minLength?: number
    pattern?: string
    choices?: string[]
  }
  layout?: {
    span?: 1 | 2 | 3
    hidden?: boolean
  }
}

/**
 * Canonicalize form YAML + metadata
 * 
 * Transforms YAML + metadata into a canonical descriptor that
 * the UI renderer can consume deterministically.
 * 
 * @param yaml Form YAML
 * @param metadata Contract metadata
 * @returns Canonical form descriptor
 */
export function canonicalizeForm(
  yaml: FormYaml,
  metadata: ContractDefinition
): CanonicalFormDescriptor {
  const fieldMap = new Map<string, FieldDefinition>()
  for (const field of metadata.baseSchema.fields) {
    fieldMap.set(field.name, field)
  }

  const projectionCapabilities = metadata.projectionCapabilities || {}

  const sections: CanonicalSectionDescriptor[] = yaml.form.sections.map((section) => {
    const fields: CanonicalFieldDescriptor[] = section.fields.map((fieldName) => {
      const fieldDef = fieldMap.get(fieldName)
      if (!fieldDef) {
        throw new Error(`Field "${fieldName}" not found in metadata`)
      }

      // Determine widget from projectionCapabilities
      const typeCapabilities = projectionCapabilities[fieldDef.type]
      const widget = typeCapabilities?.defaultWidget || getDefaultWidgetForType(fieldDef.type)

      // Determine readonly/editability
      const readonly = typeCapabilities?.readonly === true || false
      const editable = typeCapabilities?.editable !== false

      // Extract constraints (canonicalize: default to [] if missing)
      const constraints: CanonicalFieldDescriptor['constraints'] = {}
      const fieldConstraints = fieldDef.constraints ?? []
      for (const constraint of fieldConstraints) {
        if (constraint.type === 'max' && typeof constraint.value === 'number') {
          constraints.maxLength = constraint.value
        }
        if (constraint.type === 'min' && typeof constraint.value === 'number') {
          constraints.minLength = constraint.value
        }
      }

      // Generate label from field name (camelCase -> Title Case)
      const label = fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()

      // Extract layout hints from YAML section field (if specified)
      // Note: YAML field layout hints would be in section.fields array items
      // For now, we don't have field-level layout in YAML, so we set undefined
      // TODO: Extract from YAML if field-level layout hints are added

      return {
        fieldName,
        type: fieldDef.type,
        widget,
        required: !fieldDef.optional && !fieldDef.nullable,
        readonly: readonly || !editable,
        label,
        description: fieldDef.comment,
        constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
        layout: undefined, // Field-level layout not yet supported in YAML
      }
    })

    // Extract layout hints from YAML (if specified)
    const sectionLayout = (section as any).layout

    return {
      id: section.id,
      title: section.title,
      fields,
      layout: sectionLayout
        ? {
            columns: sectionLayout.columns as 1 | 2 | 3 | undefined,
            collapsible: sectionLayout.collapsible as boolean | undefined,
          }
        : undefined,
    }
  })

  // ✅ NEW: Extract invariant metadata from YAML
  const declaredInvariants = yaml.form.invariants?.invariants || []
  const enforceAt = yaml.form.invariants?.enforceAt || 'both'
  
  // ✅ NEW: Extract padding from YAML (F004: Canonical Padding)
  const padding = yaml.form.padding || { x: 24, y: 16 } // Default to canonical
  
  // ✅ NEW: Extract scroll container declaration (F82: Single Scroll Container)
  const scrollContainer: ScrollContainer = yaml.form.scrollContainer ? {
    id: yaml.form.scrollContainer.id || `${yaml.form.contract}.${yaml.form.variant}.scroll`,
    type: yaml.form.scrollContainer.type || 'form',
  } : {
    id: `${yaml.form.contract}.${yaml.form.variant}.scroll`,
    type: 'form' as const,
  }

  // ✅ Ensure canonical values (enforce literal types)
  const canonicalPaddingX: CanonicalPaddingX = (padding.x ?? 24) as CanonicalPaddingX
  const canonicalPaddingY: CanonicalPaddingY = (padding.y ?? 16) as CanonicalPaddingY
  const canonicalSpacing: CanonicalSpacing = 24 as CanonicalSpacing // Default section spacing
  const canonicalGrid: CanonicalGrid = 4 as CanonicalGrid // ✅ F86: 4px grid
  
  // Validate padding values are canonical
  if (canonicalPaddingX !== 24) {
    throw new Error(`Non-canonical horizontal padding: ${canonicalPaddingX}px (expected 24px)`)
  }
  if (canonicalPaddingY !== 16) {
    throw new Error(`Non-canonical vertical padding: ${canonicalPaddingY}px (expected 16px)`)
  }
  
  const descriptor: CanonicalFormDescriptor = {
    contract: yaml.form.contract,
    variant: yaml.form.variant,
    sections,
    // ✅ NEW: Invariant metadata
    invariants: {
      declared: declaredInvariants,
      enforced: declaredInvariants.map(id => ({
        id,
        enforceAt,
        layer: enforceAt === 'build' ? 'ACT' : enforceAt === 'runtime' ? 'RUNTIME' : 'BOTH',
      })),
    },
    // ✅ NEW: Invariant-encoded constraints (literal types)
    padding: {
      x: canonicalPaddingX, // ✅ F004: Literal 24
      y: canonicalPaddingY, // ✅ F004: Literal 16
    },
    scrollContainers: [scrollContainer], // ✅ F82: Tuple of length 1
    // ✅ NEW: Canonical spacing and grid (literal types)
    canonicalSpacing,
    canonicalGrid,
    // ✅ PHASE 3: Functional bindings (if present in YAML)
    functional: yaml.form.functional ? yaml.form.functional as FunctionalBinding : undefined,
  }

  // Validate invariants before returning
  validateFormInvariants(descriptor, metadata)

  return descriptor
}

/**
 * Get default widget for field type
 * 
 * Fallback when projectionCapabilities don't specify a default.
 */
function getDefaultWidgetForType(type: string): string {
  switch (type) {
    case 'uuid':
      return 'text'
    case 'string':
      return 'text'
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'datetime':
      return 'datetime-local'
    case 'date':
      return 'date'
    case 'json':
      return 'textarea'
    case 'record':
      return 'textarea'
    case 'array':
      return 'textarea'
    case 'object':
      return 'textarea'
    default:
      return 'text'
  }
}

