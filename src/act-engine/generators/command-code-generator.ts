/**
 * ✅ ENTELECHIA: Command Code Generator
 * 
 * Generates TypeScript command descriptors from canonical commands.
 * 
 * PRINCIPLE: Deterministic generation of command descriptors.
 */

import type {
  CanonicalCommandDescriptor,
  CanonicalHotkeyDescriptor,
} from '../../commands/command-canonicalizer.js'

/**
 * Generate commands.generated.ts
 */
export function generateCommandsCode(
  commands: Map<string, CanonicalCommandDescriptor>
): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Command Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from commands.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM.')
  lines.push(' * Any manual edits will be overwritten.')
  lines.push(' */')
  lines.push('')
  lines.push('')

  // Type definitions
  lines.push('export interface CanonicalCommandDescriptor {')
  lines.push('  id: string')
  lines.push('  label: string')
  lines.push('  description?: string')
  lines.push('  category: "workspace" | "navigation" | "system" | "debug"')
  lines.push('  scope: "domain" | "navigation" | "system" | "devtools"')
  lines.push('  requiresIntent: boolean')
  lines.push('  mustExistInIntentGraph: boolean')
  lines.push('  capability: string')
  lines.push('  mutation?: {')
  lines.push('    type: "intent" | "contractEndpoint"')
  lines.push('    intentId?: string')
  lines.push('    contract?: string')
  lines.push('    endpoint?: string')
  lines.push('    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"')
  lines.push('  }')
  lines.push('  navigation?: {')
  lines.push('    route?: string')
  lines.push('    action?: "back" | "forward"')
  lines.push('  }')
  lines.push('  hotkeys?: CanonicalHotkeyDescriptor[]')
  lines.push('  availability?: Array<{')
  lines.push('    context: "workspace" | "dashboard" | "global"')
  lines.push('    when?: string')
  lines.push('  }>')
  lines.push('}')
  lines.push('')
  lines.push('export interface CanonicalHotkeyDescriptor {')
  lines.push('  key: string')
  lines.push('  commandId: string')
  lines.push('  description?: string')
  lines.push('}')
  lines.push('')
  lines.push('')

  // Command registry
  lines.push('export const commandRegistry = new Map<string, CanonicalCommandDescriptor>(')
  lines.push('  [')

  const commandEntries: string[] = []
  for (const [id, command] of commands.entries()) {
    const commandJson = JSON.stringify(command, null, 2)
    const tsLiteral = commandJson.replace(/"([^"]+)":/g, '$1:')
    commandEntries.push(`    [${JSON.stringify(id)}, ${tsLiteral}]`)
  }

  lines.push(commandEntries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')

  // Helper functions
  lines.push('/**')
  lines.push(' * Get command by ID')
  lines.push(' */')
  lines.push('export function getCommand(id: string): CanonicalCommandDescriptor | undefined {')
  lines.push('  return commandRegistry.get(id)')
  lines.push('}')
  lines.push('')

  lines.push('/**')
  lines.push(' * Get all commands')
  lines.push(' */')
  lines.push('export function getAllCommands(): CanonicalCommandDescriptor[] {')
  lines.push('  return Array.from(commandRegistry.values())')
  lines.push('}')
  lines.push('')

  lines.push('/**')
  lines.push(' * Get commands by category')
  lines.push(' */')
  lines.push('export function getCommandsByCategory(')
  lines.push('  category: "workspace" | "navigation" | "system" | "debug"')
  lines.push('): CanonicalCommandDescriptor[] {')
  lines.push('  return Array.from(commandRegistry.values()).filter(cmd => cmd.category === category)')
  lines.push('}')
  lines.push('')

  lines.push('/**')
  lines.push(' * Get commands available in context')
  lines.push(' */')
  lines.push('export function getCommandsByContext(')
  lines.push('  context: "workspace" | "dashboard" | "global"')
  lines.push('): CanonicalCommandDescriptor[] {')
  lines.push('  return Array.from(commandRegistry.values()).filter(cmd => {')
  lines.push('    if (!cmd.availability) return true')
  lines.push('    return cmd.availability.some(avail => avail.context === context)')
  lines.push('  })')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate hotkeys.generated.ts
 */
export function generateHotkeysCode(
  hotkeys: Map<string, CanonicalHotkeyDescriptor>
): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Hotkey Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from commands.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM.')
  lines.push(' * Any manual edits will be overwritten.')
  lines.push(' */')
  lines.push('')
  lines.push('')

  // Type definitions
  lines.push('export interface CanonicalHotkeyDescriptor {')
  lines.push('  key: string')
  lines.push('  commandId: string')
  lines.push('  description?: string')
  lines.push('}')
  lines.push('')
  lines.push('')

  // Hotkey registry
  lines.push('export const hotkeyRegistry = new Map<string, CanonicalHotkeyDescriptor>(')
  lines.push('  [')

  const hotkeyEntries: string[] = []
  for (const [key, hotkey] of hotkeys.entries()) {
    const hotkeyJson = JSON.stringify(hotkey, null, 2)
    const tsLiteral = hotkeyJson.replace(/"([^"]+)":/g, '$1:')
    hotkeyEntries.push(`    [${JSON.stringify(key)}, ${tsLiteral}]`)
  }

  lines.push(hotkeyEntries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')

  // Helper functions
  lines.push('/**')
  lines.push(' * Get hotkey by key combination')
  lines.push(' */')
  lines.push('export function getHotkey(key: string): CanonicalHotkeyDescriptor | undefined {')
  lines.push('  return hotkeyRegistry.get(key)')
  lines.push('}')
  lines.push('')

  lines.push('/**')
  lines.push(' * Get all hotkeys')
  lines.push(' */')
  lines.push('export function getAllHotkeys(): CanonicalHotkeyDescriptor[] {')
  lines.push('  return Array.from(hotkeyRegistry.values())')
  lines.push('}')
  lines.push('')

  lines.push('/**')
  lines.push(' * Get hotkeys for a command')
  lines.push(' */')
  lines.push('export function getHotkeysForCommand(commandId: string): CanonicalHotkeyDescriptor[] {')
  lines.push('  return Array.from(hotkeyRegistry.values()).filter(hk => hk.commandId === commandId)')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

