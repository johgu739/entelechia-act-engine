/**
 * ✅ ENTELECHIA: Architecture FORM Schema
 * 
 * Zod schemas for validating Architecture Rules YAML files.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: Architecture YAML files define architectural invariants
 * - ACT: This schema validates and canonicalizes Architecture Rules
 * - STATE: Generated descriptors provide type-safe rule lookup
 * - RUNTIME: Architecture guard enforces violations
 */

import { z } from 'zod'

/**
 * Architecture Rule ID schema (must match format: ARCHITECTURE.Fxx_*)
 */
export const ArchitectureRuleIdSchema = z.string().regex(
  /^ARCHITECTURE\.F\d+_[A-Z_]+$/,
  'Must match format ARCHITECTURE.Fxx_NAME (e.g., "ARCHITECTURE.F01_FORBIDDEN_UI_ACT_HOOK")'
).describe('Architecture Rule ID')

/**
 * Import matcher schema
 */
export const ImportMatcherSchema = z.object({
  from: z.string().min(1).describe('Import path pattern (supports glob: **, *)'),
  description: z.string().optional().describe('Human-readable description of what this matches'),
})

/**
 * Identifier matcher schema
 */
export const IdentifierMatcherSchema = z.object({
  pattern: z.string().min(1).describe('Regex pattern for identifier matching'),
  description: z.string().optional().describe('Human-readable description of what this matches'),
})

/**
 * Matchers schema
 */
export const MatchersSchema = z.object({
  imports: z.array(ImportMatcherSchema).optional().describe('Import path matchers'),
  identifiers: z.array(IdentifierMatcherSchema).optional().describe('Identifier name matchers'),
})

/**
 * Architecture Rule schema
 */
export const ArchitectureRuleSchema = z.object({
  id: ArchitectureRuleIdSchema,
  scope: z.enum(['ui', 'backend', 'both']).describe('Scope: ui, backend, or both'),
  layer: z.enum(['build', 'runtime', 'both']).describe('Enforcement layer: build, runtime, or both'),
  severity: z.enum(['error', 'warn']).describe('Severity level'),
  matchers: MatchersSchema.describe('Matchers for detecting violations'),
  excludePaths: z.array(z.string()).optional().describe('File path patterns to exclude from this rule (glob patterns, e.g., "**/intent/**")'),
  telosViolated: z.string().min(1).describe('Description of teleological violation'),
  resolutionHint: z.array(z.string()).min(1).describe('Steps to resolve the violation'),
  devtoolsCategory: z.enum(['architecture', 'ui', 'backend']).describe('Devtools category for display'),
})

export type ArchitectureRule = z.infer<typeof ArchitectureRuleSchema>

/**
 * Architecture Rules YAML schema
 */
export const ArchitectureRulesYamlSchema = z.object({
  architectureRules: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    rules: z.array(ArchitectureRuleSchema).min(1).describe('Architecture rules'),
    invariants: z.array(z.string()).optional().describe('Invariant IDs enforced by architecture rules'),
  }),
})

export type ArchitectureRulesYaml = z.infer<typeof ArchitectureRulesYamlSchema>

/**
 * Metaphysical Sentry Violation schema
 */
export const MetaphysicalSentryViolationSchema = z.object({
  ruleId: ArchitectureRuleIdSchema,
  displayName: z.string().min(1).describe('Human-readable display name'),
  telosViolated: z.string().min(1).describe('Multi-line description of teleological violation'),
  canonicalResolutionSteps: z.array(z.string()).min(1).describe('Canonical steps to resolve violation'),
  devtoolsCategory: z.enum(['architecture', 'ui', 'backend']).describe('Devtools category'),
  severity: z.enum(['error', 'warn']).describe('Severity level'),
})

/**
 * Metaphysical Sentry YAML schema
 */
export const MetaphysicalSentryYamlSchema = z.object({
  metaphysicalSentry: z.object({
    metadata: z.object({
      version: z.string(),
      description: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
    violations: z.array(MetaphysicalSentryViolationSchema).min(1).describe('Violation metadata'),
  }),
})

export type MetaphysicalSentryYaml = z.infer<typeof MetaphysicalSentryYamlSchema>

