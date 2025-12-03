/**
 * ✅ ENTELECHIA: Form Manifest Generator
 * 
 * Generates FormActManifest from YAML files and metadata.
 */

import { readdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { FormYamlSchema } from '../../forms/yaml-schema.js'
import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'
import type { FormActManifest } from './types.js'

/**
 * Generate form manifest from YAML file
 */
export function generateFormManifest(
  yamlPath: string,
  contract: ContractDefinition,
  formsOutputDir: string
): FormActManifest | null {
  try {
    const yamlContent = readFileSync(yamlPath, 'utf-8')
    const yamlData = parse(yamlContent)
    const formYaml = FormYamlSchema.parse(yamlData)
    
    // Extract variant from filename or YAML
    const filename = basename(yamlPath, '.form.yaml')
    const variant = formYaml.form.variant
    
    // Build descriptor path
    const descriptorPath = join(formsOutputDir, `${contract.domain}.${variant}.form.ts`)
    
    // Extract sections and fields
    const sections: string[] = []
    const fields: string[] = []
    
    for (const section of formYaml.form.sections || []) {
      sections.push(section.id)
      for (const fieldName of section.fields || []) {
        if (!fields.includes(fieldName)) {
          fields.push(fieldName)
        }
      }
    }
    
    return {
      contract: contract.name,
      variant,
      yamlPath,
      descriptorPath,
      sections,
      fields,
    }
  } catch (error: any) {
    // Invalid YAML or schema mismatch
    return null
  }
}

/**
 * Generate all form manifests for a contract
 */
export function generateFormManifestsForContract(
  contract: ContractDefinition,
  yamlDir: string,
  formsOutputDir: string
): FormActManifest[] {
  const manifests: FormActManifest[] = []
  
  if (!contract.formSchemas || contract.formSchemas.length === 0) {
    return manifests
  }
  
  // Find YAML files for this contract
  if (!existsSync(yamlDir)) {
    return manifests
  }
  
  const yamlFiles = readdirSync(yamlDir).filter(f => 
    f.startsWith(`${contract.name}.`) && f.endsWith('.form.yaml')
  )
  
  for (const yamlFile of yamlFiles) {
    const yamlPath = join(yamlDir, yamlFile)
    const manifest = generateFormManifest(yamlPath, contract, formsOutputDir)
    if (manifest) {
      manifests.push(manifest)
    }
  }
  
  return manifests
}


