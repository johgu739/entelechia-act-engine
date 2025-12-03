/**
 * ✅ ENTELECHIA: Phase 5 — YAML Validation
 * 
 * Validates all YAML form files.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { FormYamlSchema } from '../../../forms/yaml-schema.js'
import { validateFormYaml } from '../../../forms/validator.js'
import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'

/**
 * Execute Phase 5: YAML Validation
 */
export async function runPhase5YamlValidation(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    if (!existsSync(config.yamlDir)) {
      return {
        phase: 5,
        name: 'YAML Validation',
        success: true, // Not an error if YAML dir doesn't exist (no forms defined)
        errors: [],
        warnings: [`YAML directory does not exist: ${config.yamlDir} (skipping YAML validation)`],
        duration: Date.now() - startTime,
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
        
        // Schema validation
        const formYaml = FormYamlSchema.parse(yamlData)
        
        // Find corresponding contract
        const contract = contractMap.get(formYaml.form.contract)
        if (!contract) {
          errors.push(`YAML file "${yamlFile}": Contract "${formYaml.form.contract}" not found`)
          continue
        }
        
        // Semantic validation
        validateFormYaml(formYaml, contract)
        
      } catch (error: any) {
        errors.push(`YAML file "${yamlFile}": ${error.message}`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 5,
      name: 'YAML Validation',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 5,
      name: 'YAML Validation',
      success: false,
      errors: [`YAML validation failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

