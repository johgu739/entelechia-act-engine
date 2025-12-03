/**
 * ✅ ENTELECHIA: Purity Guards Canonicalizer
 * 
 * Canonicalizes Purity Guards YAML files into CanonicalPurityGuardDescriptor.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: Purity Guards YAML files
 * - ACT: This canonicalizer validates and transforms
 * - STATE: Generated descriptors
 * - RUNTIME: Guards enforce purity
 */

import { readFileSync } from 'fs'
import { parse } from 'yaml'
import {
  ArchitecturalPurityGuardSchema,
  FormPurityGuardSchema,
  ActTeleologyGuardSchema,
  StateIntegrityGuardSchema,
  IntentPurityGuardSchema,
  EpistemicPurityGuardSchema,
  type ArchitecturalPurityGuard,
  type FormPurityGuard,
  type ActTeleologyGuard,
  type StateIntegrityGuard,
  type IntentPurityGuard,
  type EpistemicPurityGuard,
} from './purity-guards-schema.js'

/**
 * Canonical Purity Guard Violation Descriptor
 */
export interface CanonicalPurityGuardViolation {
  pattern: string
  matcher: {
    imports?: Array<{ from: string; in?: string; notIn?: string }>
    identifiers?: Array<{ pattern: string; description?: string; in?: string; notIn?: string; matching?: string }>
    filePatterns?: Array<{ pattern: string; exclude?: string }>
    gitStatus?: 'modified' | 'added' | 'deleted'
    notIn?: string
    notGeneratedBy?: string
    missing?: string
    scope?: string
    comparison?: { form: string; act: string; check: string }
    semantic?: string
  }
  telosViolated: string
  resolutionSteps: string[]
}

/**
 * Canonical Purity Guard Invariant Descriptor
 */
export interface CanonicalPurityGuardInvariant {
  id: string
  name: string
  description: string
  severity: 'error' | 'warn'
  enforcement: 'build' | 'runtime' | 'both'
  violations: CanonicalPurityGuardViolation[]
}

/**
 * Canonical Purity Guard Descriptor
 */
export interface CanonicalPurityGuardDescriptor {
  guardType: 'architectural' | 'form' | 'act' | 'state' | 'intent' | 'epistemic'
  metadata: {
    version: string
    description?: string
    lastUpdated?: string
  }
  invariants: CanonicalPurityGuardInvariant[]
}

/**
 * Load and parse Architectural Purity Guard YAML
 */
export function loadArchitecturalPurityGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = ArchitecturalPurityGuardSchema.parse(parsed)
  
  return {
    guardType: 'architectural',
    metadata: validated.architecturalPurityGuard.metadata,
    invariants: validated.architecturalPurityGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load and parse FORM Purity Guard YAML
 */
export function loadFormPurityGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = FormPurityGuardSchema.parse(parsed)
  
  return {
    guardType: 'form',
    metadata: validated.formPurityGuard.metadata,
    invariants: validated.formPurityGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load and parse ACT Teleology Guard YAML
 */
export function loadActTeleologyGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = ActTeleologyGuardSchema.parse(parsed)
  
  return {
    guardType: 'act',
    metadata: validated.actTeleologyGuard.metadata,
    invariants: validated.actTeleologyGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load and parse STATE Integrity Guard YAML
 */
export function loadStateIntegrityGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = StateIntegrityGuardSchema.parse(parsed)
  
  return {
    guardType: 'state',
    metadata: validated.stateIntegrityGuard.metadata,
    invariants: validated.stateIntegrityGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load and parse Intent Purity Guard YAML
 */
export function loadIntentPurityGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = IntentPurityGuardSchema.parse(parsed)
  
  return {
    guardType: 'intent',
    metadata: validated.intentPurityGuard.metadata,
    invariants: validated.intentPurityGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load and parse Epistemic Purity Guard YAML
 */
export function loadEpistemicPurityGuard(filePath: string): CanonicalPurityGuardDescriptor {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  const validated = EpistemicPurityGuardSchema.parse(parsed)
  
  return {
    guardType: 'epistemic',
    metadata: validated.epistemicPurityGuard.metadata,
    invariants: validated.epistemicPurityGuard.invariants.map(inv => ({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      severity: inv.severity,
      enforcement: inv.enforcement,
      violations: inv.violations.map(v => ({
        pattern: v.pattern,
        matcher: v.matcher,
        telosViolated: v.telosViolated,
        resolutionSteps: v.resolutionSteps,
      })),
    })),
  }
}

/**
 * Load all Purity Guards
 */
export function loadAllPurityGuards(workspaceRoot: string): Map<string, CanonicalPurityGuardDescriptor> {
  const guards = new Map<string, CanonicalPurityGuardDescriptor>()
  const purityGuardsDir = `${workspaceRoot}/entelechia-form/purity-guards`
  
  try {
    guards.set('architectural', loadArchitecturalPurityGuard(`${purityGuardsDir}/architectural-purity.yaml`))
    guards.set('form', loadFormPurityGuard(`${purityGuardsDir}/form-purity.yaml`))
    guards.set('act', loadActTeleologyGuard(`${purityGuardsDir}/act-teleology.yaml`))
    guards.set('state', loadStateIntegrityGuard(`${purityGuardsDir}/state-integrity.yaml`))
    guards.set('intent', loadIntentPurityGuard(`${purityGuardsDir}/intent-purity.yaml`))
    guards.set('epistemic', loadEpistemicPurityGuard(`${purityGuardsDir}/epistemic-purity.yaml`))
  } catch (error: any) {
    throw new Error(`Failed to load purity guards: ${error.message}`)
  }
  
  return guards
}

