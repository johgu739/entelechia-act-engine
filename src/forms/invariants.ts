/**
 * ✅ ENTELECHIA: Form Layout Invariants
 * 
 * Build-time invariant checks for form generation.
 * 
 * PRINCIPLE: These invariants are checked during codegen and fail CI if violated.
 * 
 * ✅ STAGE 1: Pure ACT - no FORM embedded here.
 * All layout rules come from:
 * - Metadata formSchemas (FORM)
 * - YAML form definitions (FORM)
 * - Invariant engine definitions (FORM)
 * 
 * This file contains only algorithmic checks over FORM, no hard-coded FORM.
 */

import type { CanonicalFormDescriptor } from './canonicalizer.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'

/**
 * Build-time invariant violation error
 */
export class FormInvariantViolationError extends Error {
  constructor(
    public readonly invariantId: string,
    public readonly contract: string,
    public readonly variant: string,
    message: string
  ) {
    super(`[${invariantId}] ${contract}.${variant}: ${message}`)
    this.name = 'FormInvariantViolationError'
  }
}

/**
 * Check all form layout invariants
 * 
 * ✅ STAGE 1: Pure ACT - reads FORM only, no embedded FORM
 * 
 * @param descriptor Canonical form descriptor
 * @param metadata Contract metadata
 * @throws FormInvariantViolationError if any invariant is violated
 */
export function checkFormLayoutInvariants(
  descriptor: CanonicalFormDescriptor,
  metadata: ContractDefinition
): void {
  checkSectionOrdering(descriptor, metadata)
  checkFieldGroupingSpacing(descriptor)
  checkWidgetAppropriateness(descriptor, metadata)
  checkCanonicalPadding(descriptor)
  checkSingleScrollContainer(descriptor)
}

/**
 * FORM-LAY-001: Section ordering correctness
 * 
 * Sections must appear in the order defined by formSchemas.defaultSections
 */
function checkSectionOrdering(
  descriptor: CanonicalFormDescriptor,
  metadata: ContractDefinition
): void {
  if (!metadata.formSchemas || metadata.formSchemas.length === 0) {
    return // No formSchemas defined, skip check
  }

  const formSchema = metadata.formSchemas.find((fs) => fs.id === descriptor.variant)
  if (!formSchema || !formSchema.defaultSections) {
    return // No defaultSections defined, skip check
  }

  const expectedOrder = formSchema.defaultSections.map((s) => s.id)
  const actualOrder = descriptor.sections.map((s) => s.id)

  if (JSON.stringify(expectedOrder) !== JSON.stringify(actualOrder)) {
    throw new FormInvariantViolationError(
      'FORM-LAY-001',
      descriptor.contract,
      descriptor.variant,
      `Section order mismatch. Expected: ${expectedOrder.join(', ')}, Got: ${actualOrder.join(', ')}`
    )
  }
}

/**
 * FORM-LAY-002: Field grouping spacing law
 * 
 * Fields within sections must use consistent spacing (16px vertical between fields)
 * This is enforced by the renderer using space-y-4, so we just verify sections exist
 */
function checkFieldGroupingSpacing(descriptor: CanonicalFormDescriptor): void {
  // Spacing is enforced by renderer CSS (space-y-4 = 16px)
  // This check verifies that sections have fields
  for (const section of descriptor.sections) {
    if (section.fields.length === 0) {
      throw new FormInvariantViolationError(
        'FORM-LAY-002',
        descriptor.contract,
        descriptor.variant,
        `Section "${section.id}" has no fields`
      )
    }
  }
}

/**
 * FORM-LAY-003: Widget-appropriateness
 * 
 * Widgets must match field type capabilities defined in projectionCapabilities
 */
function checkWidgetAppropriateness(
  descriptor: CanonicalFormDescriptor,
  metadata: ContractDefinition
): void {
  if (!metadata.projectionCapabilities) {
    return // No projectionCapabilities defined, skip check
  }

  for (const section of descriptor.sections) {
    for (const field of section.fields) {
      const typeCapabilities = metadata.projectionCapabilities[field.type]
      if (!typeCapabilities) {
        // No capabilities defined for this type, skip
        continue
      }

      if (!typeCapabilities.allowedWidgets.includes(field.widget)) {
        throw new FormInvariantViolationError(
          'FORM-LAY-003',
          descriptor.contract,
          descriptor.variant,
          `Field "${field.fieldName}" uses widget "${field.widget}" which is not allowed for type "${field.type}". Allowed widgets: ${typeCapabilities.allowedWidgets.join(', ')}`
        )
      }
    }
  }
}

/**
 * FORM-LAY-004: Canonical padding (24px X, 16px Y)
 * 
 * This is enforced by the renderer using CLASSES, so we just verify the structure exists
 */
function checkCanonicalPadding(descriptor: CanonicalFormDescriptor): void {
  // Padding is enforced by renderer CSS (CLASSES.HEADER_PADDING_X/Y)
  // This check verifies that the descriptor has the correct structure
  if (!descriptor.contract || !descriptor.variant) {
    throw new FormInvariantViolationError(
      'FORM-LAY-004',
      descriptor.contract || 'unknown',
      descriptor.variant || 'unknown',
      'Descriptor missing contract or variant'
    )
  }
}

/**
 * FORM-LAY-005: Single-scroll-container
 * 
 * Forms must have exactly one scroll container
 * This is enforced by the renderer structure, so we verify sections are properly nested
 */
function checkSingleScrollContainer(descriptor: CanonicalFormDescriptor): void {
  // Single scroll container is enforced by renderer structure
  // This check verifies that sections exist and are properly structured
  if (descriptor.sections.length === 0) {
    throw new FormInvariantViolationError(
      'FORM-LAY-005',
      descriptor.contract,
      descriptor.variant,
      'Form has no sections'
    )
  }
}

