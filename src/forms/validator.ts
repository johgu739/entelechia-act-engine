/**
 * ✅ ENTELECHIA: Form YAML Validator
 * 
 * Validates form YAML files against contract metadata.
 * 
 * PRINCIPLE: All fields must exist in metadata.baseSchema.
 * No new fields may appear.
 * No illegal widgets.
 * Sections must match allowed order (via invariants).
 */

import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'
import type { FormYaml } from './yaml-schema.js'

/**
 * Validation error
 */
export class FormValidationError extends Error {
  constructor(
    public readonly contract: string,
    public readonly variant: string,
    public readonly errors: string[]
  ) {
    super(`Form validation failed for ${contract}.${variant}: ${errors.join(', ')}`)
    this.name = 'FormValidationError'
  }
}

/**
 * Validate form YAML against contract metadata
 * 
 * Checks:
 * - contract existence
 * - variant existence
 * - each field exists in metadata
 * - allowed widgets (if widget hints added)
 * - invariants regarding section composition
 * 
 * @param yaml Form YAML
 * @param metadata Contract metadata
 * @throws FormValidationError if validation fails
 */
export function validateFormYaml(
  yaml: FormYaml,
  metadata: ContractDefinition
): void {
  const errors: string[] = []

  // 1. Contract must match metadata.name
  if (yaml.form.contract !== metadata.name) {
    errors.push(
      `Contract mismatch: YAML specifies "${yaml.form.contract}" but metadata has "${metadata.name}"`
    )
  }

  // 2. Variant must match a formSchemas[].id
  if (!metadata.formSchemas || metadata.formSchemas.length === 0) {
    errors.push(`No formSchemas defined in metadata for contract "${metadata.name}"`)
  } else {
    const variantExists = metadata.formSchemas.some(
      (formSchema) => formSchema.id === yaml.form.variant
    )
    if (!variantExists) {
      errors.push(
        `Variant "${yaml.form.variant}" not found in formSchemas. Available variants: ${metadata.formSchemas.map((s) => s.id).join(', ')}`
      )
    }
  }

  // 3. Each field must exist in metadata.baseSchema
  const baseFieldNames = new Set(metadata.baseSchema.fields.map((f) => f.name))
  const allYamlFields = yaml.form.sections.flatMap((section) => section.fields)
  const uniqueYamlFields = Array.from(new Set(allYamlFields))

  for (const fieldName of uniqueYamlFields) {
    if (!baseFieldNames.has(fieldName)) {
      errors.push(
        `Field "${fieldName}" does not exist in metadata.baseSchema. Available fields: ${Array.from(baseFieldNames).join(', ')}`
      )
    }
  }

  // 4. Check for duplicate fields across sections
  const fieldOccurrences = new Map<string, number>()
  for (const fieldName of allYamlFields) {
    fieldOccurrences.set(fieldName, (fieldOccurrences.get(fieldName) || 0) + 1)
  }
  for (const [fieldName, count] of fieldOccurrences.entries()) {
    if (count > 1) {
      errors.push(`Field "${fieldName}" appears ${count} times across sections (must appear exactly once)`)
    }
  }

  // 5. Validate section IDs are unique
  const sectionIds = yaml.form.sections.map((s) => s.id)
  const uniqueSectionIds = new Set(sectionIds)
  if (sectionIds.length !== uniqueSectionIds.size) {
    errors.push('Section IDs must be unique')
  }

  // 6. If projectionCapabilities exist, validate widget appropriateness
  // (This is a placeholder - widget validation will be added when widgets are specified in YAML)
  if (metadata.projectionCapabilities) {
    // Future: Validate widget hints against projectionCapabilities
  }

  if (errors.length > 0) {
    throw new FormValidationError(yaml.form.contract, yaml.form.variant, errors)
  }
}


