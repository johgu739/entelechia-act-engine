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
import { validateFormInvariants } from './invariant-validator.js'

/**
 * Canonical form descriptor
 * 
 * This is the generated structure that the UI renderer consumes.
 */
export interface CanonicalFormDescriptor {
  contract: string
  variant: string
  sections: CanonicalSectionDescriptor[]
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

  const descriptor: CanonicalFormDescriptor = {
    contract: yaml.form.contract,
    variant: yaml.form.variant,
    sections,
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

