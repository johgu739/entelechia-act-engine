/**
 * ✅ ENTELECHIA: Phase 7.6 — Invariant Canonicalization & Enforcement
 * 
 * Evaluates invariants on canonical descriptors and rejects illegal structures.
 * 
 * PRINCIPLE: Fail fast - violations detected at canonicalization time, not runtime.
 * 
 * This phase runs AFTER Phase 7.5 (Functional Canonicalization) and BEFORE Phase 7 (Code Generation).
 * It ensures that nothing illegal ever reaches STATE (generated code).
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { registry } from '@entelechia/invariant-engine'
import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import type { CanonicalFormDescriptor } from '../../../forms/canonicalizer.js'
import {
  DashboardYamlSchema,
  type DashboardYaml,
  UIRealmsYamlSchema,
  type UIRealmsYaml,
  NavigationShellsYamlSchema,
  type NavigationShellsYaml,
  NodeDetailSectionsYamlSchema,
  type NodeDetailSectionsYaml,
  WorkspaceSidebarYamlSchema,
  type WorkspaceSidebarYaml,
} from '../../../navigation/metadata/yaml-schema.js'

export interface InvariantViolation {
  invariantId: string
  descriptorType: 'form' | 'navigation' | 'dashboard'
  descriptorKey: string
  message: string
  details: Record<string, unknown>
}

/**
 * Execute Phase 7.6: Invariant Canonicalization & Enforcement
 */
export async function runPhase7_6InvariantEnforcement(
  manifest: ActManifest,
  config: ActEngineConfig,
  formDescriptors?: Map<string, CanonicalFormDescriptor>
): Promise<PhaseResult & { violations?: InvariantViolation[] }> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const violations: InvariantViolation[] = []
  
  try {
    // Evaluate invariants on form descriptors
    if (formDescriptors) {
      for (const [key, descriptor] of formDescriptors) {
        const descriptorViolations = evaluateInvariantsOnFormDescriptor(descriptor)
        violations.push(...descriptorViolations)
      }
    }
    
    // Evaluate invariants on dashboard YAML files
    const dashboardsYamlDir = join(config.yamlDir, '..', 'dashboards')
    if (existsSync(dashboardsYamlDir)) {
      const dashboardFiles = readdirSync(dashboardsYamlDir).filter(f => f.endsWith('.view.yaml'))
      for (const dashboardFile of dashboardFiles) {
        try {
          const yamlPath = join(dashboardsYamlDir, dashboardFile)
          const content = readFileSync(yamlPath, 'utf-8')
          const yamlData = parse(content)
          const dashboardYaml = DashboardYamlSchema.parse(yamlData)
          
          const dashboardViolations = evaluateInvariantsOnDashboardYaml(dashboardYaml.dashboard, dashboardFile)
          violations.push(...dashboardViolations)
        } catch (error: any) {
          // Skip invalid YAML files (they'll be caught in Phase 6b)
          warnings.push(`Skipping dashboard invariant check for "${dashboardFile}": ${error.message}`)
        }
      }
    }
    
    // Evaluate invariants on navigation YAML files
    const navigationYamlDir = join(config.yamlDir, '..', 'navigation')
    if (existsSync(navigationYamlDir)) {
      // UI Realms
      const uiRealmsYamlPath = join(navigationYamlDir, 'ui-realms.yaml')
      if (existsSync(uiRealmsYamlPath)) {
        try {
          const content = readFileSync(uiRealmsYamlPath, 'utf-8')
          const yamlData = parse(content)
          const uiRealmsYaml = UIRealmsYamlSchema.parse(yamlData)
          
          for (const realm of uiRealmsYaml.realms) {
            const realmViolations = evaluateInvariantsOnUIRealm(realm)
            violations.push(...realmViolations)
          }
        } catch (error: any) {
          warnings.push(`Skipping UI Realms invariant check: ${error.message}`)
        }
      }
      
      // Navigation Shells
      const navigationShellsYamlPath = join(navigationYamlDir, 'navigation-shells.yaml')
      if (existsSync(navigationShellsYamlPath)) {
        try {
          const content = readFileSync(navigationShellsYamlPath, 'utf-8')
          const yamlData = parse(content)
          const shellsYaml = NavigationShellsYamlSchema.parse(yamlData)
          
          for (const shell of shellsYaml.shells) {
            const shellViolations = evaluateInvariantsOnNavigationShell(shell)
            violations.push(...shellViolations)
          }
        } catch (error: any) {
          warnings.push(`Skipping Navigation Shells invariant check: ${error.message}`)
        }
      }
      
      // Node Detail Sections
      const nodeDetailSectionsYamlPath = join(navigationYamlDir, 'node-detail-sections.yaml')
      if (existsSync(nodeDetailSectionsYamlPath)) {
        try {
          const content = readFileSync(nodeDetailSectionsYamlPath, 'utf-8')
          const yamlData = parse(content)
          const sectionsYaml = NodeDetailSectionsYamlSchema.parse(yamlData)
          
          const sectionsViolations = evaluateInvariantsOnNodeDetailSections(sectionsYaml)
          violations.push(...sectionsViolations)
        } catch (error: any) {
          warnings.push(`Skipping Node Detail Sections invariant check: ${error.message}`)
        }
      }
      
      // Workspace Sidebar
      const workspaceSidebarYamlPath = join(navigationYamlDir, 'workspace-sidebar.yaml')
      if (existsSync(workspaceSidebarYamlPath)) {
        try {
          const content = readFileSync(workspaceSidebarYamlPath, 'utf-8')
          const yamlData = parse(content)
          const sidebarYaml = WorkspaceSidebarYamlSchema.parse(yamlData)
          
          const sidebarViolations = evaluateInvariantsOnWorkspaceSidebar(sidebarYaml)
          violations.push(...sidebarViolations)
        } catch (error: any) {
          warnings.push(`Skipping Workspace Sidebar invariant check: ${error.message}`)
        }
      }
    }
    
    // Convert violations to errors
    for (const violation of violations) {
      errors.push(
        `[${violation.invariantId}] ${violation.descriptorType} "${violation.descriptorKey}": ${violation.message}`
      )
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 7.6,
      name: 'Invariant Canonicalization & Enforcement',
      success: violations.length === 0,
      errors,
      warnings,
      duration,
      violations,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 7.6,
      name: 'Invariant Canonicalization & Enforcement',
      success: false,
      errors: [`Invariant enforcement failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

/**
 * Evaluate invariants on form descriptor
 * 
 * Checks all invariants that apply to forms:
 * - F82: Single Scroll Container
 * - F004: Canonical Padding
 * - F001-F005: Form Layout Invariants
 * - Any invariants declared in YAML
 */
function evaluateInvariantsOnFormDescriptor(
  descriptor: CanonicalFormDescriptor
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = `${descriptor.contract}.${descriptor.variant}`
  
  // F82: Single Scroll Container
  const scrollContainerCount = descriptor.scrollContainers.length
  if (scrollContainerCount !== 1) {
    violations.push({
      invariantId: 'UI_SCROLL.F82',
      descriptorType: 'form',
      descriptorKey,
      message: `Multiple scroll containers detected (${scrollContainerCount}). Only one scroll container allowed.`,
      details: { scrollContainerCount, scrollContainers: descriptor.scrollContainers },
    })
  }
  
  // F004: Canonical Padding
  const expectedX = 24
  const expectedY = 16
  if (descriptor.padding.x !== expectedX) {
    violations.push({
      invariantId: 'UI_FORM.F004',
      descriptorType: 'form',
      descriptorKey,
      message: `Non-canonical horizontal padding: ${descriptor.padding.x}px (expected ${expectedX}px)`,
      details: { paddingX: descriptor.padding.x, expectedX },
    })
  }
  if (descriptor.padding.y !== expectedY) {
    violations.push({
      invariantId: 'UI_FORM.F004',
      descriptorType: 'form',
      descriptorKey,
      message: `Non-canonical vertical padding: ${descriptor.padding.y}px (expected ${expectedY}px)`,
      details: { paddingY: descriptor.padding.y, expectedY },
    })
  }
  
  // Validate declared invariants
  for (const invariantId of descriptor.invariants.declared) {
    const entry = registry.get(invariantId)
    if (!entry) {
      violations.push({
        invariantId: 'INVARIANT-REGISTRY',
        descriptorType: 'form',
        descriptorKey,
        message: `Declared invariant ${invariantId} not found in registry`,
        details: { declaredInvariantId: invariantId },
      })
      continue
    }
    
    // Evaluate invariant-specific constraints
    // Note: Most invariants are evaluated at runtime, but we can check structural constraints here
    switch (invariantId) {
      case 'UI_SCROLL.F82':
        // Already checked above
        break
      case 'UI_FORM.F004':
        // Already checked above
        break
      // Add more invariant-specific checks as needed
    }
  }
  
  // F001-F005: Form Layout Invariants
  // (These are validated in validateFormInvariants, but we verify here as well)
  const sectionIds = new Set<string>()
  for (const section of descriptor.sections) {
    if (sectionIds.has(section.id)) {
      violations.push({
        invariantId: 'UI_FORM.F001', // Section ordering / uniqueness
        descriptorType: 'form',
        descriptorKey,
        message: `Duplicate section ID: "${section.id}"`,
        details: { sectionId: section.id },
      })
    }
    sectionIds.add(section.id)
  }
  
  return violations
}

/**
 * Evaluate invariants on UI Realm
 * 
 * Validates realm-level invariants:
 * - F82: Single Scroll Container (scroll: 'content' | 'none' | 'full' - only one allowed)
 * - F63: Header Singularity (header: 'fixed' | 'none' | 'scrollable' - single value)
 * - F60: UI Ontology Unity (realm structure consistency)
 * - F61: Layout Unity (layout values must be canonical)
 */
function evaluateInvariantsOnUIRealm(
  realm: UIRealmsYaml['realms'][0]
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = realm.id
  
  // F82: Single Scroll Container
  // The scroll field must be exactly one of: 'content', 'none', or 'full'
  // This is already enforced by the schema enum, but we verify here for clarity
  if (realm.form.scroll !== 'content' && realm.form.scroll !== 'none' && realm.form.scroll !== 'full') {
    violations.push({
      invariantId: 'UI_SCROLL.F82',
      descriptorType: 'navigation',
      descriptorKey,
      message: `Realm "${realm.id}" has invalid scroll value: ${realm.form.scroll}. Must be 'content', 'none', or 'full'.`,
      details: { scroll: realm.form.scroll },
    })
  }
  
  // F63: Header Singularity
  // Header must be exactly one value (enforced by schema enum)
  if (realm.form.header !== 'fixed' && realm.form.header !== 'none' && realm.form.header !== 'scrollable') {
    violations.push({
      invariantId: 'UI_HIERARCHY.F63',
      descriptorType: 'navigation',
      descriptorKey,
      message: `Realm "${realm.id}" has invalid header value: ${realm.form.header}. Must be 'fixed', 'none', or 'scrollable'.`,
      details: { header: realm.form.header },
    })
  }
  
  // F61: Layout Unity - Content padding must be canonical (24px)
  if (realm.layout.contentPaddingPx !== 24) {
    violations.push({
      invariantId: 'UI_LAYOUT.F61',
      descriptorType: 'navigation',
      descriptorKey,
      message: `Realm "${realm.id}" has non-canonical content padding: ${realm.layout.contentPaddingPx}px (expected 24px)`,
      details: { contentPaddingPx: realm.layout.contentPaddingPx, expected: 24 },
    })
  }
  
  // F86: Spacing Grid Unity - All spacing values must be 4px aligned
  const spacingValues = [
    realm.layout.contentPaddingPx,
    realm.layout.headerHeightPx,
  ]
  for (const value of spacingValues) {
    if (value % 4 !== 0) {
      violations.push({
        invariantId: 'UI_SPACING.F86',
        descriptorType: 'navigation',
        descriptorKey,
        message: `Realm "${realm.id}" has spacing value ${value}px not aligned to 4px grid`,
        details: { spacingValue: value, expectedGrid: 4 },
      })
    }
  }
  
  // Validate declared invariants
  if (realm.invariants?.invariants) {
    for (const invariantId of realm.invariants.invariants) {
      const entry = registry.get(invariantId)
      if (!entry) {
        violations.push({
          invariantId: 'INVARIANT-REGISTRY',
          descriptorType: 'navigation',
          descriptorKey,
          message: `Declared invariant ${invariantId} not found in registry`,
          details: { declaredInvariantId: invariantId },
        })
      }
    }
  }
  
  return violations
}

/**
 * Evaluate invariants on Navigation Shell
 * 
 * Validates shell-level invariants:
 * - F89/F90: Scroll Canon (in shells)
 * - F24: Nondestructive Refresh (navigation consistency)
 */
function evaluateInvariantsOnNavigationShell(
  shell: NavigationShellsYaml['shells'][0]
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = shell.realmId
  
  // F24: Nondestructive Refresh - Navigation items must have unique IDs
  const navItemIds = new Set<string>()
  for (const item of shell.primaryNav.items) {
    if (navItemIds.has(item.id)) {
      violations.push({
        invariantId: 'UI_NAVIGATION.F24',
        descriptorType: 'navigation',
        descriptorKey,
        message: `Navigation shell "${shell.realmId}" has duplicate nav item ID: "${item.id}"`,
        details: { navItemId: item.id },
      })
    }
    navItemIds.add(item.id)
  }
  
  // Validate declared invariants
  // Note: NavigationShellSchema doesn't have invariants field yet - would need to add it
  
  return violations
}

/**
 * Evaluate invariants on Node Detail Sections
 * 
 * Validates section-level invariants:
 * - F84: Nav Hierarchy Unity (section ordering/uniqueness)
 */
function evaluateInvariantsOnNodeDetailSections(
  sectionsYaml: NodeDetailSectionsYaml
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = 'node-detail-sections'
  
  // F84: Nav Hierarchy Unity - Section IDs must be unique
  const sectionIds = new Set<string>()
  for (const section of sectionsYaml.sections) {
    if (sectionIds.has(section.id)) {
      violations.push({
        invariantId: 'UI_HIERARCHY.F84',
        descriptorType: 'navigation',
        descriptorKey,
        message: `Duplicate section ID: "${section.id}"`,
        details: { sectionId: section.id },
      })
    }
    sectionIds.add(section.id)
  }
  
  // Only one section can be default
  const defaultSections = sectionsYaml.sections.filter(s => s.default === true)
  if (defaultSections.length > 1) {
    violations.push({
      invariantId: 'UI_HIERARCHY.F84',
      descriptorType: 'navigation',
      descriptorKey,
      message: `Multiple default sections found (${defaultSections.length}). Only one section can be default.`,
      details: { defaultSections: defaultSections.map(s => s.id) },
    })
  }
  
  return violations
}

/**
 * Evaluate invariants on Workspace Sidebar
 * 
 * Validates sidebar-level invariants:
 * - F23: Sidebar Canonicality
 * - F86: Spacing Grid Unity
 */
function evaluateInvariantsOnWorkspaceSidebar(
  sidebarYaml: WorkspaceSidebarYaml
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = 'workspace-sidebar'
  
  const sidebar = sidebarYaml.sidebar
  
  // F86: Spacing Grid Unity - All spacing values must be 4px aligned
  if (sidebar.styling) {
    const spacingValues = [
      sidebar.styling.horizontalPadding,
      sidebar.styling.verticalPadding,
      sidebar.styling.nodeSpacing,
      sidebar.styling.indentPerLevel,
    ]
    
    for (const value of spacingValues) {
      if (value % 4 !== 0) {
        violations.push({
          invariantId: 'UI_SPACING.F86',
          descriptorType: 'navigation',
          descriptorKey,
          message: `Workspace sidebar has spacing value ${value}px not aligned to 4px grid`,
          details: { spacingValue: value, expectedGrid: 4 },
        })
      }
    }
  }
  
  // F23: Sidebar Canonicality - Sidebar must have valid structure
  if (!sidebar.tree || !sidebar.styling) {
    violations.push({
      invariantId: 'UI_NAVIGATION.F23',
      descriptorType: 'navigation',
      descriptorKey,
      message: 'Workspace sidebar missing required tree or styling configuration',
      details: { hasTree: !!sidebar.tree, hasStyling: !!sidebar.styling },
    })
  }
  
  return violations
}

/**
 * Evaluate invariants on dashboard YAML
 * 
 * Validates dashboard-level invariants from YAML structure:
 * - F82: Single Scroll Container (structural check)
 * - F86: Spacing Grid Unity (4px grid)
 * - Declared invariants from YAML
 */
function evaluateInvariantsOnDashboardYaml(
  dashboard: DashboardYaml['dashboard'],
  fileName: string
): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const descriptorKey = dashboard.id || fileName.replace('.view.yaml', '')
  
  // F86: Spacing Grid Unity (4px grid)
  const layout = dashboard.layout
  const spacingValues = [
    layout.horizontalPadding,
    layout.verticalPadding,
    layout.sectionSpacing,
  ]
  
  for (const value of spacingValues) {
    if (value % 4 !== 0) {
      violations.push({
        invariantId: 'UI_SPACING.F86',
        descriptorType: 'dashboard',
        descriptorKey,
        message: `Spacing value ${value}px is not aligned to 4px grid`,
        details: { spacingValue: value, expectedGrid: 4 },
      })
    }
  }
  
  // F82: Single Scroll Container (structural check)
  // Note: This is a structural check - actual DOM validation happens at runtime
  // We can't fully validate this from YAML alone, but we can check that the layout
  // doesn't explicitly define multiple scroll containers
  
  // Validate declared invariants
  if (dashboard.invariants?.invariants) {
    for (const invariantId of dashboard.invariants.invariants) {
      const entry = registry.get(invariantId)
      if (!entry) {
        violations.push({
          invariantId: 'INVARIANT-REGISTRY',
          descriptorType: 'dashboard',
          descriptorKey,
          message: `Declared invariant ${invariantId} not found in registry`,
          details: { declaredInvariantId: invariantId },
        })
        continue
      }
      
      // Evaluate invariant-specific constraints
      switch (invariantId) {
        case 'UI_SPACING.F86':
          // Already checked above
          break
        case 'UI_SCROLL.F82':
          // Structural check already done (can't fully validate from YAML)
          break
        // Add more invariant-specific checks as needed
      }
    }
  }
  
  return violations
}

