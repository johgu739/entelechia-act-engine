/**
 * ✅ ENTELECHIA: Content Hashing for Drift Detection
 * 
 * Deterministic hashing of file content for drift detection.
 */

import { createHash } from 'crypto'

/**
 * Hash file content deterministically
 * 
 * Uses SHA-256 for collision resistance.
 * Normalizes content (removes trailing whitespace, normalizes line endings).
 */
export function hashContent(content: string): string {
  // Normalize content for deterministic hashing
  const normalized = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\n+$/, '') // Remove trailing newlines
    .trimEnd()
  
  return createHash('sha256').update(normalized, 'utf8').digest('hex')
}

/**
 * Compare two content hashes
 */
export function hashesMatch(hash1: string, hash2: string): boolean {
  return hash1 === hash2
}


