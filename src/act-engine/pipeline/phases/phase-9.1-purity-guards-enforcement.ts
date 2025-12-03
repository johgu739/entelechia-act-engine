/**
 * ✅ ENTELECHIA: Phase 9.1 — Purity Guards Enforcement
 * 
 * Validates entire codebase against all six Purity Guards.
 * 
 * PRINCIPLE: Fail fast - violations detected at build time
 * This phase runs AFTER Phase 9.0 (Purity Guards Canonicalization) and BEFORE Phase 7 (Codegen).
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import type { CanonicalPurityGuardDescriptor } from '../../../purity-guards/purity-guards-canonicalizer.js'

/**
 * Purity violation context
 */
export interface PurityViolationContext {
  guardType: string
  invariantId: string
  violationPattern: string
  filePath: string
  line: number
  snippet?: string
  telosViolated: string
  resolutionSteps: string[]
}

/**
 * Execute Phase 9.1: Purity Guards Enforcement
 */
export async function runPhase9_1PurityGuardsEnforcement(
  manifest: ActManifest,
  config: ActEngineConfig,
  purityGuards: Map<string, CanonicalPurityGuardDescriptor>
): Promise<PhaseResult & {
  violations?: PurityViolationContext[]
}> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const violations: PurityViolationContext[] = []

  try {
    if (!purityGuards || purityGuards.size === 0) {
      return {
        phase: 9.1,
        name: 'Purity Guards Enforcement',
        success: true,
        errors: [],
        warnings: ['No purity guards loaded - skipping enforcement'],
        duration: Date.now() - startTime,
      }
    }

    // Scan UI source code
    const uiSourceDir = join(config.workspaceRoot, 'entelechia-ui', 'src')
    const backendSourceDir = join(config.workspaceRoot, 'entelechia-core', 'src')
    
    const sourceFiles: string[] = []
    if (existsSync(uiSourceDir)) {
      sourceFiles.push(...getAllSourceFiles(uiSourceDir, ['.ts', '.tsx']))
    }
    if (existsSync(backendSourceDir)) {
      sourceFiles.push(...getAllSourceFiles(backendSourceDir, ['.ts']))
    }

    // Check each file against all purity guards
    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8')
      const relativePath = relative(config.workspaceRoot, filePath)

      // Skip generated files and node_modules
      if (
        relativePath.includes('generated') ||
        relativePath.includes('node_modules') ||
        relativePath.includes('__tests__') ||
        relativePath.includes('.test.')
      ) {
        continue
      }

      // Check against each guard
      for (const [guardType, guard] of purityGuards.entries()) {
        for (const invariant of guard.invariants) {
          // Only check build-time enforcement
          if (invariant.enforcement !== 'build' && invariant.enforcement !== 'both') {
            continue
          }

          for (const violation of invariant.violations) {
            const fileViolations = checkFileAgainstViolation(
              filePath,
              content,
              guardType,
              invariant.id,
              violation,
              relativePath
            )
            violations.push(...fileViolations)
          }
        }
      }
    }

    // Convert violations to errors or warnings based on severity
    // Find guard for each violation to check severity
    const guardMap = new Map(Array.from(purityGuards.values()).map(g => [g.guardType, g]))
    
    for (const violation of violations) {
      const errorMessage = formatViolationError(violation)
      
      // Find invariant in guard to check severity
      let severity: 'error' | 'warn' = 'error' // Default to error if not found
      for (const guard of purityGuards.values()) {
        const invariant = guard.invariants.find(inv => inv.id === violation.invariantId)
        if (invariant) {
          severity = invariant.severity
          break
        }
      }
      
      if (severity === 'error') {
        errors.push(errorMessage)
      } else {
        // severity === 'warn'
        warnings.push(errorMessage)
      }
    }

    // ✅ ONTOLOGICAL: Fail pipeline only on error violations (warnings don't block)
    // This matches Architecture Guard behavior - warnings are reported but don't block
    const success = errors.length === 0
    const duration = Date.now() - startTime

    return {
      phase: 9.1,
      name: 'Purity Guards Enforcement',
      success,
      errors,
      warnings,
      duration,
      violations: success ? undefined : violations,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    return {
      phase: 9.1,
      name: 'Purity Guards Enforcement',
      success: false,
      errors: [`Purity guards enforcement failed: ${error.message}`],
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
 * Check file against violation pattern
 */
function checkFileAgainstViolation(
  filePath: string,
  content: string,
  guardType: string,
  invariantId: string,
  violation: any,
  relativePath: string
): PurityViolationContext[] {
  const violations: PurityViolationContext[] = []
  const lines = content.split('\n')

  // Check import matchers
  if (violation.matcher.imports) {
    for (const importMatcher of violation.matcher.imports) {
      const fromPattern = importMatcher.from.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      const importRegex = new RegExp(`import\\s+.*from\\s+['"](${fromPattern})['"]`, 'g')

      // Check if file matches "in" or "notIn" patterns
      if (importMatcher.in && !new RegExp(importMatcher.in.replace(/\*\*/g, '.*')).test(relativePath)) {
        continue
      }
      if (importMatcher.notIn && new RegExp(importMatcher.notIn.replace(/\*\*/g, '.*')).test(relativePath)) {
        continue
      }

      let match
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1]
        const lineNumber = content.substring(0, match.index).split('\n').length
        
        violations.push({
          guardType,
          invariantId,
          violationPattern: violation.pattern,
          filePath: relativePath,
          line: lineNumber,
          snippet: lines[lineNumber - 1]?.trim(),
          telosViolated: violation.telosViolated,
          resolutionSteps: violation.resolutionSteps,
        })
      }
    }
  }

  // Check identifier matchers
  if (violation.matcher.identifiers) {
    for (const identifierMatcher of violation.matcher.identifiers) {
      const pattern = identifierMatcher.pattern
      const regex = new RegExp(pattern, 'g')

      // Check if file matches "in" or "notIn" patterns
      if (identifierMatcher.in && !new RegExp(identifierMatcher.in.replace(/\*\*/g, '.*')).test(relativePath)) {
        continue
      }
      if (identifierMatcher.notIn && new RegExp(identifierMatcher.notIn.replace(/\*\*/g, '.*')).test(relativePath)) {
        continue
      }

      let match
      while ((match = regex.exec(content)) !== null) {
        const identifier = match[0]
        const lineNumber = content.substring(0, match.index).split('\n').length
        
        // Skip if it's in a comment or string
        const line = lines[lineNumber - 1] || ''
        if (line.trim().startsWith('//') || line.includes(`'${identifier}'`) || line.includes(`"${identifier}"`)) {
          continue
        }

        violations.push({
          guardType,
          invariantId,
          violationPattern: violation.pattern,
          filePath: relativePath,
          line: lineNumber,
          snippet: line.trim(),
          telosViolated: violation.telosViolated,
          resolutionSteps: violation.resolutionSteps,
        })
      }
    }
  }

  return violations
}

/**
 * Format violation as error message
 */
function formatViolationError(violation: PurityViolationContext): string {
  const parts: string[] = []
  
  parts.push(`[PURITY VIOLATION ${violation.guardType.toUpperCase()}.${violation.invariantId}]`)
  parts.push(`Pattern: ${violation.violationPattern}`)
  parts.push(`File: ${violation.filePath}:${violation.line}`)
  
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

