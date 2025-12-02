/**
 * ✅ ENTELECHIA: Form Completeness Validator
 * 
 * Validates FORM completeness and coherence.
 * 
 * Migrated from: scripts/check-form-completeness.ts
 */

import { readdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { FormYamlSchema } from '../../forms/yaml-schema.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import { registry } from '@entelechia/invariant-engine'

export interface CompletenessCheckResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Check projectionCapabilities completeness
 */
export function checkProjectionCapabilities(
  contracts: ContractDefinition[]
): CompletenessCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  for (const contract of contracts) {
    if (!contract.projectionCapabilities) {
      if (contract.formSchemas && contract.formSchemas.length > 0) {
        errors.push(`Contract "${contract.name}" has formSchemas but missing projectionCapabilities`)
      }
      continue
    }
    
    // Check that common field types have capabilities
    if (contract.formSchemas) {
      for (const formSchema of contract.formSchemas) {
        for (const section of formSchema.defaultSections || []) {
          const sectionFields = Array.isArray(section) ? section : (section as any).fields || []
          for (const fieldName of sectionFields) {
            const fieldDef = contract.baseSchema.fields.find(f => f.name === fieldName)
            if (fieldDef && !contract.projectionCapabilities[fieldDef.type]) {
              errors.push(
                `Field type "${fieldDef.type}" in "${contract.name}.${formSchema.id}" is missing projectionCapabilities`
              )
            }
          }
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check YAML coverage completeness
 */
export function checkYamlCoverage(
  contracts: ContractDefinition[],
  yamlDir: string
): CompletenessCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!existsSync(yamlDir)) {
    warnings.push(`YAML directory does not exist: ${yamlDir}`)
    return { passed: true, errors, warnings }
  }
  
  for (const contract of contracts) {
    if (contract.formSchemas) {
      for (const formSchema of contract.formSchemas) {
        const yamlFileName = `${contract.name}.${formSchema.id}.form.yaml`
        const yamlFilePath = join(yamlDir, yamlFileName)
        if (!existsSync(yamlFilePath)) {
          errors.push(`Missing YAML file for ${contract.name}.${formSchema.id}: ${yamlFileName}`)
        }
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check for orphan YAML files
 */
export function checkOrphanYaml(
  contracts: ContractDefinition[],
  yamlDir: string
): CompletenessCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!existsSync(yamlDir)) {
    return { passed: true, errors, warnings }
  }
  
  const yamlFiles = readdirSync(yamlDir).filter(f => f.endsWith('.form.yaml'))
  const contractMap = new Map(contracts.map(c => [c.name, c]))
  
  for (const yamlFile of yamlFiles) {
    try {
      const content = readFileSync(join(yamlDir, yamlFile), 'utf-8')
      const parsedYaml = FormYamlSchema.parse(parse(content))
      const contractName = parsedYaml.form.contract
      const variantId = parsedYaml.form.variant
      
      const contractMetadata = contractMap.get(contractName)
      if (!contractMetadata) {
        errors.push(`Orphan YAML file "${yamlFile}": Contract "${contractName}" not found in metadata`)
        continue
      }
      
      if (!contractMetadata.formSchemas || !contractMetadata.formSchemas.some(fs => fs.id === variantId)) {
        errors.push(
          `Orphan YAML file "${yamlFile}": Variant "${variantId}" not defined in formSchemas for contract "${contractName}"`
        )
      }
    } catch (e: any) {
      errors.push(`Failed to parse or validate YAML file "${yamlFile}": ${e.message}`)
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check invariant reference completeness
 */
export async function checkInvariantReferences(): Promise<CompletenessCheckResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const allIds = registry.getAllInvariantIds()
    if (allIds.length === 0) {
      errors.push('Invariant engine registry is empty. No invariants registered.')
    } else {
      // Check if critical invariants exist
      const criticalInvariants = [
        'SYSTEM_STATE.F50', // Total Ontological UI Coherence
        'DOMAIN_LOGIC.F2', // System State View Singular
        'UI_SCROLL.F82', // Single Scroll Container
      ]
      
      for (const id of criticalInvariants) {
        if (!registry.get(id)) {
          warnings.push(`Critical invariant ${id} not found in registry`)
        }
      }
    }
  } catch (e: any) {
    errors.push(`Failed to load invariant engine: ${e.message}`)
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check descriptor generation purity
 */
export function checkDescriptorPurity(
  formsOutputDir: string
): CompletenessCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!existsSync(formsOutputDir)) {
    warnings.push(`Generated forms directory does not exist: ${formsOutputDir}`)
    return { passed: true, errors, warnings }
  }
  
  const generatedFiles = readdirSync(formsOutputDir).filter(f => f.endsWith('.ts'))
  for (const file of generatedFiles) {
    const filePath = join(formsOutputDir, file)
    const content = readFileSync(filePath, 'utf-8')
    if (
      !content.includes('Generated from backend FORM - DO NOT EDIT MANUALLY') &&
      !content.includes('Generated from YAML + metadata - DO NOT EDIT MANUALLY')
    ) {
      errors.push(`Generated file "${file}" is missing generation banner`)
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Run all form completeness checks
 */
export async function validateFormCompleteness(
  contracts: ContractDefinition[],
  yamlDir: string,
  formsOutputDir: string
): Promise<CompletenessCheckResult> {
  const allErrors: string[] = []
  const allWarnings: string[] = []
  
  // Check 1: ProjectionCapabilities
  const check1 = checkProjectionCapabilities(contracts)
  allErrors.push(...check1.errors)
  allWarnings.push(...check1.warnings)
  
  // Check 2: YAML Coverage
  const check2 = checkYamlCoverage(contracts, yamlDir)
  allErrors.push(...check2.errors)
  allWarnings.push(...check2.warnings)
  
  // Check 3: Orphan YAML
  const check3 = checkOrphanYaml(contracts, yamlDir)
  allErrors.push(...check3.errors)
  allWarnings.push(...check3.warnings)
  
  // Check 4: Invariant References
  const check4 = await checkInvariantReferences()
  allErrors.push(...check4.errors)
  allWarnings.push(...check4.warnings)
  
  // Check 5: Descriptor Purity
  const check5 = checkDescriptorPurity(formsOutputDir)
  allErrors.push(...check5.errors)
  allWarnings.push(...check5.warnings)
  
  return {
    passed: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

