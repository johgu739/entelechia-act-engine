/**
 * ✅ ENTELECHIA: Architecture Canonicalizer
 * 
 * Canonicalizes Architecture Rules YAML files into CanonicalArchitectureRuleDescriptor.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: Architecture Rules YAML files
 * - ACT: This canonicalizer validates and transforms
 * - STATE: Generated descriptors
 * - RUNTIME: Architecture guard enforces violations
 */

import { readFileSync } from 'fs'
import { parse } from 'yaml'
import {
  ArchitectureRulesYamlSchema,
  MetaphysicalSentryYamlSchema,
  type ArchitectureRulesYaml,
  type MetaphysicalSentryYaml,
} from './architecture-schema.js'

/**
 * Canonical Architecture Rule Descriptor
 */
export interface CanonicalArchitectureRuleDescriptor {
  id: string
  scope: 'ui' | 'backend' | 'both'
  layer: 'build' | 'runtime' | 'both'
  severity: 'error' | 'warn'
  matchers: {
    imports?: Array<{ from: string; description?: string }>
    identifiers?: Array<{ pattern: string; description?: string }>
  }
  excludePaths?: string[]  // ✅ EXCEPTION: File path patterns to exclude from this rule
  telosViolated: string
  resolutionHint: string[]
  devtoolsCategory: 'architecture' | 'ui' | 'backend'
}

/**
 * Canonical Metaphysical Sentry Violation Descriptor
 */
export interface CanonicalMetaphysicalSentryViolationDescriptor {
  ruleId: string
  displayName: string
  telosViolated: string
  canonicalResolutionSteps: string[]
  devtoolsCategory: 'architecture' | 'ui' | 'backend'
  severity: 'error' | 'warn'
}

/**
 * Load and parse Architecture Rules YAML file
 */
export function loadArchitectureRulesFile(filePath: string): ArchitectureRulesYaml {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  
  // Validate against schema
  const validated = ArchitectureRulesYamlSchema.parse(parsed)
  return validated
}

/**
 * Load and parse Metaphysical Sentry YAML file
 */
export function loadMetaphysicalSentryFile(filePath: string): MetaphysicalSentryYaml {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  
  // Validate against schema
  const validated = MetaphysicalSentryYamlSchema.parse(parsed)
  return validated
}

/**
 * Canonicalize Architecture Rules
 */
export function canonicalizeArchitectureRules(
  yaml: ArchitectureRulesYaml
): CanonicalArchitectureRuleDescriptor[] {
  const rules: CanonicalArchitectureRuleDescriptor[] = []
  
  for (const rule of yaml.architectureRules.rules) {
    // Validate rule ID format
    if (!rule.id.match(/^ARCHITECTURE\.F\d+_[A-Z_]+$/)) {
      throw new Error(
        `Invalid architecture rule ID format: "${rule.id}". Must match ARCHITECTURE.Fxx_NAME`
      )
    }
    
    const canonicalRule: CanonicalArchitectureRuleDescriptor = {
      id: rule.id,
      scope: rule.scope,
      layer: rule.layer,
      severity: rule.severity,
      matchers: {
        imports: rule.matchers.imports?.map(imp => ({
          from: imp.from,
          description: imp.description,
        })),
        identifiers: rule.matchers.identifiers?.map(id => ({
          pattern: id.pattern,
          description: id.description,
        })),
      },
      excludePaths: rule.excludePaths,  // ✅ EXCEPTION: Preserve exclude paths
      telosViolated: rule.telosViolated,
      resolutionHint: rule.resolutionHint,
      devtoolsCategory: rule.devtoolsCategory,
    }
    
    rules.push(canonicalRule)
  }
  
  return rules
}

/**
 * Canonicalize Metaphysical Sentry violations
 */
export function canonicalizeMetaphysicalSentryViolations(
  yaml: MetaphysicalSentryYaml
): Map<string, CanonicalMetaphysicalSentryViolationDescriptor> {
  const violations = new Map<string, CanonicalMetaphysicalSentryViolationDescriptor>()
  
  for (const violation of yaml.metaphysicalSentry.violations) {
    violations.set(violation.ruleId, {
      ruleId: violation.ruleId,
      displayName: violation.displayName,
      telosViolated: violation.telosViolated,
      canonicalResolutionSteps: violation.canonicalResolutionSteps,
      devtoolsCategory: violation.devtoolsCategory,
      severity: violation.severity,
    })
  }
  
  return violations
}

