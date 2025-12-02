/**
 * ✅ ENTELECHIA: Phase 6 — Descriptor Canonicalization
 * 
 * Generates canonical descriptors (in-memory) from YAML + metadata.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { FormYamlSchema } from '../../../forms/yaml-schema.js'
import { canonicalizeForm } from '../../../forms/canonicalizer.js'
import { validateFormInvariants } from '../../../forms/invariant-validator.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import type { CanonicalFormDescriptor } from '../../../forms/canonicalizer.js'

/**
 * Execute Phase 6: Descriptor Canonicalization
 */
export async function runPhase6Canonicalization(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & { descriptors?: Map<string, CanonicalFormDescriptor> }> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const descriptors = new Map<string, CanonicalFormDescriptor>()
  
  try {
    if (!existsSync(config.yamlDir)) {
      return {
        phase: 6,
        name: 'Descriptor Canonicalization',
        success: true, // Not an error if YAML dir doesn't exist (no forms defined)
        errors: [],
        warnings: [`YAML directory does not exist: ${config.yamlDir} (skipping canonicalization)`],
        duration: Date.now() - startTime,
        descriptors: new Map(), // Return empty map
      }
    }
    
    const yamlFiles = readdirSync(config.yamlDir).filter(f => f.endsWith('.form.yaml'))
    const contractMap = new Map(contracts.map(c => [c.name, c]))
    
    for (const yamlFile of yamlFiles) {
      const yamlPath = join(config.yamlDir, yamlFile)
      
      try {
        // Read and parse YAML
        const content = readFileSync(yamlPath, 'utf-8')
        const yamlData = parse(content)
        const formYaml = FormYamlSchema.parse(yamlData)
        
        // Find corresponding contract
        const contract = contractMap.get(formYaml.form.contract)
        if (!contract) {
          errors.push(`YAML file "${yamlFile}": Contract "${formYaml.form.contract}" not found`)
          continue
        }
        
        // Canonicalize form
        const descriptor = canonicalizeForm(formYaml, contract)
        
        // Validate invariants
        validateFormInvariants(descriptor, contract)
        
        // Store descriptor
        const key = `${contract.name}.${formYaml.form.variant}`
        descriptors.set(key, descriptor)
        
      } catch (error: any) {
        errors.push(`Canonicalization failed for "${yamlFile}": ${error.message}`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 6,
      name: 'Descriptor Canonicalization',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
      descriptors,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 6,
      name: 'Descriptor Canonicalization',
      success: false,
      errors: [`Canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

