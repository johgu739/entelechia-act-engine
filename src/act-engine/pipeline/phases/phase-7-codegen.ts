/**
 * ✅ ENTELECHIA: Phase 7 — Code Generation
 * 
 * Generates all STATE artifacts using unified generators.
 */

import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'
import type { CanonicalFormDescriptor } from '../../../forms/canonicalizer.js'
import { DeterministicWriter } from '../../writers/deterministic-writer.js'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Import generators from act-engine/generators/
import { generateSchemaCode } from '../../generators/schema-code-generator.js'
import { generateMigrationCode } from '../../generators/migration-code-generator.js'
import { generateServiceCode } from '../../generators/service-code-generator.js'
import { generateRouteCode } from '../../generators/route-code-generator.js'
import { generateTestCode } from '../../generators/test-code-generator.js'
import { generateFormCode } from '../../generators/form-code-generator.js'
import { generateFormTypes } from '../../generators/form-types-generator.js'
import { generateInvariantMapping } from '../../generators/invariant-mapping-generator.js'
import { generateFunctionalFormDescriptorCode } from '../../generators/functional-code-generator.js'
import type { CanonicalFunctionalFormDescriptor } from '../../../forms/functional-types.js'
import { generateCommandsCode, generateHotkeysCode } from '../../generators/command-code-generator.js'
import {
  generateTelemetryCode,
  generateDevToolsCode,
  generateUXFidelityCode,
} from '../../generators/instrumentation-code-generator.js'
import { generateIntentGraphCode } from '../../generators/intent-graph-code-generator.js'
import { generatePurityGuardsCode } from '../../generators/purity-guards-code-generator.js'
import type {
  CanonicalCommandDescriptor,
  CanonicalHotkeyDescriptor,
} from '../../../commands/command-canonicalizer.js'
import type { CanonicalPurityGuardDescriptor } from '../../../purity-guards/purity-guards-canonicalizer.js'
import type {
  CanonicalTelemetryDescriptor,
  CanonicalDevToolsDescriptor,
  CanonicalUXFidelityDescriptor,
} from '../../../instrumentation/index.js'
import type { CanonicalIntentGraphDescriptor } from '../../../intent-graph/intent-graph-types.js'

/**
 * Execute Phase 7: Code Generation
 */
export async function runPhase7Codegen(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig,
  descriptors?: Map<string, CanonicalFormDescriptor>,
  functionalDescriptors?: Map<string, CanonicalFunctionalFormDescriptor>,
  commandDescriptors?: Map<string, CanonicalCommandDescriptor>,
  hotkeyDescriptors?: Map<string, CanonicalHotkeyDescriptor>,
  telemetryDescriptors?: Map<string, CanonicalTelemetryDescriptor>,
  devtoolsDescriptors?: Map<string, CanonicalDevToolsDescriptor>,
  uxFidelityDescriptors?: Map<string, CanonicalUXFidelityDescriptor>,
  intentGraphDescriptors?: Map<string, CanonicalIntentGraphDescriptor>,
  purityGuards?: Map<string, CanonicalPurityGuardDescriptor>
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const artifacts: string[] = []
  const writer = new DeterministicWriter()
  
  try {
    // Sub-phase 7.1: Generate Form Types
    try {
      // Resolve canonicalizer path relative to backend root
      const backendCanonicalizerPath = join(config.metadataDir, '..', '..', 'forms', 'canonicalizer.ts')
      const formTypesOutputPath = join(config.formsOutputDir, 'types.ts')
      const formTypesResult = generateFormTypes(backendCanonicalizerPath, formTypesOutputPath)
      const writeResult = writer.writeFile(formTypesResult.path, formTypesResult.content, {
        banner: {
          source: 'canonicalizer.ts (descriptor interfaces)',
        },
        type: 'form-types',
        checkMode: config.checkMode,
        dryRun: config.dryRun,
      })
      
      if (!writeResult.success) {
        // In check mode, drift is expected - report as warning, not error
        if (config.checkMode && writeResult.error?.includes('Drift detected')) {
          warnings.push(`Form types would be regenerated: ${writeResult.error}`)
        } else {
          errors.push(`Form types generation failed: ${writeResult.error}`)
        }
      } else if (writeResult.written) {
        artifacts.push(formTypesResult.path)
      }
    } catch (error: any) {
      errors.push(`Form types generation failed: ${error.message}`)
    }
    
    // Sub-phase 7.2: Generate Invariant Mapping
    try {
      const invariantMappingOutputPath = join(config.invariantMappingOutputDir, 'invariant-mapping.ts')
      const invariantMappingResult = generateInvariantMapping(invariantMappingOutputPath)
      const writeResult = writer.writeFile(invariantMappingResult.path, invariantMappingResult.content, {
        banner: {
          source: 'invariant-engine',
        },
        type: 'invariant-mapping',
        checkMode: config.checkMode,
        dryRun: config.dryRun,
      })
      
      if (!writeResult.success) {
        // In check mode, drift is expected - report as warning, not error
        if (config.checkMode && writeResult.error?.includes('Drift detected')) {
          warnings.push(`Invariant mapping would be regenerated: ${writeResult.error}`)
        } else {
          errors.push(`Invariant mapping generation failed: ${writeResult.error}`)
        }
      } else if (writeResult.written) {
        artifacts.push(invariantMappingResult.path)
      }
    } catch (error: any) {
      // In check mode, generation errors might be expected (e.g., missing files)
      if (config.checkMode) {
        warnings.push(`Invariant mapping generation check failed: ${error.message}`)
      } else {
        errors.push(`Invariant mapping generation failed: ${error.message}`)
      }
    }
    
    // Sub-phase 7.3: Generate Shared Contracts
    for (const contract of contracts) {
      try {
        const schemaContent = generateSchemaCode(contract, [])
        const contractFileName = contract.name.toLowerCase()
        const schemaPath = join(config.sharedContractsDir, `${contractFileName}.contract.ts`)
        const writeResult = writer.writeFile(schemaPath, schemaContent, {
          banner: {
            source: 'metadata',
            contract: contract.name,
            domain: contract.domain,
          },
          type: 'schema',
          contract: contract.name,
          domain: contract.domain,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!writeResult.success) {
          // In check mode, drift is expected - report as warning, not error
          if (config.checkMode && writeResult.error?.includes('Drift detected')) {
            warnings.push(`Schema for ${contract.name} would be regenerated: ${writeResult.error}`)
          } else {
            errors.push(`Schema generation failed for ${contract.name}: ${writeResult.error}`)
          }
        } else if (writeResult.written) {
          artifacts.push(schemaPath)
        }
      } catch (error: any) {
        // In check mode, generation errors might be expected
        if (config.checkMode) {
          warnings.push(`Schema generation check failed for ${contract.name}: ${error.message}`)
        } else {
          errors.push(`Schema generation failed for ${contract.name}: ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.4: Generate Migrations
    for (const contract of contracts) {
      if (!contract.dbMapping) continue
      
      try {
        const migrationName = `${contract.domain}`
        const migrationContent = generateMigrationCode(contract, migrationName)
        const migrationPath = join(config.migrationsDir, `${contract.domain}.sql`)
        const writeResult = writer.writeFile(migrationPath, migrationContent, {
          banner: {
            source: 'metadata',
            contract: contract.name,
            domain: contract.domain,
          },
          type: 'migration',
          contract: contract.name,
          domain: contract.domain,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!writeResult.success) {
          // In check mode, drift is expected - report as warning, not error
          if (config.checkMode && writeResult.error?.includes('Drift detected')) {
            warnings.push(`Migration for ${contract.name} would be regenerated: ${writeResult.error}`)
          } else {
            errors.push(`Migration generation failed for ${contract.name}: ${writeResult.error}`)
          }
        } else if (writeResult.written) {
          artifacts.push(migrationPath)
        }
      } catch (error: any) {
        // In check mode, generation errors might be expected
        if (config.checkMode) {
          warnings.push(`Migration generation check failed for ${contract.name}: ${error.message}`)
        } else {
          errors.push(`Migration generation failed for ${contract.name}: ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.5: Generate Services
    for (const contract of contracts) {
      if (contract.transformations.length === 0) continue
      
      try {
        const serviceContent = generateServiceCode(contract)
        const servicePath = join(config.servicesDir, `${contract.domain}.service.ts`)
        const writeResult = writer.writeFile(servicePath, serviceContent, {
          banner: {
            source: 'metadata',
            contract: contract.name,
            domain: contract.domain,
          },
          type: 'service',
          contract: contract.name,
          domain: contract.domain,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!writeResult.success) {
          // In check mode, drift is expected - report as warning, not error
          if (config.checkMode && writeResult.error?.includes('Drift detected')) {
            warnings.push(`Service for ${contract.name} would be regenerated: ${writeResult.error}`)
          } else {
            errors.push(`Service generation failed for ${contract.name}: ${writeResult.error}`)
          }
        } else if (writeResult.written) {
          artifacts.push(servicePath)
        }
      } catch (error: any) {
        // In check mode, generation errors might be expected
        if (config.checkMode) {
          warnings.push(`Service generation check failed for ${contract.name}: ${error.message}`)
        } else {
          errors.push(`Service generation failed for ${contract.name}: ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.6: Generate Routes (if enabled)
    // Skipped for now - routes are generated separately
    
    // Sub-phase 7.7: Generate Tests
    for (const contract of contracts) {
      try {
        const testContent = generateTestCode(contract)
        const testPath = join(config.testsDir, `${contract.domain}.contract.test.ts`)
        const writeResult = writer.writeFile(testPath, testContent, {
          banner: {
            source: 'metadata',
            contract: contract.name,
            domain: contract.domain,
          },
          type: 'test',
          contract: contract.name,
          domain: contract.domain,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!writeResult.success) {
          // In check mode, drift is expected - report as warning, not error
          if (config.checkMode && writeResult.error?.includes('Drift detected')) {
            warnings.push(`Test for ${contract.name} would be regenerated: ${writeResult.error}`)
          } else {
            errors.push(`Test generation failed for ${contract.name}: ${writeResult.error}`)
          }
        } else if (writeResult.written) {
          artifacts.push(testPath)
        }
      } catch (error: any) {
        // In check mode, generation errors might be expected
        if (config.checkMode) {
          warnings.push(`Test generation check failed for ${contract.name}: ${error.message}`)
        } else {
          errors.push(`Test generation failed for ${contract.name}: ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.5.5: Generate Functional Form Descriptors
    if (functionalDescriptors && functionalDescriptors.size > 0) {
      const functionalOutputDir = join(config.formsOutputDir, 'functional')
      
      // Ensure output directory exists
      try {
        if (!existsSync(functionalOutputDir)) {
          mkdirSync(functionalOutputDir, { recursive: true })
        }
      } catch (error: any) {
        warnings.push(`Could not create functional output directory: ${error.message}`)
      }
      
      for (const [key, functionalDescriptor] of functionalDescriptors.entries()) {
        try {
          const [contractName, variant] = key.split('.')
          const contract = contracts.find(c => c.name === contractName)
          
          if (!contract) {
            warnings.push(`Functional descriptor "${key}": Contract "${contractName}" not found`)
            continue
          }
          
          const functionalCode = generateFunctionalFormDescriptorCode(functionalDescriptor, contract)
          const functionalPath = join(functionalOutputDir, `${contract.domain}.${variant}.functional.form.ts`)
          
          const writeResult = writer.writeFile(functionalPath, functionalCode, {
            banner: {
              source: 'YAML + Contract Metadata + ACL + Invariants',
              contract: contract.name,
              variant,
            },
            type: 'form',
            contract: contract.name,
            checkMode: config.checkMode,
            dryRun: config.dryRun,
          })
          
          if (!writeResult.success) {
            if (config.checkMode && writeResult.error?.includes('Drift detected')) {
              warnings.push(`Functional descriptor for ${key} would be regenerated: ${writeResult.error}`)
            } else {
              errors.push(`Functional descriptor generation failed for ${key}: ${writeResult.error}`)
            }
          } else if (writeResult.written) {
            artifacts.push(functionalPath)
          }
        } catch (error: any) {
          errors.push(`Functional descriptor generation failed for "${key}": ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.8: Generate Form Descriptors
    if (descriptors) {
      // Use existing form-code-generator which handles YAML reading
      try {
        const contractsWithForms = contracts.filter(c => c.formSchemas && c.formSchemas.length > 0)
        const allFormResults: Array<{ path: string; content: string }> = []
        
        for (const contract of contractsWithForms) {
          const formResults = await generateFormCode(
            contract,
            config.yamlDir,
            config.formsOutputDir
          )
          allFormResults.push(...formResults)
        }
        
        for (const formResult of allFormResults) {
          // Extract contract and variant from path
          const match = formResult.path.match(/(\w+)\.(\w+)\.form\.ts$/)
          if (match) {
            const [, domain, variant] = match
            const contract = contracts.find(c => c.domain === domain)
            
            if (contract) {
              const writeResult = writer.writeFile(formResult.path, formResult.content, {
                banner: {
                  source: 'YAML + metadata',
                  contract: contract.name,
                  variant,
                },
                type: 'form',
                contract: contract.name,
                checkMode: config.checkMode,
                dryRun: config.dryRun,
              })
              
              if (!writeResult.success) {
                // In check mode, drift is expected - report as warning, not error
                if (config.checkMode && writeResult.error?.includes('Drift detected')) {
                  warnings.push(`Form descriptor for ${formResult.path} would be regenerated: ${writeResult.error}`)
                } else {
                  errors.push(`Form descriptor generation failed for ${formResult.path}: ${writeResult.error}`)
                }
              } else if (writeResult.written) {
                artifacts.push(formResult.path)
              }
            }
          }
        }
      } catch (error: any) {
        // In check mode, generation errors might be expected
        if (config.checkMode) {
          warnings.push(`Form descriptor generation check failed: ${error.message}`)
        } else {
          errors.push(`Form descriptor generation failed: ${error.message}`)
        }
      }
    }
    
    // Sub-phase 7.8: Generate Commands and Hotkeys
    if (commandDescriptors && commandDescriptors.size > 0) {
      try {
        // Ensure commands output directory exists
        const commandsOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'commands')
        if (!existsSync(commandsOutputDir)) {
          mkdirSync(commandsOutputDir, { recursive: true })
        }
        
        // Generate commands.generated.ts
        const commandsOutputPath = join(commandsOutputDir, 'commands.generated.ts')
        const commandsCode = generateCommandsCode(commandDescriptors)
        const commandsWriteResult = writer.writeFile(commandsOutputPath, commandsCode, {
          banner: {
            source: 'commands.yaml',
          },
          type: 'commands',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!commandsWriteResult.success) {
          if (config.checkMode && commandsWriteResult.error?.includes('Drift detected')) {
            warnings.push(`Commands would be regenerated: ${commandsWriteResult.error}`)
          } else {
            errors.push(`Commands generation failed: ${commandsWriteResult.error}`)
          }
        } else if (commandsWriteResult.written) {
          artifacts.push(commandsOutputPath)
        }
      } catch (error: any) {
        errors.push(`Commands generation failed: ${error.message}`)
      }
    }
    
    if (hotkeyDescriptors && hotkeyDescriptors.size > 0) {
      try {
        // Ensure commands output directory exists
        const commandsOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'commands')
        if (!existsSync(commandsOutputDir)) {
          mkdirSync(commandsOutputDir, { recursive: true })
        }
        
        // Generate hotkeys.generated.ts
        const hotkeysOutputPath = join(commandsOutputDir, 'hotkeys.generated.ts')
        const hotkeysCode = generateHotkeysCode(hotkeyDescriptors)
        const hotkeysWriteResult = writer.writeFile(hotkeysOutputPath, hotkeysCode, {
          banner: {
            source: 'commands.yaml',
          },
          type: 'hotkeys',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!hotkeysWriteResult.success) {
          if (config.checkMode && hotkeysWriteResult.error?.includes('Drift detected')) {
            warnings.push(`Hotkeys would be regenerated: ${hotkeysWriteResult.error}`)
          } else {
            errors.push(`Hotkeys generation failed: ${hotkeysWriteResult.error}`)
          }
        } else if (hotkeysWriteResult.written) {
          artifacts.push(hotkeysOutputPath)
        }
      } catch (error: any) {
        errors.push(`Hotkeys generation failed: ${error.message}`)
      }
    }
    
    // Sub-phase 7.9: Generate Instrumentation Descriptors
    if (telemetryDescriptors && telemetryDescriptors.size > 0) {
      try {
        const instrumentationOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'instrumentation')
        if (!existsSync(instrumentationOutputDir)) {
          mkdirSync(instrumentationOutputDir, { recursive: true })
        }
        
        const telemetryOutputPath = join(instrumentationOutputDir, 'telemetry.generated.ts')
        const telemetryCode = generateTelemetryCode(telemetryDescriptors)
        const telemetryWriteResult = writer.writeFile(telemetryOutputPath, telemetryCode, {
          banner: {
            source: 'telemetry/*.yaml',
          },
          type: 'telemetry',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!telemetryWriteResult.success) {
          if (config.checkMode && telemetryWriteResult.error?.includes('Drift detected')) {
            warnings.push(`Telemetry would be regenerated: ${telemetryWriteResult.error}`)
          } else {
            errors.push(`Telemetry generation failed: ${telemetryWriteResult.error}`)
          }
        } else if (telemetryWriteResult.written) {
          artifacts.push(telemetryOutputPath)
        }
      } catch (error: any) {
        errors.push(`Telemetry generation failed: ${error.message}`)
      }
    }
    
    if (devtoolsDescriptors && devtoolsDescriptors.size > 0) {
      try {
        const instrumentationOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'instrumentation')
        if (!existsSync(instrumentationOutputDir)) {
          mkdirSync(instrumentationOutputDir, { recursive: true })
        }
        
        const devtoolsOutputPath = join(instrumentationOutputDir, 'devtools.generated.ts')
        const devtoolsCode = generateDevToolsCode(devtoolsDescriptors)
        const devtoolsWriteResult = writer.writeFile(devtoolsOutputPath, devtoolsCode, {
          banner: {
            source: 'devtools/*.yaml',
          },
          type: 'devtools',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!devtoolsWriteResult.success) {
          if (config.checkMode && devtoolsWriteResult.error?.includes('Drift detected')) {
            warnings.push(`DevTools would be regenerated: ${devtoolsWriteResult.error}`)
          } else {
            errors.push(`DevTools generation failed: ${devtoolsWriteResult.error}`)
          }
        } else if (devtoolsWriteResult.written) {
          artifacts.push(devtoolsOutputPath)
        }
      } catch (error: any) {
        errors.push(`DevTools generation failed: ${error.message}`)
      }
    }
    
    if (uxFidelityDescriptors && uxFidelityDescriptors.size > 0) {
      try {
        const instrumentationOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'instrumentation')
        if (!existsSync(instrumentationOutputDir)) {
          mkdirSync(instrumentationOutputDir, { recursive: true })
        }
        
        const uxFidelityOutputPath = join(instrumentationOutputDir, 'ux-fidelity.generated.ts')
        const uxFidelityCode = generateUXFidelityCode(uxFidelityDescriptors)
        const uxFidelityWriteResult = writer.writeFile(uxFidelityOutputPath, uxFidelityCode, {
          banner: {
            source: 'ux/*.yaml',
          },
          type: 'ux-fidelity',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!uxFidelityWriteResult.success) {
          if (config.checkMode && uxFidelityWriteResult.error?.includes('Drift detected')) {
            warnings.push(`UX Fidelity would be regenerated: ${uxFidelityWriteResult.error}`)
          } else {
            errors.push(`UX Fidelity generation failed: ${uxFidelityWriteResult.error}`)
          }
        } else if (uxFidelityWriteResult.written) {
          artifacts.push(uxFidelityOutputPath)
        }
      } catch (error: any) {
        errors.push(`UX Fidelity generation failed: ${error.message}`)
      }
    }
    
    // Sub-phase 7.10: Generate IntentGraph Descriptors
    if (intentGraphDescriptors && intentGraphDescriptors.size > 0) {
      try {
        const intentGraphOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'intent-graph')
        if (!existsSync(intentGraphOutputDir)) {
          mkdirSync(intentGraphOutputDir, { recursive: true })
        }
        
        const intentGraphOutputPath = join(intentGraphOutputDir, 'intent-graph.generated.ts')
        const intentGraphCode = generateIntentGraphCode(intentGraphDescriptors)
        const intentGraphWriteResult = writer.writeFile(intentGraphOutputPath, intentGraphCode, {
          banner: {
            source: 'intent-graph/*.yaml',
          },
          type: 'intent-graph',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!intentGraphWriteResult.success) {
          if (config.checkMode && intentGraphWriteResult.error?.includes('Drift detected')) {
            warnings.push(`IntentGraph would be regenerated: ${intentGraphWriteResult.error}`)
          } else {
            errors.push(`IntentGraph generation failed: ${intentGraphWriteResult.error}`)
          }
        } else if (intentGraphWriteResult.written) {
          artifacts.push(intentGraphOutputPath)
        }
        
        // ✅ ONTOLOGICAL: Generate mutation metadata STATE
        // This is ACT-layer generation - creates STATE that UI consumes
        const { generateMutationMetadataCode } = await import('../../generators/mutation-metadata-generator.js')
        const mutationMetadataCode = generateMutationMetadataCode(intentGraphDescriptors)
        const mutationMetadataOutputPath = join(intentGraphOutputDir, 'mutation-metadata.generated.ts')
        const mutationMetadataWriteResult = writer.writeFile(mutationMetadataOutputPath, mutationMetadataCode, {
          banner: {
            source: 'intent-graph/*.yaml',
          },
          type: 'mutation-metadata',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!mutationMetadataWriteResult.success) {
          if (config.checkMode && mutationMetadataWriteResult.error?.includes('Drift detected')) {
            warnings.push(`Mutation metadata would be regenerated: ${mutationMetadataWriteResult.error}`)
          } else {
            errors.push(`Mutation metadata generation failed: ${mutationMetadataWriteResult.error}`)
          }
        } else if (mutationMetadataWriteResult.written) {
          artifacts.push(mutationMetadataOutputPath)
        }
      } catch (error: any) {
        errors.push(`IntentGraph generation failed: ${error.message}`)
      }
    }
    
    // Generate Purity Guards code (Phase 9.2)
    if (purityGuards && purityGuards.size > 0) {
      try {
        const purityGuardsOutputDir = join(config.workspaceRoot, 'entelechia-ui', 'src', 'generated', 'purity-guards')
        if (!existsSync(purityGuardsOutputDir)) {
          mkdirSync(purityGuardsOutputDir, { recursive: true })
        }
        
        const purityGuardsCode = generatePurityGuardsCode(purityGuards)
        const purityGuardsOutputPath = join(purityGuardsOutputDir, 'purity-guards.generated.ts')
        const purityGuardsWriteResult = writer.writeFile(purityGuardsOutputPath, purityGuardsCode, {
          banner: {
            source: 'purity-guards/*.yaml',
          },
          type: 'purity-guards',
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })
        
        if (!purityGuardsWriteResult.success) {
          if (config.checkMode && purityGuardsWriteResult.error?.includes('Drift detected')) {
            warnings.push(`Purity guards would be regenerated: ${purityGuardsWriteResult.error}`)
          } else {
            errors.push(`Purity guards generation failed: ${purityGuardsWriteResult.error}`)
          }
        } else if (purityGuardsWriteResult.written) {
          artifacts.push(purityGuardsOutputPath)
        }
      } catch (error: any) {
        errors.push(`Purity guards generation failed: ${error.message}`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 7,
      name: 'Code Generation',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
      artifacts,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 7,
      name: 'Code Generation',
      success: false,
      errors: [`Code generation failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

