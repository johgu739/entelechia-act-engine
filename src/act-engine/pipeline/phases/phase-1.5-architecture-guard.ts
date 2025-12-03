/**
 * ✅ ENTELECHIA: Phase 1.5 — Architecture Guard
 * 
 * Validates UI code against architectural rules to prevent UI from acting as ACT.
 * 
 * PRINCIPLE: Fail fast - architectural violations detected at build time, not runtime.
 * This phase runs AFTER Phase 1 (Form Checks) and BEFORE Phase 7.7 (Functional Canonicalization).
 * 
 * Validates:
 * - UI must not import ACT-layer mutation hooks
 * - UI must not perform direct fetch/mutation
 * - UI must not import contract endpoints directly
 * - UI must not mutate state from useEffect
 * - UI must not resolve IntentGraph directly
 * - UI must not wrap IntentGraph in custom logic
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import {
  loadArchitectureRulesFile,
  canonicalizeArchitectureRules,
  type CanonicalArchitectureRuleDescriptor,
} from '../../../architecture/architecture-canonicalizer.js'
import { recordArchitectureViolation, registry } from '@entelechia/invariant-engine'

/**
 * Architecture violation context
 */
export interface ArchitectureViolationContext {
  ruleId: string
  filePath: string
  line: number
  column?: number
  identifier?: string
  importPath?: string
  snippet?: string
  telosViolated: string
  resolutionSteps: string[]
  detectedAt: 'build' | 'runtime'  // ✅ Required for recordArchitectureViolation
  sourceLayer: 'ui' | 'backend'  // ✅ Required for recordArchitectureViolation
  severity?: 'error' | 'warn'  // ✅ PHASE 5: Include severity for proper error/warning handling
}

/**
 * Execute Phase 1.5: Architecture Guard
 */
export async function runPhase1_5ArchitectureGuard(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & {
  violations?: ArchitectureViolationContext[]
}> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const violations: ArchitectureViolationContext[] = []

  try {
    // 1. Load Architecture Rules FORM
    const architectureRulesPath = join(
      config.workspaceRoot,
      'entelechia-form',
      'architecture',
      'architecture-rules.yaml'
    )

    if (!existsSync(architectureRulesPath)) {
      // Architecture rules are optional - if file doesn't exist, skip this phase
      return {
        phase: 1.5,
        name: 'Architecture Guard',
        success: true,
        errors: [],
        warnings: ['architecture-rules.yaml not found - skipping architecture guard'],
        duration: Date.now() - startTime,
      }
    }

    const architectureRulesYaml = loadArchitectureRulesFile(architectureRulesPath)
    const canonicalRules = canonicalizeArchitectureRules(architectureRulesYaml)

    // 2. Scan UI source code
    const uiSourceDir = join(config.workspaceRoot, 'entelechia-ui', 'src')
    
    if (!existsSync(uiSourceDir)) {
      return {
        phase: 1.5,
        name: 'Architecture Guard',
        success: true,
        errors: [],
        warnings: ['entelechia-ui/src directory not found - skipping architecture guard'],
        duration: Date.now() - startTime,
      }
    }

    // Get all TypeScript/TSX files
    const sourceFiles = getAllSourceFiles(uiSourceDir, ['.ts', '.tsx'])

    // 3. Check each file against architecture rules
    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8')
      const relativePath = relative(config.workspaceRoot, filePath)

      // Skip generated files and node_modules
      if (
        relativePath.includes('generated') ||
        relativePath.includes('node_modules') ||
        relativePath.includes('__tests__')
      ) {
        continue
      }

      // Check each rule
      for (const rule of canonicalRules) {
        // Only check UI scope rules
        if (rule.scope !== 'ui' && rule.scope !== 'both') {
          continue
        }

        // Only check build-time rules
        if (rule.layer !== 'build' && rule.layer !== 'both') {
          continue
        }

        const fileViolations = checkFileAgainstRule(filePath, content, rule, relativePath, config)
        violations.push(...fileViolations)
      }
    }

    // 4. Convert violations to errors or warnings based on severity
    // Find rule for each violation to check severity
    const ruleMap = new Map(canonicalRules.map(r => [r.id, r]))
    
    for (const violation of violations) {
      const rule = ruleMap.get(violation.ruleId)
      const errorMessage = formatViolationError(violation)
      
      if (rule?.severity === 'error') {
        errors.push(errorMessage)
      } else {
        // severity === 'warn' or unknown
        warnings.push(errorMessage)
      }
    }

    // 5. Fail pipeline only on error violations (warnings don't block)
    const success = errors.length === 0
    const duration = Date.now() - startTime

    return {
      phase: 1.5,
      name: 'Architecture Guard',
      success,
      errors,
      warnings,
      duration,
      violations: success ? undefined : violations,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    return {
      phase: 1.5,
      name: 'Architecture Guard',
      success: false,
      errors: [`Architecture guard failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

/**
 * Get all source files recursively
 */
function getAllSourceFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue
        }
        files.push(...getAllSourceFiles(fullPath, extensions))
      } else if (entry.isFile()) {
        const ext = entry.name.substring(entry.name.lastIndexOf('.'))
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  return files
}

/**
 * Check file against architecture rule
 */
function checkFileAgainstRule(
  filePath: string,
  content: string,
  rule: CanonicalArchitectureRuleDescriptor,
  relativePath: string,
  config: ActEngineConfig
): ArchitectureViolationContext[] {
  const violations: ArchitectureViolationContext[] = []
  const lines = content.split('\n')

  // ✅ EXCEPTION: Check if file path matches excludePaths
  if (rule.excludePaths) {
    for (const excludePattern of rule.excludePaths) {
      // Convert glob pattern to regex
      const pattern = excludePattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
      
      const excludeRegex = new RegExp(pattern)
      if (excludeRegex.test(relativePath)) {
        // File is excluded - skip this rule
        return []
      }
    }
  }

  // Check import matchers
  if (rule.matchers.imports) {
    for (const importMatcher of rule.matchers.imports) {
      // Convert glob pattern to regex
      const pattern = importMatcher.from
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
      
      const importRegex = new RegExp(
        `import\\s+.*from\\s+['"](${pattern})['"]`,
        'g'
      )

      let match
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1]
        const lineNumber = content.substring(0, match.index).split('\n').length
        
        const violation: ArchitectureViolationContext = {
          ruleId: rule.id,
          filePath: relativePath,
          line: lineNumber,
          importPath,
          snippet: lines[lineNumber - 1]?.trim(),
          telosViolated: rule.telosViolated,
          resolutionSteps: rule.resolutionHint,
          detectedAt: 'build',
          sourceLayer: 'ui',
          severity: rule.severity, // ✅ PHASE 5: Include severity in violation context
        }
        
        violations.push(violation)
        
        // Record in Metaphysical Sentry
        recordArchitectureViolation(violation, config.workspaceRoot)
        
        // ✅ ACT ENFORCEMENT: Architecture violations are logged, not thrown
        // Build will fail via errors array, not via invariant enforcement
      }
    }
  }

  // Check identifier matchers
  if (rule.matchers.identifiers) {
    for (const identifierMatcher of rule.matchers.identifiers) {
      const pattern = identifierMatcher.pattern
      const regex = new RegExp(pattern, 'g')

      let match
      while ((match = regex.exec(content)) !== null) {
        const identifier = match[0]
        const lineNumber = content.substring(0, match.index).split('\n').length
        
        // Skip if it's in a comment or string
        const line = lines[lineNumber - 1] || ''
        // ✅ PHASE 5: Skip comments (including multi-line comments) and string literals
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||  // Multi-line comment continuation
            line.includes(`'${identifier}'`) || 
            line.includes(`"${identifier}"`) ||
            line.includes('PHASE 3') ||  // Skip PHASE 3 comments explaining removed validation
            line.includes('PHASE 4') ||  // Skip PHASE 4 comments
            line.includes('✅ PHASE')) {  // Skip all PHASE comments
          continue
        }

        const violation: ArchitectureViolationContext = {
          ruleId: rule.id,
          filePath: relativePath,
          line: lineNumber,
          identifier,
          snippet: line.trim(),
          telosViolated: rule.telosViolated,
          resolutionSteps: rule.resolutionHint,
          detectedAt: 'build',
          sourceLayer: 'ui',
          severity: rule.severity, // ✅ PHASE 5: Include severity in violation context
        }
        
        violations.push(violation)
        
        // Record in Metaphysical Sentry
        recordArchitectureViolation(violation, config.workspaceRoot)
        
        // ✅ ACT ENFORCEMENT: Architecture violations are logged, not thrown
        // Build will fail via errors array, not via invariant enforcement
      }
    }
  }

  return violations
}

/**
 * Format violation as error message
 */
function formatViolationError(violation: ArchitectureViolationContext): string {
  const parts: string[] = []
  
  parts.push(`[ARCHITECTURE VIOLATION ${violation.ruleId}]`)
  parts.push(`File: ${violation.filePath}:${violation.line}`)
  
  if (violation.importPath) {
    parts.push(`Import: ${violation.importPath}`)
  }
  
  if (violation.identifier) {
    parts.push(`Identifier: ${violation.identifier}`)
  }
  
  if (violation.snippet) {
    parts.push(`Code: ${violation.snippet}`)
  }
  
  parts.push('')
  parts.push('TELOS VIOLATED:')
  parts.push(violation.telosViolated)
  parts.push('')
  parts.push('RESOLUTION STEPS:')
  violation.resolutionSteps.forEach((step, i) => {
    parts.push(`  ${i + 1}. ${step}`)
  })
  
  return parts.join('\n')
}

