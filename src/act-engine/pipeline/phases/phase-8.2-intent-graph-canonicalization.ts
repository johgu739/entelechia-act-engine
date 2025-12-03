/**
 * ✅ ENTELECHIA: Phase 8.2 — IntentGraph Canonicalization
 * 
 * Validates and canonicalizes IntentGraph YAML files:
 * - Reads intent-graph/*.yaml from entelechia-form/intent-graph/
 * - Validates all intents, actions, invariants, and metrics against their registries
 * - Generates canonical IntentGraph descriptors
 * 
 * PRINCIPLE: Complete teleological graph must be validated before code generation.
 * This phase runs AFTER Phase 8.1 (Instrumentation Canonicalization) and BEFORE Phase 7 (Code Generation).
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import {
  loadIntentGraphFile,
  validateIntentGraph,
  canonicalizeIntentGraph,
  type ValidationContext,
} from '../../../intent-graph/intent-graph-canonicalizer.js'
import type { CanonicalIntentGraphDescriptor } from '../../../intent-graph/intent-graph-types.js'
import { registry } from '@entelechia/invariant-engine'

/**
 * Execute Phase 8.2: IntentGraph Canonicalization
 */
export async function runPhase8_2IntentGraphCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & {
  intentGraphDescriptors?: Map<string, CanonicalIntentGraphDescriptor>
}> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  const intentGraphDescriptors = new Map<string, CanonicalIntentGraphDescriptor>()
  
  // Get workspace root
  const workspaceRoot = config.workspaceRoot || process.cwd()
  const intentGraphDir = join(workspaceRoot, 'entelechia-form', 'intent-graph')
  
  // Load validation context (ActionRegistry, IntentRegistry, InvariantRegistry, MetricRegistry)
  const validationContext = await loadValidationContext(workspaceRoot)
  
  // Load IntentGraph YAML files
  if (!existsSync(intentGraphDir)) {
    warnings.push(`IntentGraph directory does not exist: ${intentGraphDir} (skipping)`)
    return {
      phase: 8.2,
      name: 'IntentGraph Canonicalization',
      success: true,
      errors: [],
      warnings,
      duration: Date.now() - startTime,
      intentGraphDescriptors,
    }
  }
  
  const intentGraphFiles = readdirSync(intentGraphDir).filter(f => f.endsWith('.yaml'))
  
  if (intentGraphFiles.length === 0) {
    warnings.push(`No IntentGraph YAML files found in ${intentGraphDir}`)
    return {
      phase: 8.2,
      name: 'IntentGraph Canonicalization',
      success: true,
      errors: [],
      warnings,
      duration: Date.now() - startTime,
      intentGraphDescriptors,
    }
  }
  
  for (const file of intentGraphFiles) {
    const filePath = join(intentGraphDir, file)
    
    try {
      // Load and parse IntentGraph YAML
      const intentGraphFile = loadIntentGraphFile(filePath)
      const graph = intentGraphFile.intentGraph
      
      // Validate against external registries
      const validationResult = validateIntentGraph(graph, validationContext)
      
      // Collect errors and warnings
      errors.push(...validationResult.errors)
      warnings.push(...validationResult.warnings)
      
      // Canonicalize if valid
      if (validationResult.valid) {
        // ✅ ONTOLOGICAL: Calculate output directory for path resolution
        // Generated files go to: entelechia-ui/src/generated/intent-graph/
        const intentGraphOutputDir = join(workspaceRoot, 'entelechia-ui', 'src', 'generated', 'intent-graph')
        const canonicalDescriptor = canonicalizeIntentGraph(graph, validationContext, intentGraphOutputDir)
        const key = file.replace('.yaml', '')
        intentGraphDescriptors.set(key, canonicalDescriptor)
      }
    } catch (error: any) {
      errors.push(`Failed to parse or validate IntentGraph file "${file}": ${error.message}`)
    }
  }
  
  const duration = Date.now() - startTime
  
  return {
    phase: 8.2,
    name: 'IntentGraph Canonicalization',
    success: errors.length === 0,
    errors,
    warnings,
    duration,
    intentGraphDescriptors,
  }
}

/**
 * Load validation context from external registries
 */
async function loadValidationContext(workspaceRoot: string): Promise<ValidationContext> {
  const intentIds = new Set<string>()
  const actionIds = new Set<string>()
  const invariantIds = new Set<string>()
  const metricIds = new Set<string>()
  
  // Load IntentRegistry (legacy - now replaced by generated intent-graph.generated.ts)
  // ✅ ONTOLOGICAL: IntentRegistry is now generated, not manually maintained
  // Intent IDs are validated from IntentGraph YAML itself, not from legacy registry
  try {
    const intentRegistryPath = join(
      workspaceRoot,
      'entelechia-ui',
      'src',
      'intent',
      'intent-registry.ts'
    )
    
    // ✅ ONTOLOGICAL: Check if file exists before importing
    if (existsSync(intentRegistryPath)) {
      const intentRegistryModule = await import(`file://${intentRegistryPath}`)
      const intentRegistry = intentRegistryModule.INTENT_REGISTRY || {}
      
      for (const key of Object.keys(intentRegistry)) {
        intentIds.add(key)
      }
    } else {
      // ✅ ONTOLOGICAL: IntentRegistry is deprecated - IntentGraph YAML is source of truth
      // Intent IDs are validated from IntentGraph YAML itself
    }
  } catch (error: any) {
    // ✅ ONTOLOGICAL: IntentRegistry is optional - IntentGraph YAML is source of truth
    // This is expected if IntentRegistry has been replaced by generated code
  }
  
  // Load ActionRegistry
  try {
    const actionRegistryPath = join(
      workspaceRoot,
      'entelechia-core',
      'src',
      'acl',
      'action-registry.ts'
    )
    const actionRegistryModule = await import(`file://${actionRegistryPath}`)
    const actionRegistry = actionRegistryModule.ActionRegistry || {}
    
    for (const key of Object.keys(actionRegistry)) {
      actionIds.add(key)
    }
  } catch (error: any) {
    console.warn('[Phase 8.2] Could not load ActionRegistry:', error)
  }
  
  // Load InvariantRegistry (from invariant-engine)
  try {
    // Registry is already imported, get all invariant IDs
    const allInvariantIds = registry.getAllInvariantIds()
    for (const invariantId of allInvariantIds) {
      invariantIds.add(invariantId)
    }
  } catch (error: any) {
    console.warn('[Phase 8.2] Could not load InvariantRegistry:', error)
  }
  
  // Load MetricRegistry (from telemetry/metrics.yaml)
  try {
    const metricsYamlPath = join(
      workspaceRoot,
      'entelechia-ui',
      'forms',
      'telemetry',
      'metrics.yaml'
    )
    
    if (existsSync(metricsYamlPath)) {
      const content = readFileSync(metricsYamlPath, 'utf-8')
      const parsed = parse(content) as any
      
      // Extract metric IDs from telemetry.metrics.definitions
      if (parsed?.telemetry?.metrics?.definitions) {
        for (const metric of parsed.telemetry.metrics.definitions) {
          if (metric.id) {
            metricIds.add(metric.id)
          }
        }
      }
    }
  } catch (error: any) {
    console.warn('[Phase 8.2] Could not load MetricRegistry:', error)
  }
  
  return {
    intentIds,
    actionIds,
    invariantIds,
    metricIds,
  }
}

