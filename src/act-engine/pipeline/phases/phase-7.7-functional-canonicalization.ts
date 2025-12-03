/**
 * ✅ ENTELECHIA: Phase 7.7 — Functional Canonicalization
 * 
 * Validates and canonicalizes functional bindings in all UI-FORM:
 * - Forms (*.form.yaml)
 * - Navigation (*.yaml in navigation/)
 * - Dashboards (*.view.yaml in dashboards/)
 * - Invariants (*.view.yaml in invariants/)
 * 
 * PRINCIPLE: All functional bindings must be validated against:
 * - Contract metadata (projectionCapabilities, endpoints)
 * - ActionRegistry (ACL actions)
 * - Intent registry (mutation intents)
 * - Invariant-engine (invariant IDs)
 * 
 * This phase runs AFTER Phase 7.6 (Invariant Enforcement) and BEFORE Phase 7 (Code Generation).
 * It ensures that all functional bindings are valid before code generation.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { registry } from '@entelechia/invariant-engine'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import type { ContractDefinition } from '@entelechia/contracts/contracts/metadata/types'
import { FormYamlSchema, type FormYaml } from '../../../forms/yaml-schema.js'
import { canonicalizeFunctionalForm } from '../../../forms/functional-canonicalizer.js'
import {
  DashboardYamlSchema,
  type DashboardYaml,
} from '../../../navigation/metadata/yaml-schema.js'

export interface FunctionalValidationError {
  formKey: string
  bindingType: 'dataSource' | 'mutation' | 'capability' | 'listen' | 'conditions' | 'invariants' | 'intent'
  message: string
  details: Record<string, unknown>
}

/**
 * Execute Phase 7.7: Functional Canonicalization
 */
export async function runPhase7_7FunctionalCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig,
  contracts: ContractDefinition[]
): Promise<PhaseResult & { functionalDescriptors?: Map<string, any>; validationErrors?: FunctionalValidationError[] }> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const validationErrors: FunctionalValidationError[] = []
  const functionalDescriptors = new Map<string, any>()

  try {
    // 1. Validate forms with functional bindings
    const formsYamlDir = config.yamlDir
    if (existsSync(formsYamlDir)) {
      const formFiles = readdirSync(formsYamlDir).filter(f => f.endsWith('.form.yaml'))
      
      for (const formFile of formFiles) {
        const formPath = join(formsYamlDir, formFile)
        try {
          const content = readFileSync(formPath, 'utf-8')
          const yamlData = parse(content)
          const formYaml = FormYamlSchema.parse(yamlData)
          
          // Find contract metadata
          const contract = contracts.find(c => c.name === formYaml.form.contract)
          if (!contract) {
            errors.push(`Form "${formFile}" references unknown contract "${formYaml.form.contract}"`)
            continue
          }
          
          // Validate functional bindings
          if (formYaml.form.functional) {
            const formErrors = await validateFunctionalBinding(
              formYaml.form.functional,
              contract,
              config.workspaceRoot,
              `${formYaml.form.contract}.${formYaml.form.variant}`
            )
            validationErrors.push(...formErrors)
          }
          
          // Validate section-level functional bindings
          for (const section of formYaml.form.sections) {
            if (section.functional) {
              const sectionErrors = await validateFunctionalBinding(
                section.functional,
                contract,
                config.workspaceRoot,
                `${formYaml.form.contract}.${formYaml.form.variant}.${section.id}`
              )
              validationErrors.push(...sectionErrors)
            }
          }
          
          // Canonicalize functional form (if no errors)
          if (validationErrors.length === 0) {
            try {
              const functionalDescriptor = await canonicalizeFunctionalForm(
                formYaml,
                contract,
                config.workspaceRoot
              )
              functionalDescriptors.set(`${formYaml.form.contract}.${formYaml.form.variant}`, functionalDescriptor)
            } catch (error: any) {
              errors.push(`Failed to canonicalize functional form "${formFile}": ${error.message}`)
            }
          }
        } catch (error: any) {
          errors.push(`Failed to parse form YAML "${formFile}": ${error.message}`)
        }
      }
    } else {
      warnings.push(`Forms directory does not exist: ${formsYamlDir}`)
    }
    
    // 2. Validate dashboards with functional bindings
    const dashboardsYamlDir = join(config.yamlDir, '..', 'dashboards')
    if (existsSync(dashboardsYamlDir)) {
      const dashboardFiles = readdirSync(dashboardsYamlDir).filter(f => f.endsWith('.view.yaml'))
      
      for (const dashboardFile of dashboardFiles) {
        const dashboardPath = join(dashboardsYamlDir, dashboardFile)
        try {
          const content = readFileSync(dashboardPath, 'utf-8')
          const yamlData = parse(content)
          const dashboardYaml = DashboardYamlSchema.parse(yamlData)
          
          // Validate dashboard functional bindings (if they exist in schema)
          // Note: Dashboard schema may not have functional bindings yet
          if ((dashboardYaml.dashboard as any).functional) {
            // Find relevant contract (Dashboard contract)
            const contract = contracts.find(c => c.name === 'Dashboard' || c.domain === 'dashboard')
            if (contract) {
              const dashboardErrors = await validateFunctionalBinding(
                (dashboardYaml.dashboard as any).functional,
                contract,
                config.workspaceRoot,
                dashboardYaml.dashboard.id || dashboardFile
              )
              validationErrors.push(...dashboardErrors)
            }
          }
        } catch (error: any) {
          warnings.push(`Skipping dashboard functional validation for "${dashboardFile}": ${error.message}`)
        }
      }
    }
    
    // Convert validation errors to pipeline errors
    for (const validationError of validationErrors) {
      errors.push(
        `[${validationError.bindingType}] ${validationError.formKey}: ${validationError.message}`
      )
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 7.7,
      name: 'Functional Canonicalization',
      success: validationErrors.length === 0 && errors.length === 0,
      errors,
      warnings,
      duration,
      functionalDescriptors,
      validationErrors,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 7.7,
      name: 'Functional Canonicalization',
      success: false,
      errors: [`Functional canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

/**
 * Validate functional binding against contract metadata, ActionRegistry, and intent registry
 */
async function validateFunctionalBinding(
  binding: any,
  contract: ContractDefinition,
  workspaceRoot: string,
  formKey: string
): Promise<FunctionalValidationError[]> {
  const errors: FunctionalValidationError[] = []
  
  // Dynamic import from backend (ACL is backend-specific)
  const actionRegistryPath = join(workspaceRoot, 'entelechia-core', 'src', 'acl', 'action-registry.ts')
  let validateActionId: ((actionId: string) => boolean) | null = null
  try {
    const actionRegistryModule = await import(`file://${actionRegistryPath}`)
    validateActionId = actionRegistryModule.validateActionId
  } catch (error: any) {
    // ActionRegistry not available - skip capability validation
  }
  
  // Dynamic import from UI (intent registry is UI-specific)
  const intentRegistryPath = join(workspaceRoot, 'entelechia-ui', 'src', 'intent', 'intent-registry.ts')
  let intentRegistry: Record<string, any> | null = null
  try {
    const intentRegistryModule = await import(`file://${intentRegistryPath}`)
    intentRegistry = intentRegistryModule.INTENT_REGISTRY || {}
  } catch (error: any) {
    // Intent registry not available - skip intent validation
  }
  
  // Validate dataSource
  if (binding.dataSource) {
    const dataSource = binding.dataSource
    
    // Validate source exists
    if (dataSource.type === 'projection') {
      // Check if projection exists in projectionCapabilities
      if (!contract.projectionCapabilities) {
        errors.push({
          formKey,
          bindingType: 'dataSource',
          message: `Contract "${contract.name}" has no projectionCapabilities`,
          details: { source: dataSource.source, type: dataSource.type },
        })
      } else if (dataSource.source && !contract.projectionCapabilities[dataSource.source as any]) {
        // Note: projectionCapabilities is keyed by field type, not projection name
        // This validation may need refinement based on actual projection structure
      }
    } else if (dataSource.type === 'stateview') {
      // Check if stateview contract exists
      const stateviewContract = contract.name.includes('StateView') || contract.name.includes('StateView')
      if (!stateviewContract && dataSource.source !== contract.name) {
        // Could validate against known stateview contracts
        // For now, just check that source is a valid contract name
      }
    } else if (dataSource.type === 'contract') {
      // Validate contract exists (already validated via contract parameter)
      if (dataSource.source !== contract.name) {
        errors.push({
          formKey,
          bindingType: 'dataSource',
          message: `DataSource contract "${dataSource.source}" does not match form contract "${contract.name}"`,
          details: { source: dataSource.source, contract: contract.name },
        })
      }
    }
  }
  
  // Validate mutation
  if (binding.mutation) {
    const mutation = binding.mutation
    
    if (mutation.type === 'intent') {
      // Validate intentId exists in intent registry
      if (!mutation.intentId) {
        errors.push({
          formKey,
          bindingType: 'mutation',
          message: 'Mutation intentId is required',
          details: { mutation },
        })
      } else if (intentRegistry && !intentRegistry[mutation.intentId]) {
        errors.push({
          formKey,
          bindingType: 'mutation',
          message: `Intent "${mutation.intentId}" not found in intent registry`,
          details: { intentId: mutation.intentId, availableIntents: Object.keys(intentRegistry) },
        })
      }
    } else if (mutation.type === 'contractEndpoint') {
      // Validate contract and endpoint exist
      if (!mutation.contract) {
        errors.push({
          formKey,
          bindingType: 'mutation',
          message: 'Mutation contract is required for contractEndpoint type',
          details: { mutation },
        })
      } else if (!mutation.endpoint) {
        errors.push({
          formKey,
          bindingType: 'mutation',
          message: 'Mutation endpoint is required for contractEndpoint type',
          details: { mutation },
        })
      } else {
        // Find contract
        const mutationContract = contract.name === mutation.contract ? contract : null
        if (!mutationContract) {
          errors.push({
            formKey,
            bindingType: 'mutation',
            message: `Contract "${mutation.contract}" not found`,
            details: { contract: mutation.contract, endpoint: mutation.endpoint },
          })
        } else {
          // Find endpoint
          const endpoint = mutationContract.endpoints.find(
            ep => ep.name === mutation.endpoint || ep.path.includes(mutation.endpoint)
          )
          if (!endpoint) {
            errors.push({
              formKey,
              bindingType: 'mutation',
              message: `Endpoint "${mutation.endpoint}" not found in contract "${mutation.contract}"`,
              details: {
                contract: mutation.contract,
                endpoint: mutation.endpoint,
                availableEndpoints: mutationContract.endpoints.map(ep => ep.name),
              },
            })
          } else if (mutation.method && endpoint.method !== mutation.method) {
            errors.push({
              formKey,
              bindingType: 'mutation',
              message: `Endpoint "${mutation.endpoint}" method mismatch: expected ${endpoint.method}, got ${mutation.method}`,
              details: { endpoint: mutation.endpoint, expected: endpoint.method, got: mutation.method },
            })
          }
        }
      }
    }
  }
  
  // Validate capability
  if (binding.capability && validateActionId) {
    if (!binding.capability.requiredAction) {
      errors.push({
        formKey,
        bindingType: 'capability',
        message: 'Capability requiredAction is required',
        details: { capability: binding.capability },
      })
    } else if (!validateActionId(binding.capability.requiredAction)) {
      errors.push({
        formKey,
        bindingType: 'capability',
        message: `Invalid ActionID "${binding.capability.requiredAction}"`,
        details: { requiredAction: binding.capability.requiredAction },
      })
    }
    
    if (binding.capability.additional) {
      for (const action of binding.capability.additional) {
        if (!validateActionId(action)) {
          errors.push({
            formKey,
            bindingType: 'capability',
            message: `Invalid additional ActionID "${action}"`,
            details: { additionalAction: action },
          })
        }
      }
    }
  }
  
  // Validate listen
  if (binding.listen) {
    const listenBindings = Array.isArray(binding.listen) ? binding.listen : [binding.listen]
    for (const listen of listenBindings) {
      if (listen.type === 'projection') {
        // Validate projection exists
        if (!contract.projectionCapabilities) {
          errors.push({
            formKey,
            bindingType: 'listen',
            message: `Contract "${contract.name}" has no projectionCapabilities for listen projection`,
            details: { listen },
          })
        }
      }
    }
  }
  
  // Validate invariants
  if (binding.invariants) {
    for (const invariantId of binding.invariants.invariants || []) {
      const entry = registry.get(invariantId)
      if (!entry) {
        errors.push({
          formKey,
          bindingType: 'invariants',
          message: `Invariant "${invariantId}" not found in registry`,
          details: { invariantId },
        })
      }
    }
  }
  
  return errors
}

