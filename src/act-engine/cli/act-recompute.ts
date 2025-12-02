#!/usr/bin/env tsx

/**
 * ✅ ENTELECHIA: ACT Engine CLI
 * 
 * Single entry point for all ACT transformations.
 * 
 * Usage:
 *   tsx src/act-engine/cli/act-recompute.ts [--check] [--dry-run]
 */

import { runActPipeline, DEFAULT_ACT_CONFIG } from '../pipeline/index.js'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'

/**
 * Load contract metadata from backend
 * CLI entry point can import from backend dynamically
 */
async function loadContractMetadata(workspaceRoot: string): Promise<ContractDefinition[]> {
  // Try to import from backend metadata
  // This is a CLI-only dependency - ACT-engine core doesn't depend on backend
  const backendMetadataPath = join(workspaceRoot, 'entelechia-backend', 'src', 'contracts', 'metadata', 'index.ts')
  
  if (!existsSync(backendMetadataPath)) {
    throw new Error(`Backend metadata not found at ${backendMetadataPath}`)
  }
  
  // Dynamic import from backend
  const backendMetadata = await import(`file://${backendMetadataPath}`)
  
  return [
    backendMetadata.NodeContractMetadata,
    backendMetadata.LedgerEntryContractMetadata,
    backendMetadata.WorkspaceContractMetadata,
    backendMetadata.BackendLedgerContractMetadata,
    backendMetadata.BackendLedgerStateContractMetadata,
    backendMetadata.BackendAuthContractMetadata,
    backendMetadata.BackendSystemContractMetadata,
    backendMetadata.BackendHealthContractMetadata,
    backendMetadata.BackendErrorsContractMetadata,
    backendMetadata.BackendObservabilityContractMetadata,
    backendMetadata.BackendChatContractMetadata,
    backendMetadata.BackendDatabaseContractMetadata,
    backendMetadata.BackendInternalContractMetadata,
    backendMetadata.BackendMiscContractMetadata,
    backendMetadata.DashboardContractMetadata,
  ]
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const checkMode = args.includes('--check')
  const dryRun = args.includes('--dry-run')
  
  // Find workspace root (where package.json with workspaces is)
  // CLI can be run from workspace root or backend directory
  let workspaceRoot = process.cwd()
  let packageJsonPath = join(workspaceRoot, 'package.json')
  
  // Try current directory first
  if (existsSync(packageJsonPath)) {
    try {
      const pkgContent = readFileSync(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(pkgContent)
      if (pkg.workspaces) {
        // Found it!
      } else {
        // Not workspace root, try going up one level
        workspaceRoot = join(workspaceRoot, '..')
        packageJsonPath = join(workspaceRoot, 'package.json')
        if (existsSync(packageJsonPath)) {
          const pkgUpContent = readFileSync(packageJsonPath, 'utf-8')
          const pkgUp = JSON.parse(pkgUpContent)
          if (!pkgUp.workspaces) {
            throw new Error('Not workspace root')
          }
        } else {
          throw new Error('Package.json not found')
        }
      }
    } catch (error: any) {
      // Try going up from backend directory
      if (workspaceRoot.endsWith('entelechia-backend')) {
        workspaceRoot = join(workspaceRoot, '..')
        packageJsonPath = join(workspaceRoot, 'package.json')
        if (existsSync(packageJsonPath)) {
          try {
            const pkgContent = readFileSync(packageJsonPath, 'utf-8')
            const pkg = JSON.parse(pkgContent)
            if (!pkg.workspaces) {
              throw new Error('Not workspace root')
            }
          } catch {
            console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
            console.error(`   Current directory: ${process.cwd()}`)
            console.error(`   Tried: ${packageJsonPath}`)
            process.exit(1)
          }
        } else {
          console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
          console.error(`   Current directory: ${process.cwd()}`)
          console.error(`   Tried: ${packageJsonPath}`)
          process.exit(1)
        }
      } else {
        console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
        console.error(`   Current directory: ${process.cwd()}`)
        console.error(`   Error: ${error.message}`)
        process.exit(1)
      }
    }
  } else {
    // Try going up one level
    workspaceRoot = join(workspaceRoot, '..')
    packageJsonPath = join(workspaceRoot, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const pkgContent = readFileSync(packageJsonPath, 'utf-8')
        const pkg = JSON.parse(pkgContent)
        if (!pkg.workspaces) {
          console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
          console.error(`   Current directory: ${process.cwd()}`)
          process.exit(1)
        }
      } catch {
        console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
        console.error(`   Current directory: ${process.cwd()}`)
        process.exit(1)
      }
    } else {
      console.error('❌ Error: Cannot find workspace root (package.json with workspaces).')
      console.error(`   Current directory: ${process.cwd()}`)
      process.exit(1)
    }
  }
  
  // Change to workspace root for consistent path resolution
  process.chdir(workspaceRoot)
  
  console.log('='.repeat(80))
  console.log('✅ ENTELECHIA: ACT Engine')
  console.log('='.repeat(80))
  console.log(`Workspace Root: ${workspaceRoot}`)
  console.log('')
  
  if (checkMode) {
    console.log('🔍 CHECK MODE: Validating without writing')
  }
  if (dryRun) {
    console.log('🔍 DRY RUN MODE: Showing what would be generated')
  }
  console.log('')
  
  // Load contract metadata from backend
  console.log('📦 Loading contract metadata...')
  const allMetadata = await loadContractMetadata(workspaceRoot)
  console.log(`✅ Loaded ${allMetadata.length} contract metadata definitions`)
  console.log('')
  
  const result = await runActPipeline(allMetadata, {
    ...DEFAULT_ACT_CONFIG,
    checkMode,
    dryRun,
  })
  
  // Print results
  console.log('')
  console.log('='.repeat(80))
  console.log('RESULTS')
  console.log('='.repeat(80))
  console.log(`Success: ${result.success ? '✅' : '❌'}`)
  console.log(`Total Duration: ${result.totalDuration}ms`)
  console.log(`Phases: ${result.phases.length}`)
  console.log(`Errors: ${result.errors.length}`)
  console.log(`Warnings: ${result.warnings.length}`)
  console.log('')
  
  // Print phase results
  for (const phase of result.phases) {
    const status = phase.success ? '✅' : '❌'
    console.log(`${status} Phase ${phase.phase}: ${phase.name} (${phase.duration}ms)`)
    if (phase.errors.length > 0) {
      for (const error of phase.errors) {
        console.log(`  ❌ ${error}`)
      }
    }
    if (phase.warnings.length > 0) {
      for (const warning of phase.warnings) {
        console.log(`  ⚠️  ${warning}`)
      }
    }
  }
  console.log('')
  
  // Print artifacts
  const allArtifacts = result.phases.flatMap(p => p.artifacts || [])
  if (allArtifacts.length > 0) {
    console.log('Generated Artifacts:')
    for (const artifact of allArtifacts) {
      console.log(`  - ${artifact}`)
    }
    console.log('')
  }
  
  // Exit with error code if failed
  if (!result.success) {
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main }

