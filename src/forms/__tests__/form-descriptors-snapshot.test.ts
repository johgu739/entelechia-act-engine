/**
 * ✅ ENTELECHIA: Form Descriptors Snapshot Tests
 * 
 * Snapshot tests for generated form descriptors.
 * 
 * PRINCIPLE: Ensures descriptors remain stable and deterministic.
 * 
 * FORM → ACT → STATE:
 * - FORM: YAML + metadata
 * - ACT: Canonicalizer generates descriptors
 * - STATE: Snapshot captures descriptor structure
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { canonicalizeForm } from '../canonicalizer.js'
import { NodeContractMetadata } from '../../contracts/metadata/node.contract.metadata.js'
import { WorkspaceContractMetadata } from '../../contracts/metadata/workspace.contract.metadata.js'
import { DashboardContractMetadata } from '../../contracts/metadata/dashboard.contract.metadata.js'
import { LedgerEntryContractMetadata } from '../../contracts/metadata/ledger-entry.contract.metadata.js'
import { FormYamlSchema } from '../yaml-schema.js'

/**
 * Load and parse YAML file
 */
function loadYaml(yamlPath: string): any {
  const content = readFileSync(yamlPath, 'utf-8')
  const parsed = parse(content)
  return FormYamlSchema.parse(parsed)
}

describe('Form Descriptors Snapshot Tests', () => {
  const formsDir = join(process.cwd(), '..', 'entelechia-ui', 'forms')

  describe('Node Forms', () => {
    it('should generate stable edit form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'Node.edit.form.yaml'))
      const descriptor = canonicalizeForm(yaml, NodeContractMetadata)
      
      expect(descriptor).toMatchSnapshot('node-edit-form-descriptor')
    })

    it('should generate stable view form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'Node.view.form.yaml'))
      const descriptor = canonicalizeForm(yaml, NodeContractMetadata)
      
      expect(descriptor).toMatchSnapshot('node-view-form-descriptor')
    })
  })

  describe('Workspace Forms', () => {
    it('should generate stable edit form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'Workspace.edit.form.yaml'))
      const descriptor = canonicalizeForm(yaml, WorkspaceContractMetadata)
      
      expect(descriptor).toMatchSnapshot('workspace-edit-form-descriptor')
    })

    it('should generate stable view form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'Workspace.view.form.yaml'))
      const descriptor = canonicalizeForm(yaml, WorkspaceContractMetadata)
      
      expect(descriptor).toMatchSnapshot('workspace-view-form-descriptor')
    })
  })

  describe('Dashboard Forms', () => {
    it('should generate stable view form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'Dashboard.view.form.yaml'))
      const descriptor = canonicalizeForm(yaml, DashboardContractMetadata)
      
      expect(descriptor).toMatchSnapshot('dashboard-view-form-descriptor')
    })
  })

  describe('LedgerEntry Forms', () => {
    it('should generate stable edit form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'LedgerEntry.edit.form.yaml'))
      const descriptor = canonicalizeForm(yaml, LedgerEntryContractMetadata)
      
      expect(descriptor).toMatchSnapshot('ledger-entry-edit-form-descriptor')
    })

    it('should generate stable view form descriptor', () => {
      const yaml = loadYaml(join(formsDir, 'LedgerEntry.view.form.yaml'))
      const descriptor = canonicalizeForm(yaml, LedgerEntryContractMetadata)
      
      expect(descriptor).toMatchSnapshot('ledger-entry-view-form-descriptor')
    })
  })
})


