/**
 * ✅ ENTELECHIA: Scroll FORM Schema
 * 
 * Canonical scroll behavior declarations for views/layouts.
 * 
 * FORM → ACT → STATE → RUNTIME:
 * - FORM: Scroll kind/elasticity declared in YAML
 * - ACT: Validated and canonicalized
 * - STATE: Literal types in descriptors
 * - RUNTIME: ElasticScrollContainer or standard scroll
 */

import { z } from 'zod'

/**
 * Scroll Kind Schema
 * 
 * Defines the type of scroll behavior:
 * - standard: Native browser scroll (no bounce)
 * - elastic: Elastic bounce scroll (Apple-style)
 */
export const ScrollKindSchema = z.enum(['standard', 'elastic'])

/**
 * Elasticity Schema
 * 
 * Only applies when kind === 'elastic'.
 * Controls the spring physics parameters:
 * - soft: Gentle bounce (lower stiffness, higher damping)
 * - medium: Balanced bounce (default)
 * - firm: Strong bounce (higher stiffness, lower damping)
 */
export const ElasticitySchema = z.enum(['soft', 'medium', 'firm']).optional()

/**
 * Overscroll Behavior Schema
 * 
 * Controls how overscroll is handled:
 * - auto: Default browser behavior
 * - contain: Prevent scroll chaining
 * - none: Disable overscroll
 */
export const OverscrollBehaviorSchema = z.enum(['auto', 'contain', 'none']).optional()

/**
 * Scroll Descriptor Schema
 * 
 * Complete scroll configuration for a scroll region.
 */
export const ScrollDescriptorSchema = z.object({
  kind: ScrollKindSchema,
  elasticity: ElasticitySchema,
  overscrollBehavior: OverscrollBehaviorSchema.default('contain'),
  invariants: z.array(z.string()).optional(), // UI_SCROLL invariant IDs
}).refine(
  (data) => {
    // If kind is 'elastic', elasticity should be defined (or default to 'medium')
    if (data.kind === 'elastic' && !data.elasticity) {
      return false
    }
    // If kind is 'standard', elasticity should not be defined
    if (data.kind === 'standard' && data.elasticity) {
      return false
    }
    return true
  },
  {
    message: 'Elasticity must be defined for elastic scroll, and must not be defined for standard scroll',
  }
)

export type ScrollKind = z.infer<typeof ScrollKindSchema>
export type Elasticity = z.infer<typeof ElasticitySchema>
export type OverscrollBehavior = z.infer<typeof OverscrollBehaviorSchema>
export type ScrollDescriptor = z.infer<typeof ScrollDescriptorSchema>

