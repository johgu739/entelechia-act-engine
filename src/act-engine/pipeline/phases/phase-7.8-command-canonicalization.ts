/**
 * ✅ ENTELECHIA: Phase 7.8 — Command Canonicalization
 * 
 * Validates and canonicalizes commands.yaml:
 * - Reads commands.yaml from entelechia-ui/commands/
 * - Validates all commands against ActionRegistry and IntentRegistry
 * - Validates hotkey syntax and detects conflicts
 * - Generates canonical command and hotkey descriptors
 * 
 * PRINCIPLE: All commands must be validated before code generation.
 * This phase runs AFTER Phase 7.7 (Functional Canonicalization) and BEFORE Phase 7 (Code Generation).
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import { CommandsYAMLSchema } from '../../../commands/command-schema.js'
import {
  canonicalizeCommands,
  validateCommandsAgainstActionRegistry,
  validateCommandIntentBindingCoherence,
  type CommandCanonicalizationResult,
} from '../../../commands/command-canonicalizer.js'
import type {
  CanonicalCommandDescriptor,
  CanonicalHotkeyDescriptor,
} from '../../../commands/command-canonicalizer.js'

/**
 * Execute Phase 7.8: Command Canonicalization
 */
export async function runPhase7_8CommandCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<
  PhaseResult & {
    commandDescriptors?: Map<string, CanonicalCommandDescriptor>
    hotkeyDescriptors?: Map<string, CanonicalHotkeyDescriptor>
  }
> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 1. Read commands.yaml
    const commandsYamlPath = join(config.workspaceRoot, 'entelechia-ui', 'commands', 'commands.yaml')
    
    if (!existsSync(commandsYamlPath)) {
      // Commands are optional - if file doesn't exist, skip this phase
      return {
        phase: 7.8,
        name: 'Command Canonicalization',
        success: true,
        errors: [],
        warnings: ['commands.yaml not found - skipping command canonicalization'],
        duration: Date.now() - startTime,
      }
    }

    const yamlContent = readFileSync(commandsYamlPath, 'utf-8')
    const yamlData = parse(yamlContent)
    
    // 2. Validate YAML structure
    let commandsYAML
    try {
      commandsYAML = CommandsYAMLSchema.parse(yamlData)
    } catch (error: any) {
      return {
        phase: 7.8,
        name: 'Command Canonicalization',
        success: false,
        errors: [`Failed to parse commands.yaml: ${error.message}`],
        warnings: [],
        duration: Date.now() - startTime,
      }
    }

    // 3. Canonicalize commands (validates structure, hotkey syntax, detects conflicts)
    const canonicalizationResult: CommandCanonicalizationResult = canonicalizeCommands(commandsYAML)

    // Convert validation errors to string array
    for (const error of canonicalizationResult.errors) {
      errors.push(`Command "${error.commandId}": ${error.field} - ${error.message}`)
    }

    for (const warning of canonicalizationResult.warnings) {
      warnings.push(`Command "${warning.commandId}": ${warning.field} - ${warning.message}`)
    }

    // 4. Validate against ActionRegistry
    const actionRegistry = await loadActionRegistry(config.workspaceRoot)
    const actionRegistryErrors = validateCommandsAgainstActionRegistry(
      canonicalizationResult.commands,
      actionRegistry
    )

    for (const error of actionRegistryErrors) {
      errors.push(`Command "${error.commandId}": ${error.field} - ${error.message}`)
    }

    // 5. Validate command-intent binding coherence against IntentGraph
    // This implements invariant COMMAND_INTENT_BINDING_COHERENCE.F91
    try {
      const intentGraphIntentIds = await loadIntentGraphIntentIds(config.workspaceRoot)
      const coherenceErrors = validateCommandIntentBindingCoherence(
        canonicalizationResult.commands,
        intentGraphIntentIds
      )

      for (const error of coherenceErrors) {
        errors.push(`Command "${error.commandId}": ${error.field} - ${error.message}`)
      }
    } catch (error: any) {
      // If IntentGraph can't be loaded, fail the pipeline
      errors.push(`Failed to load IntentGraph for command-intent validation: ${error.message}`)
    }

    // 6. Build descriptor maps
    const commandDescriptors = new Map<string, CanonicalCommandDescriptor>()
    const hotkeyDescriptors = new Map<string, CanonicalHotkeyDescriptor>()

    for (const command of canonicalizationResult.commands) {
      commandDescriptors.set(command.id, command)
    }

    for (const hotkey of canonicalizationResult.hotkeys) {
      hotkeyDescriptors.set(hotkey.key, hotkey)
    }

    // 7. Fail pipeline on errors (warnings don't fail)
    const success = errors.length === 0

    const duration = Date.now() - startTime

    return {
      phase: 7.8,
      name: 'Command Canonicalization',
      success,
      errors,
      warnings,
      duration,
      commandDescriptors,
      hotkeyDescriptors,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    return {
      phase: 7.8,
      name: 'Command Canonicalization',
      success: false,
      errors: [`Command canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

/**
 * Load ActionRegistry from backend
 * Uses same approach as Phase 7.7 (functional-canonicalizer.ts)
 */
async function loadActionRegistry(workspaceRoot: string): Promise<Set<string>> {
  try {
    // Dynamic import from backend (ACL is backend-specific)
    const actionRegistryPath = join(
      workspaceRoot,
      'entelechia-core',
      'src',
      'acl',
      'action-registry.ts'
    )
    
    const actionRegistryModule = await import(`file://${actionRegistryPath}`)
    
    // Extract ActionIDs from ActionRegistry object
    const actionIds = new Set<string>()
    const actionRegistry = actionRegistryModule.ActionRegistry
    
    if (actionRegistry && typeof actionRegistry === 'object') {
      // ActionRegistry is a Record<ActionID, ActionDefinition>
      // Extract all keys (ActionIDs)
      for (const key of Object.keys(actionRegistry)) {
        actionIds.add(key)
      }
    }
    
    return actionIds
  } catch (error) {
    // If ActionRegistry can't be loaded, return empty set (will cause validation errors)
    console.warn('[Phase 7.8] Could not load ActionRegistry:', error)
    return new Set<string>()
  }
}

/**
 * Load IntentGraph YAML and extract all IntentIDs
 * 
 * This is used to validate that domain commands have valid intentIds
 * and that non-domain commands don't have intentIds.
 */
async function loadIntentGraphIntentIds(workspaceRoot: string): Promise<Set<string>> {
  try {
    const intentGraphPath = join(
      workspaceRoot,
      'entelechia-form',
      'intent-graph',
      'intent-graph.yaml'
    )
    
    if (!existsSync(intentGraphPath)) {
      // If IntentGraph doesn't exist, return empty set (will cause validation errors)
      console.warn('[Phase 7.8] IntentGraph YAML not found:', intentGraphPath)
      return new Set<string>()
    }
    
    const yamlContent = readFileSync(intentGraphPath, 'utf-8')
    const yamlData = parse(yamlContent)
    
    // Extract all IntentIDs from intentGraph.intents array
    const intentIds = new Set<string>()
    
    if (yamlData.intentGraph && yamlData.intentGraph.intents && Array.isArray(yamlData.intentGraph.intents)) {
      for (const intent of yamlData.intentGraph.intents) {
        if (intent.id && typeof intent.id === 'string') {
          intentIds.add(intent.id)
        }
      }
    }
    
    return intentIds
  } catch (error) {
    // If IntentGraph can't be loaded, return empty set (will cause validation errors)
    console.warn('[Phase 7.8] Could not load IntentGraph:', error)
    return new Set<string>()
  }
}

