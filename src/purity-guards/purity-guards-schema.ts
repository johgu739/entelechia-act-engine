/**
 * ✅ ENTELECHIA: Purity Guards FORM Schema
 * 
 * Zod schemas for validating Purity Guards YAML files.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: Purity Guards YAML files define purity rules
 * - ACT: This schema validates and canonicalizes Purity Guards
 * - STATE: Generated descriptors provide type-safe guard lookup
 * - RUNTIME: Guards enforce purity at runtime
 */

import { z } from 'zod'

/**
 * Violation Matcher Schema
 */
export const ViolationMatcherSchema = z.object({
  pattern: z.string().min(1).describe('Pattern name'),
  matcher: z.object({
    imports: z.array(z.object({
      from: z.string().min(1),
      in: z.string().optional(),
      notIn: z.string().optional(),
    })).optional(),
    identifiers: z.array(z.object({
      pattern: z.string().min(1),
      description: z.string().optional(),
      in: z.string().optional(),
      notIn: z.string().optional(),
      matching: z.string().optional(),
    })).optional(),
    filePatterns: z.array(z.object({
      pattern: z.string().min(1),
      exclude: z.string().optional(),
    })).optional(),
    gitStatus: z.enum(['modified', 'added', 'deleted']).optional(),
    notIn: z.string().optional(),
    notGeneratedBy: z.string().optional(),
    missing: z.string().optional(),
    scope: z.string().optional(),
    comparison: z.object({
      form: z.string(),
      act: z.string(),
      check: z.string(),
    }).optional(),
    semantic: z.string().optional(),
  }),
  telosViolated: z.string().min(1).describe('Description of teleological violation'),
  resolutionSteps: z.array(z.string()).min(1).describe('Steps to resolve violation'),
})

/**
 * Purity Guard Invariant Schema
 */
export const PurityGuardInvariantSchema = z.object({
  id: z.string().regex(/^[A-Z_]+\.[A-Z]\d+_[A-Z_]+$/, 'Must match format CATEGORY.CODE_NAME'),
  name: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['error', 'warn']),
  enforcement: z.enum(['build', 'runtime', 'both']),
  violations: z.array(ViolationMatcherSchema).min(1),
})

/**
 * Architectural Purity Guard Schema
 */
export const ArchitecturalPurityGuardSchema = z.object({
  architecturalPurityGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

/**
 * FORM Purity Guard Schema
 */
export const FormPurityGuardSchema = z.object({
  formPurityGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

/**
 * ACT Teleology Guard Schema
 */
export const ActTeleologyGuardSchema = z.object({
  actTeleologyGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

/**
 * STATE Integrity Guard Schema
 */
export const StateIntegrityGuardSchema = z.object({
  stateIntegrityGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

/**
 * Intent Purity Guard Schema
 */
export const IntentPurityGuardSchema = z.object({
  intentPurityGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

/**
 * Epistemic Purity Guard Schema
 */
export const EpistemicPurityGuardSchema = z.object({
  epistemicPurityGuard: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    invariants: z.array(PurityGuardInvariantSchema).min(1),
  }),
})

export type ArchitecturalPurityGuard = z.infer<typeof ArchitecturalPurityGuardSchema>
export type FormPurityGuard = z.infer<typeof FormPurityGuardSchema>
export type ActTeleologyGuard = z.infer<typeof ActTeleologyGuardSchema>
export type StateIntegrityGuard = z.infer<typeof StateIntegrityGuardSchema>
export type IntentPurityGuard = z.infer<typeof IntentPurityGuardSchema>
export type EpistemicPurityGuard = z.infer<typeof EpistemicPurityGuardSchema>

