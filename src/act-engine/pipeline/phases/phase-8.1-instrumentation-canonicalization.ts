/**
 * ✅ ENTELECHIA: Phase 8.1 — Instrumentation Canonicalization
 * 
 * Validates and canonicalizes instrumentation YAML files:
 * - Reads telemetry/*.yaml from entelechia-ui/forms/telemetry/
 * - Reads devtools/*.yaml from entelechia-ui/forms/devtools/
 * - Reads ux/*.yaml from entelechia-ui/forms/ux/
 * - Validates all instrumentation against invariants
 * - Generates canonical instrumentation descriptors
 * 
 * PRINCIPLE: All instrumentation must be validated before code generation.
 * This phase runs AFTER Phase 7.8 (Command Canonicalization) and BEFORE Phase 7 (Code Generation).
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import { TelemetryYamlSchema } from '../../../instrumentation/telemetry-schema.js'
import { DevToolsYamlSchema } from '../../../instrumentation/devtools-schema.js'
import { UXFidelityYamlSchema } from '../../../instrumentation/ux-schema.js'
import {
  canonicalizeTelemetry,
  type CanonicalTelemetryDescriptor,
} from '../../../instrumentation/telemetry-canonicalizer.js'
import {
  canonicalizeDevTools,
  type CanonicalDevToolsDescriptor,
} from '../../../instrumentation/devtools-canonicalizer.js'
import {
  canonicalizeUXFidelity,
  type CanonicalUXFidelityDescriptor,
} from '../../../instrumentation/ux-canonicalizer.js'
import { registry } from '@entelechia/invariant-engine'

/**
 * Execute Phase 8.1: Instrumentation Canonicalization
 */
export async function runPhase8_1InstrumentationCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & {
  telemetryDescriptors?: Map<string, CanonicalTelemetryDescriptor>
  devtoolsDescriptors?: Map<string, CanonicalDevToolsDescriptor>
  uxFidelityDescriptors?: Map<string, CanonicalUXFidelityDescriptor>
}> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  const telemetryDescriptors = new Map<string, CanonicalTelemetryDescriptor>()
  const devtoolsDescriptors = new Map<string, CanonicalDevToolsDescriptor>()
  const uxFidelityDescriptors = new Map<string, CanonicalUXFidelityDescriptor>()
  
  // Get workspace root (where entelechia-ui/forms/ is)
  const workspaceRoot = config.workspaceRoot || process.cwd()
  const formsDir = join(workspaceRoot, 'entelechia-ui', 'forms')
  
  // 1. Canonicalize Telemetry YAML files
  const telemetryDir = join(formsDir, 'telemetry')
  if (existsSync(telemetryDir)) {
    const telemetryFiles = readdirSync(telemetryDir).filter(f => f.endsWith('.yaml'))
    
    for (const file of telemetryFiles) {
      const filePath = join(telemetryDir, file)
      
      try {
        const content = readFileSync(filePath, 'utf-8')
        const yamlData = parse(content)
        const telemetryYaml = TelemetryYamlSchema.parse(yamlData)
        
        // Validate invariants
        if (telemetryYaml.telemetry.invariants?.invariants) {
          for (const invariantId of telemetryYaml.telemetry.invariants.invariants) {
            const entry = registry.get(invariantId)
            if (!entry) {
              errors.push(`Telemetry file "${file}": Invariant ${invariantId} not found in registry`)
            }
          }
        }
        
        // Canonicalize
        const result = canonicalizeTelemetry(telemetryYaml)
        errors.push(...result.errors)
        warnings.push(...result.warnings)
        
        if (result.errors.length === 0) {
          const key = file.replace('.yaml', '')
          telemetryDescriptors.set(key, result.descriptor)
        }
      } catch (error: any) {
        errors.push(`Failed to parse or validate telemetry file "${file}": ${error.message}`)
      }
    }
  } else {
    warnings.push(`Telemetry directory does not exist: ${telemetryDir} (skipping)`)
  }
  
  // 2. Canonicalize DevTools YAML files
  const devtoolsDir = join(formsDir, 'devtools')
  if (existsSync(devtoolsDir)) {
    const devtoolsFiles = readdirSync(devtoolsDir).filter(f => f.endsWith('.yaml'))
    
    for (const file of devtoolsFiles) {
      const filePath = join(devtoolsDir, file)
      
      try {
        const content = readFileSync(filePath, 'utf-8')
        const yamlData = parse(content)
        const devtoolsYaml = DevToolsYamlSchema.parse(yamlData)
        
        // Validate invariants
        if (devtoolsYaml.devtools.invariants?.invariants) {
          for (const invariantId of devtoolsYaml.devtools.invariants.invariants) {
            const entry = registry.get(invariantId)
            if (!entry) {
              errors.push(`DevTools file "${file}": Invariant ${invariantId} not found in registry`)
            }
          }
        }
        
        // Canonicalize
        const result = canonicalizeDevTools(devtoolsYaml)
        errors.push(...result.errors)
        warnings.push(...result.warnings)
        
        if (result.errors.length === 0) {
          const key = file.replace('.yaml', '')
          devtoolsDescriptors.set(key, result.descriptor)
        }
      } catch (error: any) {
        errors.push(`Failed to parse or validate devtools file "${file}": ${error.message}`)
      }
    }
  } else {
    warnings.push(`DevTools directory does not exist: ${devtoolsDir} (skipping)`)
  }
  
  // 3. Canonicalize UX Fidelity YAML files
  const uxDir = join(formsDir, 'ux')
  if (existsSync(uxDir)) {
    const uxFiles = readdirSync(uxDir).filter(f => f.endsWith('.yaml'))
    
    for (const file of uxFiles) {
      const filePath = join(uxDir, file)
      
      try {
        const content = readFileSync(filePath, 'utf-8')
        const yamlData = parse(content)
        const uxFidelityYaml = UXFidelityYamlSchema.parse(yamlData)
        
        // Validate invariants
        if (uxFidelityYaml.ux.invariants?.invariants) {
          for (const invariantId of uxFidelityYaml.ux.invariants.invariants) {
            const entry = registry.get(invariantId)
            if (!entry) {
              errors.push(`UX fidelity file "${file}": Invariant ${invariantId} not found in registry`)
            }
          }
        }
        
        // Canonicalize
        const result = canonicalizeUXFidelity(uxFidelityYaml)
        errors.push(...result.errors)
        warnings.push(...result.warnings)
        
        if (result.errors.length === 0) {
          const key = file.replace('.yaml', '')
          uxFidelityDescriptors.set(key, result.descriptor)
        }
      } catch (error: any) {
        errors.push(`Failed to parse or validate UX fidelity file "${file}": ${error.message}`)
      }
    }
  } else {
    warnings.push(`UX directory does not exist: ${uxDir} (skipping)`)
  }
  
  const duration = Date.now() - startTime
  
  return {
    phase: 8.1,
    name: 'Instrumentation Canonicalization',
    success: errors.length === 0,
    errors,
    warnings,
    duration,
    telemetryDescriptors,
    devtoolsDescriptors,
    uxFidelityDescriptors,
  }
}

