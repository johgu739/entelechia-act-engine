/**
 * ✅ ENTELECHIA: Command Canonicalizer
 * 
 * Canonicalizes commands.yaml → CanonicalCommandDescriptor
 * Part of ACT Phase 7.8 — Command Canonicalization
 */

import type {
  CommandDescriptor,
  CommandsYAML,
  HotkeyDescriptor,
  NavigationBinding,
  CommandMutationBinding,
  AvailabilityCondition,
} from './command-schema'
import { validateHotkeyFormat } from './command-schema'

/**
 * Canonical command descriptor (output of canonicalization)
 */
export interface CanonicalCommandDescriptor {
  id: string
  label: string
  description?: string
  category: 'workspace' | 'navigation' | 'system' | 'debug'
  capability: string // ActionID
  mutation?: CommandMutationBinding
  navigation?: NavigationBinding
  hotkeys?: CanonicalHotkeyDescriptor[]
  availability?: AvailabilityCondition[]
}

/**
 * Canonical hotkey descriptor
 */
export interface CanonicalHotkeyDescriptor {
  key: string
  commandId: string
  description?: string
}

/**
 * Validation error
 */
export interface CommandValidationError {
  commandId: string
  field: string
  message: string
  level: 'error' | 'warning'
}

/**
 * Canonicalization result
 */
export interface CommandCanonicalizationResult {
  commands: CanonicalCommandDescriptor[]
  hotkeys: CanonicalHotkeyDescriptor[]
  errors: CommandValidationError[]
  warnings: CommandValidationError[]
}

/**
 * Canonicalize commands YAML
 * 
 * Validates:
 * - Command structure
 * - Hotkey syntax
 * - Unique command IDs
 * - Unique hotkey combinations (warns on conflicts)
 * 
 * Note: ActionRegistry and IntentRegistry validation is done in Phase 7.8
 */
export function canonicalizeCommands(
  commandsYAML: CommandsYAML
): CommandCanonicalizationResult {
  const errors: CommandValidationError[] = []
  const warnings: CommandValidationError[] = []
  const commands: CanonicalCommandDescriptor[] = []
  const hotkeys: CanonicalHotkeyDescriptor[] = []
  const seenCommandIds = new Set<string>()
  const seenHotkeys = new Map<string, string>() // key -> commandId
  
  for (const commandDesc of commandsYAML.commands) {
    // Check for duplicate command IDs
    if (seenCommandIds.has(commandDesc.id)) {
      errors.push({
        commandId: commandDesc.id,
        field: 'id',
        message: `Duplicate command ID: ${commandDesc.id}`,
        level: 'error',
      })
      continue
    }
    seenCommandIds.add(commandDesc.id)
    
    // Validate command must have either mutation or navigation (UI-only commands are allowed)
    // UI-only commands (like open-command-palette, toggle-theme) don't need mutation/navigation
    // They're handled directly by the UI layer
    // So we allow commands without mutation/navigation, but warn if they're not clearly UI-only
    if (!commandDesc.mutation && !commandDesc.navigation) {
      // Check if it's a UI-only command (system category commands are typically UI-only)
      const isUIOnly = commandDesc.category === 'system' || commandDesc.category === 'debug'
      if (!isUIOnly) {
        warnings.push({
          commandId: commandDesc.id,
          field: 'mutation/navigation',
          message: 'Command has no mutation or navigation binding - ensure it\'s handled by UI layer',
          level: 'warning',
        })
      }
    }
    
    // Validate hotkeys
    const commandHotkeys: CanonicalHotkeyDescriptor[] = []
    if (commandDesc.hotkeys) {
      for (const hotkeyDesc of commandDesc.hotkeys) {
        const validation = validateHotkeyFormat(hotkeyDesc.key)
        if (!validation.valid) {
          errors.push({
            commandId: commandDesc.id,
            field: 'hotkeys',
            message: `Invalid hotkey "${hotkeyDesc.key}": ${validation.error}`,
            level: 'error',
          })
          continue
        }
        
        // Check for hotkey conflicts
        const existingCommand = seenHotkeys.get(hotkeyDesc.key)
        if (existingCommand) {
          warnings.push({
            commandId: commandDesc.id,
            field: 'hotkeys',
            message: `Hotkey "${hotkeyDesc.key}" conflicts with command "${existingCommand}"`,
            level: 'warning',
          })
        } else {
          seenHotkeys.set(hotkeyDesc.key, commandDesc.id)
        }
        
        const canonicalHotkey: CanonicalHotkeyDescriptor = {
          key: hotkeyDesc.key,
          commandId: commandDesc.id,
          description: hotkeyDesc.description,
        }
        commandHotkeys.push(canonicalHotkey)
        hotkeys.push(canonicalHotkey)
      }
    }
    
    // Build canonical command descriptor
    const canonicalCommand: CanonicalCommandDescriptor = {
      id: commandDesc.id,
      label: commandDesc.label,
      description: commandDesc.description,
      category: commandDesc.category,
      capability: commandDesc.capability,
      mutation: commandDesc.mutation,
      navigation: commandDesc.navigation,
      hotkeys: commandHotkeys.length > 0 ? commandHotkeys : undefined,
      availability: commandDesc.availability,
    }
    
    commands.push(canonicalCommand)
  }
  
  return {
    commands,
    hotkeys,
    errors,
    warnings,
  }
}

/**
 * Validate commands against ActionRegistry
 * 
 * This is called by Phase 7.8 after canonicalization.
 */
export function validateCommandsAgainstActionRegistry(
  commands: CanonicalCommandDescriptor[],
  actionRegistry: Set<string> // Set of valid ActionIDs
): CommandValidationError[] {
  const errors: CommandValidationError[] = []
  
  for (const command of commands) {
    if (!actionRegistry.has(command.capability)) {
      errors.push({
        commandId: command.id,
        field: 'capability',
        message: `Invalid ActionID "${command.capability}" not found in ActionRegistry`,
        level: 'error',
      })
    }
  }
  
  return errors
}

/**
 * Validate commands against IntentRegistry
 * 
 * This is called by Phase 7.8 after canonicalization.
 */
export function validateCommandsAgainstIntentRegistry(
  commands: CanonicalCommandDescriptor[],
  intentRegistry: Set<string> // Set of valid IntentIDs
): CommandValidationError[] {
  const errors: CommandValidationError[] = []
  
  for (const command of commands) {
    if (command.mutation && command.mutation.type === 'intent') {
      if (!intentRegistry.has(command.mutation.intentId)) {
        errors.push({
          commandId: command.id,
          field: 'mutation.intentId',
          message: `Invalid IntentID "${command.mutation.intentId}" not found in IntentRegistry`,
          level: 'error',
        })
      }
    }
  }
  
  return errors
}

