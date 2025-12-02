/**
 * ✅ ENTELECHIA: Navigation Metadata Loader
 * 
 * Loads and validates navigation YAML files into strongly-typed metadata.
 * 
 * PRINCIPLE: YAML → Zod validation → TypeScript types
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type {
  UIRealmsMetadata,
  NavigationShellsMetadata,
  NodeDetailSectionsMetadata,
  ChatLayoutMetadata,
  WorkspaceSidebarMetadata,
  DashboardMetadata,
  InvariantMetadata,
} from './types.js'
import {
  UIRealmsYamlSchema,
  NavigationShellsYamlSchema,
  NodeDetailSectionsYamlSchema,
  ChatLayoutYamlSchema,
  WorkspaceSidebarYamlSchema,
  DashboardYamlSchema,
  InvariantYamlSchema,
} from './yaml-schema.js'

/**
 * Parse YAML file
 */
async function parseYaml(content: string): Promise<any> {
  try {
    const yaml = await import('yaml')
    return yaml.parse(content)
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'YAML parsing requires "yaml" package. Install with: npm install yaml'
      )
    }
    throw error
  }
}

/**
 * Load UI Realms metadata from YAML file
 */
export async function loadUIRealmsMetadata(
  yamlPath: string
): Promise<UIRealmsMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`UI Realms YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = UIRealmsYamlSchema.parse(parsed)

  return validated as UIRealmsMetadata
}

/**
 * Load Navigation Shells metadata from YAML file
 */
export async function loadNavigationShellsMetadata(
  yamlPath: string
): Promise<NavigationShellsMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Navigation Shells YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = NavigationShellsYamlSchema.parse(parsed)

  return validated as NavigationShellsMetadata
}

/**
 * Load Node Detail Sections metadata from YAML file
 */
export async function loadNodeDetailSectionsMetadata(
  yamlPath: string
): Promise<NodeDetailSectionsMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Node Detail Sections YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = NodeDetailSectionsYamlSchema.parse(parsed)

  return validated as NodeDetailSectionsMetadata
}

/**
 * Load Chat Layout metadata from YAML file
 */
export async function loadChatLayoutMetadata(
  yamlPath: string
): Promise<ChatLayoutMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Chat Layout YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = ChatLayoutYamlSchema.parse(parsed)

  return validated as ChatLayoutMetadata
}

/**
 * Load Workspace Sidebar metadata from YAML file
 */
export async function loadWorkspaceSidebarMetadata(
  yamlPath: string
): Promise<WorkspaceSidebarMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Workspace Sidebar YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = WorkspaceSidebarYamlSchema.parse(parsed)

  return validated as WorkspaceSidebarMetadata
}

/**
 * Load Dashboard metadata from YAML file
 */
export async function loadDashboardMetadata(
  yamlPath: string
): Promise<DashboardMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Dashboard YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = DashboardYamlSchema.parse(parsed)

  return validated as DashboardMetadata
}

/**
 * Load Invariant metadata from YAML file
 */
export async function loadInvariantMetadata(
  yamlPath: string
): Promise<InvariantMetadata> {
  if (!existsSync(yamlPath)) {
    throw new Error(`Invariant YAML file not found: ${yamlPath}`)
  }

  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = await parseYaml(content)
  const validated = InvariantYamlSchema.parse(parsed)

  return validated as InvariantMetadata
}

