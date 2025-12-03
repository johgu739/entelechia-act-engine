/**
 * ✅ ENTELECHIA: Instrumentation Code Generator
 * 
 * Generates TypeScript instrumentation descriptors from canonical instrumentation.
 * 
 * PRINCIPLE: Deterministic generation of instrumentation descriptors.
 */

import type { CanonicalTelemetryDescriptor } from '../../instrumentation/telemetry-canonicalizer.js'
import type { CanonicalDevToolsDescriptor } from '../../instrumentation/devtools-canonicalizer.js'
import type { CanonicalUXFidelityDescriptor } from '../../instrumentation/ux-canonicalizer.js'

/**
 * Generate telemetry.generated.ts
 */
export function generateTelemetryCode(
  telemetryDescriptors: Map<string, CanonicalTelemetryDescriptor>
): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Telemetry Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from telemetry/*.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('import type { CanonicalTelemetryDescriptor } from "@entelechia/act-engine/instrumentation/telemetry-canonicalizer"')
  lines.push('')
  lines.push('export const telemetryRegistry = new Map<string, CanonicalTelemetryDescriptor>(')
  lines.push('  [')

  const entries: string[] = []
  for (const [key, descriptor] of telemetryDescriptors.entries()) {
    const descriptorJson = JSON.stringify(descriptor, null, 2)
    entries.push(`    [${JSON.stringify(key)}, ${descriptorJson} as CanonicalTelemetryDescriptor]`)
  }

  lines.push(entries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')
  lines.push('export function getTelemetryDescriptor(key: string): CanonicalTelemetryDescriptor | undefined {')
  lines.push('  return telemetryRegistry.get(key)')
  lines.push('}')
  lines.push('')
  lines.push('export function getAllTelemetryDescriptors(): CanonicalTelemetryDescriptor[] {')
  lines.push('  return Array.from(telemetryRegistry.values())')
  lines.push('}')

  return lines.join('\n')
}

/**
 * Generate devtools.generated.ts
 */
export function generateDevToolsCode(
  devtoolsDescriptors: Map<string, CanonicalDevToolsDescriptor>
): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: DevTools Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from devtools/*.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('import type { CanonicalDevToolsDescriptor } from "@entelechia/act-engine/instrumentation/devtools-canonicalizer"')
  lines.push('')
  lines.push('export const devtoolsRegistry = new Map<string, CanonicalDevToolsDescriptor>(')
  lines.push('  [')

  const entries: string[] = []
  for (const [key, descriptor] of devtoolsDescriptors.entries()) {
    const descriptorJson = JSON.stringify(descriptor, null, 2)
    entries.push(`    [${JSON.stringify(key)}, ${descriptorJson} as CanonicalDevToolsDescriptor]`)
  }

  lines.push(entries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')
  lines.push('export function getDevToolsDescriptor(key: string): CanonicalDevToolsDescriptor | undefined {')
  lines.push('  return devtoolsRegistry.get(key)')
  lines.push('}')
  lines.push('')
  lines.push('export function getAllDevToolsDescriptors(): CanonicalDevToolsDescriptor[] {')
  lines.push('  return Array.from(devtoolsRegistry.values())')
  lines.push('}')

  return lines.join('\n')
}

/**
 * Generate ux-fidelity.generated.ts
 */
export function generateUXFidelityCode(
  uxFidelityDescriptors: Map<string, CanonicalUXFidelityDescriptor>
): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: UX Fidelity Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from ux/*.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('import type { CanonicalUXFidelityDescriptor } from "@entelechia/act-engine/instrumentation/ux-canonicalizer"')
  lines.push('')
  lines.push('export const uxFidelityRegistry = new Map<string, CanonicalUXFidelityDescriptor>(')
  lines.push('  [')

  const entries: string[] = []
  for (const [key, descriptor] of uxFidelityDescriptors.entries()) {
    const descriptorJson = JSON.stringify(descriptor, null, 2)
    entries.push(`    [${JSON.stringify(key)}, ${descriptorJson} as CanonicalUXFidelityDescriptor]`)
  }

  lines.push(entries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')
  lines.push('export function getUXFidelityDescriptor(key: string): CanonicalUXFidelityDescriptor | undefined {')
  lines.push('  return uxFidelityRegistry.get(key)')
  lines.push('}')
  lines.push('')
  lines.push('export function getAllUXFidelityDescriptors(): CanonicalUXFidelityDescriptor[] {')
  lines.push('  return Array.from(uxFidelityRegistry.values())')
  lines.push('}')

  return lines.join('\n')
}

