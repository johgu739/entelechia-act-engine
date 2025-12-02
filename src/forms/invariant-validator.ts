/**
 * ✅ ENTELECHIA: Form Invariant Validator
 * 
 * Build-time validation of form descriptors against layout invariants.
 * 
 * PRINCIPLE: Fail fast - violations detected at codegen time, not runtime.
 * 
 * FORM → ACT → STATE:
 * - FORM: CanonicalFormDescriptor (from canonicalizer)
 * - ACT: Validator checks invariants
 * - STATE: Validation errors (fail codegen if violated)
 */

import type { CanonicalFormDescriptor } from './canonicalizer.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import { registry } from '@entelechia/invariant-engine'

/**
 * Form invariant violation error
 */
export class FormInvariantViolationError extends Error {
  constructor(
    public readonly invariantId: string,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(`Form invariant violation [${invariantId}]: ${message}`)
    this.name = 'FormInvariantViolationError'
  }
}

/**
 * Validate form descriptor against layout invariants
 * 
 * Checks:
 * - FORM-LAY-004: Canonical padding (24px X, 16px Y)
 * - FORM-LAY-005: Single scroll container (enforced by FormFrame)
 * - FORM-LAY-003: Widget appropriateness (enforced by canonicalizer)
 * - F85: Typography scale (enforced by blocks)
 * - F86: Spacing grid (enforced by blocks)
 * 
 * @param descriptor Form descriptor to validate
 * @param contract Contract metadata (for context)
 * @throws FormInvariantViolationError if violations detected
 */
export function validateFormInvariants(
  descriptor: CanonicalFormDescriptor,
  contract: ContractDefinition
): void {
  const errors: string[] = []

  // FORM-LAY-003: Widget appropriateness
  // This is enforced by canonicalizer, but we verify here as well
  const projectionCapabilities = contract.projectionCapabilities || {}
  for (const section of descriptor.sections) {
    for (const field of section.fields) {
      const typeCapabilities = projectionCapabilities[field.type]
      if (typeCapabilities) {
        // Check if widget is allowed for this type
        const allowedWidgets = typeCapabilities.allowedWidgets || []
        if (allowedWidgets.length > 0 && !allowedWidgets.includes(field.widget)) {
          errors.push(
            `Field "${field.fieldName}" uses widget "${field.widget}" which is not allowed for type "${field.type}". Allowed widgets: ${allowedWidgets.join(', ')}`
          )
        }
      }
    }
  }

  // ✅ NEW: F82 - Single Scroll Container
  // Verify descriptor has exactly one scroll container (tuple of length 1)
  if (descriptor.scrollContainers.length !== 1) {
    errors.push(
      `F82 violation: Form must have exactly one scroll container. Found ${descriptor.scrollContainers.length} scroll containers.`
    )
  }

  // ✅ NEW: F004 - Canonical Padding
  // Verify padding matches canonical values (24px X, 16px Y)
  const expectedX = 24
  const expectedY = 16
  if (descriptor.padding.x !== expectedX) {
    errors.push(
      `F004 violation: Form horizontal padding is ${descriptor.padding.x}px, expected ${expectedX}px. Form containers must use canonical padding.`
    )
  }
  if (descriptor.padding.y !== expectedY) {
    errors.push(
      `F004 violation: Form vertical padding is ${descriptor.padding.y}px, expected ${expectedY}px. Form containers must use canonical padding.`
    )
  }

  // ✅ NEW: Validate declared invariants
  // Verify all declared invariants exist in registry and are applicable to forms
  for (const invariantId of descriptor.invariants.declared) {
    const entry = registry.get(invariantId)
    if (!entry) {
      errors.push(`Declared invariant ${invariantId} not found in registry`)
      continue
    }
    
    // Verify invariant is applicable to forms (UI_FORM, UI_SCROLL, UI_LAYOUT categories)
    // Note: We don't throw errors for non-applicable categories, just log warnings in validation
    // This allows forms to declare domain invariants if needed
  }

  // Section ID uniqueness
  const sectionIds = new Set<string>()
  for (const section of descriptor.sections) {
    if (sectionIds.has(section.id)) {
      errors.push(`Duplicate section ID: "${section.id}"`)
    }
    sectionIds.add(section.id)
  }

  // Field name uniqueness within form
  const fieldNames = new Set<string>()
  for (const section of descriptor.sections) {
    for (const field of section.fields) {
      if (fieldNames.has(field.fieldName)) {
        errors.push(`Duplicate field name: "${field.fieldName}"`)
      }
      fieldNames.add(field.fieldName)
    }
  }

  // Throw if violations detected
  if (errors.length > 0) {
    throw new FormInvariantViolationError(
      'FORM-LAY-VALIDATION',
      `Form validation failed for ${descriptor.contract}.${descriptor.variant}`,
      { errors }
    )
  }
}


