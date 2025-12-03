/**
 * ✅ ENTELECHIA: Phase 7.5 — UI Functional Canonicalization
 * 
 * Generates functional descriptors from YAML FORM + Contract Metadata + ACL + Invariants.
 * 
 * PRINCIPLE: UI elements declare their telos (purpose) and bindings declaratively.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { FormYamlSchema } from '../../../forms/yaml-schema.js'
import { canonicalizeFunctionalForm } from '../../../forms/functional-canonicalizer.js'
import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'
import type { CanonicalFunctionalFormDescriptor } from '../../../forms/functional-types.js'

/**
 * Execute Phase 7.5: UI Functional Canonicalization
 */
export async function runPhase7_5FunctionalCanonicalization(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & { functionalDescriptors?: Map<string, CanonicalFunctionalFormDescriptor> }> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const functionalDescriptors = new Map<string, CanonicalFunctionalFormDescriptor>()
  
  try {
    if (!existsSync(config.yamlDir)) {
      return {
        phase: 7.5,
        name: 'UI Functional Canonicalization',
        success: true,
        errors: [],
        warnings: [`YAML directory does not exist: ${config.yamlDir} (skipping functional canonicalization)`],
        duration: Date.now() - startTime,
        functionalDescriptors: new Map(),
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
          warnings.push(`YAML file "${yamlFile}": Contract "${formYaml.form.contract}" not found (skipping functional canonicalization)`)
          continue
        }
        
        // Only canonicalize if functional bindings exist
        if (!formYaml.form.functional && !formYaml.form.sections.some(s => s.functional)) {
          // No functional bindings, skip
          continue
        }
        
        // Canonicalize functional form
        const functionalDescriptor = await canonicalizeFunctionalForm(
          formYaml,
          contract,
          config.workspaceRoot,
          manifest.acl
        )
        
        // Store functional descriptor
        const key = `${contract.name}.${formYaml.form.variant}`
        functionalDescriptors.set(key, functionalDescriptor)
        
      } catch (error: any) {
        errors.push(`Functional canonicalization failed for "${yamlFile}": ${error.message}`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 7.5,
      name: 'UI Functional Canonicalization',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
      functionalDescriptors,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 7.5,
      name: 'UI Functional Canonicalization',
      success: false,
      errors: [`Functional canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
      functionalDescriptors: new Map(),
    }
  }
}

