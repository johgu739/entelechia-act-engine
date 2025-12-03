/**
 * ✅ ENTELECHIA: Command FORM Schema
 * 
 * Zod schemas for validating commands.yaml
 * Used by ACT Phase 7.8 — Command Canonicalization
 */

import { z } from 'zod'

/**
 * Hotkey descriptor schema
 */
export const HotkeyDescriptorSchema = z.object({
  key: z.string().describe('Key combination (e.g., "mod+n", "shift+alt+f")'),
  description: z.string().optional().describe('Hotkey description'),
})

export type HotkeyDescriptor = z.infer<typeof HotkeyDescriptorSchema>

/**
 * Navigation binding schema
 */
export const NavigationBindingSchema = z.object({
  route: z.string().optional().describe('Target route (e.g., "/workspace")'),
  action: z.enum(['back', 'forward']).optional().describe('Navigation action'),
})

export type NavigationBinding = z.infer<typeof NavigationBindingSchema>

/**
 * Mutation binding schema (reuse from functional-types.ts)
 */
export const CommandMutationBindingSchema = z.union([
  z.object({
    type: z.literal('intent'),
    intentId: z.string().describe('Intent ID from IntentRegistry'),
  }),
  z.object({
    type: z.literal('contractEndpoint'),
    contract: z.string().describe('Contract name'),
    endpoint: z.string().describe('Endpoint name'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTP method'),
  }),
])

export type CommandMutationBinding = z.infer<typeof CommandMutationBindingSchema>

/**
 * Availability condition schema
 */
export const AvailabilityConditionSchema = z.object({
  context: z.enum(['workspace', 'dashboard', 'global']).describe('UI context'),
  when: z.string().optional().describe('Condition expression'),
})

export type AvailabilityCondition = z.infer<typeof AvailabilityConditionSchema>

/**
 * Command descriptor schema
 */
export const CommandDescriptorSchema = z.object({
  id: z.string().describe('Unique command identifier'),
  label: z.string().describe('Human-readable label'),
  description: z.string().optional().describe('Full description'),
  category: z.enum(['workspace', 'navigation', 'system', 'debug']).describe('Command category'),
  scope: z.enum(['domain', 'navigation', 'system', 'devtools']).describe('Command scope: domain=has telos/intent, navigation=UI navigation, system=system utility, devtools=dev-only'),
  requiresIntent: z.boolean().describe('Whether this command requires an intentId'),
  mustExistInIntentGraph: z.boolean().describe('Whether this command must exist in IntentGraph'),
  capability: z.string().describe('Required ACL action (ActionID from ActionRegistry)'),
  mutation: CommandMutationBindingSchema.optional().describe('Mutation binding'),
  navigation: NavigationBindingSchema.optional().describe('Navigation binding'),
  hotkeys: z.array(HotkeyDescriptorSchema).optional().describe('Hotkey bindings'),
  availability: z.array(AvailabilityConditionSchema).optional().describe('Availability conditions'),
})

export type CommandDescriptor = z.infer<typeof CommandDescriptorSchema>

/**
 * Commands YAML schema
 */
export const CommandsYAMLSchema = z.object({
  commands: z.array(CommandDescriptorSchema).describe('All system commands'),
  invariants: z.array(z.string()).optional().describe('Invariant IDs enforced by commands'),
})

export type CommandsYAML = z.infer<typeof CommandsYAMLSchema>

/**
 * Validate hotkey syntax
 * 
 * Valid formats:
 * - Single key: "a", "1", "escape"
 * - Modifier + key: "mod+k", "shift+a", "ctrl+alt+delete"
 * - Multiple modifiers: "mod+shift+k"
 * 
 * Valid modifiers: mod, ctrl, alt, shift, meta
 * "mod" is automatically mapped to "cmd" on Mac, "ctrl" on Windows/Linux
 */
export function validateHotkeyFormat(key: string): { valid: boolean; error?: string } {
  const parts = key.toLowerCase().split('+')
  const validModifiers = ['mod', 'ctrl', 'alt', 'shift', 'meta']
  
  // Last part must be the actual key
  if (parts.length === 0) {
    return { valid: false, error: 'Empty hotkey string' }
  }
  
  const actualKey = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)
  
  // Validate modifiers
  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) {
      return { valid: false, error: `Invalid modifier: ${modifier}` }
    }
  }
  
  // Validate key (non-empty)
  if (!actualKey || actualKey.length === 0) {
    return { valid: false, error: 'Missing key after modifiers' }
  }
  
  return { valid: true }
}

