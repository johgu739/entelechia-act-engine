# @entelechia/act-engine

ACT Engine - FORM → ACT → STATE transformation pipeline.

## Purpose

The ACT Engine transforms FORM (YAML + contract metadata) into STATE (generated TypeScript code, descriptors, schemas).

## Architecture

- **FORM**: YAML files (`*.form.yaml`, `*.view.yaml`) + contract metadata
- **ACT**: Canonicalizers, validators, generators
- **STATE**: Generated TypeScript code consumed by UI and backend

## Structure

- `cli/` - CLI entry point (`act-recompute.ts`)
- `pipeline/` - Main pipeline orchestrator and phases
- `generators/` - Code generators (forms, schemas, migrations, routes, etc.)
- `manifests/` - ACT manifests (contract, form, ACL, invariant)
- `validators/` - Validation logic
- `writers/` - Deterministic file writers
- `forms/` - Form canonicalization (YAML → descriptors)
- `navigation/` - Navigation metadata loaders

## Dependencies

- `@entelechia/shared` - Contract definitions
- `@entelechia/invariant-engine` - Invariant definitions

## Usage

```bash
# From workspace root
npm run act:recompute

# Or directly
tsx packages/act-engine/src/cli/act-recompute.ts
```

## Build

```bash
npm run build
npm run typecheck
```

