# ACT-Engine Migration - Steg 1 Status

## ✅ Genomfört

1. **Paketstruktur skapad**
   - `packages/act-engine/` med `package.json`, `tsconfig.json`, `README.md`
   - Workspace uppdaterad att inkludera ACT-engine
   - Backend `package.json` uppdaterad att dependera på `@entelechia/act-engine`

2. **Kod flyttad**
   - `entelechia-backend/src/act-engine/**` → `packages/act-engine/src/act-engine/`
   - `entelechia-backend/src/forms/**` → `packages/act-engine/src/forms/`
   - `entelechia-backend/src/navigation/**` → `packages/act-engine/src/navigation/`

3. **Imports uppdaterade (delvis)**
   - Relativa imports för `ContractDefinition` uppdaterade till `@entelechia/shared` (men typerna finns inte där ännu)
   - CLI uppdaterad att dynamiskt ladda metadata från backend

## ⚠️ Kvarvarande problem

1. **ContractDefinition typer**
   - `ContractDefinition` ligger i `entelechia-backend/src/contracts/metadata/types.ts`
   - ACT-engine försöker importera från `@entelechia/shared/contracts/metadata/types` men den finns inte där
   - **Lösning behövs**: Flytta `ContractDefinition` och relaterade typer till `@entelechia/shared` eller skapa en wrapper

2. **Backend-specifika imports**
   - ACL (`role-compiler`, `action-registry`) importeras relativt från backend
   - Metadata validator importeras relativt från backend
   - **Lösning behövs**: Dessa ska skickas in som parametrar eller flyttas till shared

3. **Test-filer**
   - Test-filer importerar fortfarande från backend metadata direkt
   - **Lösning behövs**: Uppdatera tester att använda dynamisk import eller mocka metadata

## 📋 Nästa steg

1. **Flytta ContractDefinition till shared**
   - Kopiera `entelechia-backend/src/contracts/metadata/types.ts` till `entelechia-shared/src/contracts/metadata/types.ts`
   - Uppdatera exports i shared
   - Uppdatera backend att importera från shared

2. **Uppdatera ACL-imports**
   - Skapa interfaces för ACL i shared eller skicka in som parametrar till ACT-engine

3. **Uppdatera alla imports i ACT-engine**
   - Systematiskt gå igenom alla filer och fixa imports

4. **Verifiera build**
   - `npm run build --workspace=packages/act-engine`
   - `npm run typecheck --workspace=packages/act-engine`

## 🎯 Status: 70% klar

Paketet är skapat och kod är flyttad, men imports behöver fixas innan det kan byggas.

