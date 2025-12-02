/**
 * ✅ ENTELECHIA: Phase 6b — Navigation Canonicalization
 * 
 * Generates navigation descriptors from YAML metadata.
 * 
 * This phase runs after form canonicalization (phase 6) but before code generation (phase 7).
 */

import { existsSync } from 'fs'
import { join } from 'path'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import {
  generateUIRealmsCode,
  generateNavigationShellsCode,
  generateNodeDetailSectionsCode,
  generateChatLayoutCode,
  generateWorkspaceSidebarCode,
  generateDashboardCode,
  generateInvariantCode,
} from '../../generators/navigation-code-generator.js'
import { DeterministicWriter } from '../../writers/deterministic-writer.js'

/**
 * Execute Phase 6b: Navigation Canonicalization
 */
export async function runPhase6bNavigationCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const writer = new DeterministicWriter()

  try {
    // Navigation YAML directory (in entelechia-ui/navigation)
    const navigationYamlDir = join(config.yamlDir, '..', 'navigation')
    const navigationOutputDir = join(config.formsOutputDir, '..', 'navigation')
    
    // Dashboard YAML directory (in entelechia-ui/dashboards)
    const dashboardsYamlDir = join(config.yamlDir, '..', 'dashboards')
    const dashboardsOutputDir = join(config.formsOutputDir, '..', 'dashboards')
    
    // Invariant YAML directory (in entelechia-ui/invariants)
    const invariantsYamlDir = join(config.yamlDir, '..', 'invariants')
    const invariantsOutputDir = join(config.formsOutputDir, '..', 'invariants')

    // Check if navigation directory exists
    if (!existsSync(navigationYamlDir)) {
      return {
        phase: 6.5,
        name: 'Navigation Canonicalization',
        success: true, // Not an error if navigation dir doesn't exist
        errors: [],
        warnings: [`Navigation directory does not exist: ${navigationYamlDir} (skipping navigation canonicalization)`],
        duration: Date.now() - startTime,
      }
    }

    // Paths for navigation YAML files
    const uiRealmsYamlPath = join(navigationYamlDir, 'ui-realms.yaml')
    const navigationShellsYamlPath = join(navigationYamlDir, 'navigation-shells.yaml')
    const nodeDetailSectionsYamlPath = join(navigationYamlDir, 'node-detail-sections.yaml')
    const chatLayoutYamlPath = join(navigationYamlDir, 'chat-layout.yaml')
    const workspaceSidebarYamlPath = join(navigationYamlDir, 'workspace-sidebar.yaml')

    // Generate UI Realms
    if (existsSync(uiRealmsYamlPath)) {
      try {
        const outputPath = join(navigationOutputDir, 'ui-realms.generated.ts')
        const { content } = await generateUIRealmsCode(uiRealmsYamlPath, outputPath)
        
        const result = writer.writeFile(outputPath, content, {
          banner: {
            type: 'navigation',
            artifact: 'ui-realms',
            source: 'ui-realms.yaml',
          },
          type: 'form-types' as any,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })

        if (result.hasDrift && config.checkMode) {
          warnings.push(`UI Realms drift detected (check mode): ${outputPath}`)
        } else if (result.hasDrift) {
          errors.push(`UI Realms drift detected: ${outputPath}`)
        }
      } catch (error: any) {
        errors.push(`UI Realms generation failed: ${error.message}`)
      }
    } else {
      warnings.push(`UI Realms YAML not found: ${uiRealmsYamlPath}`)
    }

    // Generate Navigation Shells
    if (existsSync(navigationShellsYamlPath)) {
      try {
        const outputPath = join(navigationOutputDir, 'navigation-shells.generated.ts')
        const { content } = await generateNavigationShellsCode(navigationShellsYamlPath, outputPath)
        
        const result = writer.writeFile(outputPath, content, {
          banner: {
            type: 'navigation',
            artifact: 'navigation-shells',
            source: 'navigation-shells.yaml',
          },
          type: 'form-types' as any,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })

        if (result.hasDrift && config.checkMode) {
          warnings.push(`Navigation Shells drift detected (check mode): ${outputPath}`)
        } else if (result.hasDrift) {
          errors.push(`Navigation Shells drift detected: ${outputPath}`)
        }
      } catch (error: any) {
        errors.push(`Navigation Shells generation failed: ${error.message}`)
      }
    } else {
      warnings.push(`Navigation Shells YAML not found: ${navigationShellsYamlPath}`)
    }

    // Generate Node Detail Sections
    if (existsSync(nodeDetailSectionsYamlPath)) {
      try {
        const outputPath = join(navigationOutputDir, 'node-detail-sections.generated.ts')
        const { content } = await generateNodeDetailSectionsCode(nodeDetailSectionsYamlPath, outputPath)
        
        const result = writer.writeFile(outputPath, content, {
          banner: {
            type: 'navigation',
            artifact: 'node-detail-sections',
            source: 'node-detail-sections.yaml',
          },
          type: 'form-types' as any,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })

        if (result.hasDrift && config.checkMode) {
          warnings.push(`Node Detail Sections drift detected (check mode): ${outputPath}`)
        } else if (result.hasDrift) {
          errors.push(`Node Detail Sections drift detected: ${outputPath}`)
        }
      } catch (error: any) {
        errors.push(`Node Detail Sections generation failed: ${error.message}`)
      }
    } else {
      warnings.push(`Node Detail Sections YAML not found: ${nodeDetailSectionsYamlPath}`)
    }

    // Generate Chat Layout
    if (existsSync(chatLayoutYamlPath)) {
      try {
        const outputPath = join(navigationOutputDir, 'chat-layout.generated.ts')
        const { content } = await generateChatLayoutCode(chatLayoutYamlPath, outputPath)
        
        const result = writer.writeFile(outputPath, content, {
          banner: {
            type: 'navigation',
            artifact: 'chat-layout',
            source: 'chat-layout.yaml',
          },
          type: 'form-types' as any,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })

        if (result.hasDrift && config.checkMode) {
          warnings.push(`Chat Layout drift detected (check mode): ${outputPath}`)
        } else if (result.hasDrift) {
          errors.push(`Chat Layout drift detected: ${outputPath}`)
        }
      } catch (error: any) {
        errors.push(`Chat Layout generation failed: ${error.message}`)
      }
    } else {
      warnings.push(`Chat Layout YAML not found: ${chatLayoutYamlPath}`)
    }

    // Generate Workspace Sidebar
    if (existsSync(workspaceSidebarYamlPath)) {
      try {
        const outputPath = join(navigationOutputDir, 'workspace-sidebar.generated.ts')
        const { content } = await generateWorkspaceSidebarCode(workspaceSidebarYamlPath, outputPath)
        
        const result = writer.writeFile(outputPath, content, {
          banner: {
            type: 'navigation',
            artifact: 'workspace-sidebar',
            source: 'workspace-sidebar.yaml',
          },
          type: 'form-types' as any,
          checkMode: config.checkMode,
          dryRun: config.dryRun,
        })

        if (result.hasDrift && config.checkMode) {
          warnings.push(`Workspace Sidebar drift detected (check mode): ${outputPath}`)
        } else if (result.hasDrift) {
          errors.push(`Workspace Sidebar drift detected: ${outputPath}`)
        }
      } catch (error: any) {
        errors.push(`Workspace Sidebar generation failed: ${error.message}`)
      }
    } else {
      warnings.push(`Workspace Sidebar YAML not found: ${workspaceSidebarYamlPath}`)
    }

    // Generate Dashboards
    if (existsSync(dashboardsYamlDir)) {
      // Find all dashboard YAML files
      const dashboardFiles = [
        { name: 'dashboard.view.yaml', output: 'dashboard.generated.ts' },
        { name: 'epistemic-console.view.yaml', output: 'epistemic-console.generated.ts' },
      ]

      for (const { name, output } of dashboardFiles) {
        const yamlPath = join(dashboardsYamlDir, name)
        if (existsSync(yamlPath)) {
          try {
            const outputPath = join(dashboardsOutputDir, output)
            const { content } = await generateDashboardCode(yamlPath, outputPath)
            
            const result = writer.writeFile(outputPath, content, {
              banner: {
                type: 'dashboard',
                artifact: name.replace('.view.yaml', ''),
                source: name,
              },
              type: 'form-types' as any,
              checkMode: config.checkMode,
              dryRun: config.dryRun,
            })

            if (result.hasDrift && config.checkMode) {
              warnings.push(`Dashboard ${name} drift detected (check mode): ${outputPath}`)
            } else if (result.hasDrift) {
              errors.push(`Dashboard ${name} drift detected: ${outputPath}`)
            }
          } catch (error: any) {
            errors.push(`Dashboard ${name} generation failed: ${error.message}`)
          }
        } else {
          warnings.push(`Dashboard YAML not found: ${yamlPath}`)
        }
      }
    } else {
      warnings.push(`Dashboards directory does not exist: ${dashboardsYamlDir}`)
    }

    // Generate Invariants
    if (existsSync(invariantsYamlDir)) {
      // Find all invariant YAML files
      const invariantFiles = [
        { name: 'invariant-dashboard.view.yaml', output: 'invariant-dashboard.generated.ts' },
        { name: 'node-invariant-status.view.yaml', output: 'node-invariant-status.generated.ts' },
      ]

      for (const { name, output } of invariantFiles) {
        const yamlPath = join(invariantsYamlDir, name)
        if (existsSync(yamlPath)) {
          try {
            const outputPath = join(invariantsOutputDir, output)
            const { content } = await generateInvariantCode(yamlPath, outputPath)
            
            const result = writer.writeFile(outputPath, content, {
              banner: {
                type: 'invariant',
                artifact: name.replace('.view.yaml', ''),
                source: name,
              },
              type: 'form-types' as any,
              checkMode: config.checkMode,
              dryRun: config.dryRun,
            })

            if (result.hasDrift && config.checkMode) {
              warnings.push(`Invariant ${name} drift detected (check mode): ${outputPath}`)
            } else if (result.hasDrift) {
              errors.push(`Invariant ${name} drift detected: ${outputPath}`)
            }
          } catch (error: any) {
            errors.push(`Invariant ${name} generation failed: ${error.message}`)
          }
        } else {
          warnings.push(`Invariant YAML not found: ${yamlPath}`)
        }
      }
    } else {
      warnings.push(`Invariants directory does not exist: ${invariantsYamlDir}`)
    }

    const duration = Date.now() - startTime

    // In check mode, treat drift warnings as non-fatal
    const success = errors.length === 0 || (config.checkMode && errors.every(e => e.includes('drift detected')))

    return {
      phase: 6.5,
      name: 'Navigation Canonicalization',
      success,
      errors: config.checkMode ? [] : errors, // Don't report errors in check mode, only warnings
      warnings: config.checkMode ? [...warnings, ...errors] : warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    return {
      phase: 6.5,
      name: 'Navigation Canonicalization',
      success: false,
      errors: [`Navigation canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

