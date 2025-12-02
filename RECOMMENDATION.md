# Rekommendation: Fixa kvarvarande fel innan Fas 2?

## Analys av kvarvarande fel

### 1. Backend Metadata: Saknade `constraints` (290+ fel)

**Problem:**
- `FieldDefinition` kräver `constraints: FieldConstraint[]` (required field)
- Många backend metadata-filer saknar `constraints: []` på sina fält
- ACT-engine försöker iterera över `fieldDef.constraints` (canonicalizer.ts:101, schema-generator.ts:68)
- **Detta kommer att orsaka runtime-fel** när ACT-engine körs

**Impact:**
- ⚠️ **BLOCKERARDE**: Runtime-fel när ACT-engine försöker processa metadata
- ⚠️ **BLOCKERARDE**: Typecheck-fel förhindrar korrekt typning

**Fix:**
- Enkelt: Lägg till `constraints: []` på alla fält som saknar det
- Kan automatiseras med script

### 2. Invariant Engine: `window` object (5 fel)

**Problem:**
- Invariant engine använder `window` object (browser-only)
- ACT-engine kör i Node.js (ingen `window`)

**Impact:**
- ⚠️ **INTE BLOCKERANDE för ACT-engine**: Dessa fel är i invariant-engine paketet
- ⚠️ **INTE BLOCKERANDE för runtime**: ACT-engine använder inte dessa delar direkt
- ⚠️ **Typecheck-warning**: TypeScript klagar men kod fungerar

**Fix:**
- Fixas i invariant-engine paketet (lägg till `lib: ["DOM"]` i tsconfig eller conditional check)

## Rekommendation

### ✅ **JA - Fixa backend metadata-problemet innan Fas 2**

**Anledningar:**
1. **Runtime-fel**: ACT-engine kommer att krascha när den försöker processa metadata utan `constraints`
2. **Typecheck-blockering**: 290+ fel gör det svårt att verifiera att allt fungerar
3. **Enkelt att fixa**: Kan automatiseras med script (lägg till `constraints: []` på alla fält)
4. **Förhindrar framtida problem**: Bättre att fixa nu innan vi går vidare

### ❌ **NEJ - Invariant engine-problemet kan vänta**

**Anledningar:**
1. **Inte blockerande**: ACT-engine fungerar trots dessa fel
2. **Separate concern**: Invariant-engine-problem, inte ACT-engine-problem
3. **Kan fixas senare**: När vi gör invariant-engine cleanup

## Action Plan

1. **Fix backend metadata** (30 min):
   - Skapa script som lägger till `constraints: []` på alla fält som saknar det
   - Kör script på alla metadata-filer
   - Verifiera att typecheck passerar

2. **Fortsätt till Fas 2** efter backend metadata är fixat

3. **Fix invariant-engine** senare (separat task)

## Tidsestimering

- Backend metadata fix: ~30 minuter
- Verifiering: ~5 minuter
- **Total: ~35 minuter**

**Slutsats: Värt att fixa backend metadata-problemet nu innan Fas 2.**

