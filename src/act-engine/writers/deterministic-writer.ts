/**
 * ✅ ENTELECHIA: Deterministic File Writer
 * 
 * Unified file writer for all ACT Engine outputs.
 * 
 * Features:
 * - Stable ordering (sorted paths)
 * - Generation banners
 * - Idempotent writes (hash-based)
 * - Diff-friendly formatting
 * - Drift detection
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { hashContent, hashesMatch } from './hashing.js'
import { generateBanner, type BannerOptions } from './banners.js'

export interface WriteFileOptions {
  banner: BannerOptions
  type: 'schema' | 'migration' | 'service' | 'route' | 'test' | 'form' | 'form-types' | 'invariant-mapping'
  contract?: string
  domain?: string
  checkMode?: boolean // CI mode: don't write, just check
  dryRun?: boolean // Show what would be written
}

export interface WriteResult {
  success: boolean
  written: boolean // false if content unchanged or check mode
  hash: string
  existingHash?: string
  hasDrift?: boolean
  error?: string
}

/**
 * Deterministic file writer
 * 
 * Writes files with:
 * - Generation banner
 * - Consistent formatting
 * - Hash-based drift detection
 * - Idempotent writes (skip if unchanged)
 */
export class DeterministicWriter {
  private writtenFiles: Map<string, string> = new Map() // path -> hash
  
  /**
   * Write file deterministically
   */
  writeFile(
    path: string,
    content: string,
    options: WriteFileOptions
  ): WriteResult {
    try {
      // Generate banner
      const banner = generateBanner(options.banner)
      const fullContent = `${banner}\n\n${content}`
      
      // Hash content
      const contentHash = hashContent(fullContent)
      
      // Check if file exists
      const fileExists = existsSync(path)
      let existingHash: string | undefined
      let hasDrift = false
      
      if (fileExists) {
        try {
          const existingContent = readFileSync(path, 'utf-8')
          existingHash = hashContent(existingContent)
          hasDrift = !hashesMatch(contentHash, existingHash)
        } catch (error: any) {
          // File exists but can't read - treat as drift
          hasDrift = true
        }
      }
      
      // In check mode, don't write
      if (options.checkMode) {
        return {
          success: !hasDrift,
          written: false,
          hash: contentHash,
          existingHash,
          hasDrift,
          error: hasDrift ? 'Drift detected (check mode)' : undefined,
        }
      }
      
      // In dry-run mode, don't write
      if (options.dryRun) {
        return {
          success: true,
          written: false,
          hash: contentHash,
          existingHash,
          hasDrift,
        }
      }
      
      // Skip write if content unchanged
      if (fileExists && !hasDrift) {
        this.writtenFiles.set(path, contentHash)
        return {
          success: true,
          written: false,
          hash: contentHash,
          existingHash,
          hasDrift: false,
        }
      }
      
      // Ensure directory exists
      const dir = dirname(path)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      
      // Write file
      writeFileSync(path, fullContent, 'utf-8')
      this.writtenFiles.set(path, contentHash)
      
      return {
        success: true,
        written: true,
        hash: contentHash,
        existingHash,
        hasDrift: false,
      }
    } catch (error: any) {
      return {
        success: false,
        written: false,
        hash: '',
        error: error.message || String(error),
      }
    }
  }
  
  /**
   * Check drift without writing
   */
  checkDrift(path: string, expectedContent: string): {
    hasDrift: boolean
    existingHash?: string
    expectedHash: string
    diff?: string
  } {
    const expectedHash = hashContent(expectedContent)
    const fileExists = existsSync(path)
    
    if (!fileExists) {
      return {
        hasDrift: true,
        expectedHash,
        diff: 'File does not exist',
      }
    }
    
    try {
      const existingContent = readFileSync(path, 'utf-8')
      const existingHash = hashContent(existingContent)
      const hasDrift = !hashesMatch(expectedHash, existingHash)
      
      return {
        hasDrift,
        existingHash,
        expectedHash,
        diff: hasDrift ? 'Content differs' : undefined,
      }
    } catch (error: any) {
      return {
        hasDrift: true,
        expectedHash,
        diff: `Cannot read file: ${error.message}`,
      }
    }
  }
  
  /**
   * Get all written files
   */
  getWrittenFiles(): Map<string, string> {
    return new Map(this.writtenFiles)
  }
  
  /**
   * Clear written files tracking
   */
  clear(): void {
    this.writtenFiles.clear()
  }
}


