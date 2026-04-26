## Context

The current plugin system already separates plugin source, manifest metadata, backend loading, frontend dynamic import, and prompt integration, but its development model still assumes each plugin behaves like a small standalone frontend project. Each plugin currently carries duplicated toolchain files and its own dependency installation, while the host frontend already owns the actual runtime where plugin code executes.

This change is cross-cutting because it affects:

- root package management and workspace layout
- frontend plugin loading and runtime expectations
- backend plugin manifest validation and plugin metadata APIs
- plugin templates and authoring guidance
- existing plugin package structure under `plugins/*`

The design must preserve the existing plugin architecture goals:

- plugin bundles are still built to `dist/index.esm.js`
- the host frontend continues to dynamically load enabled plugins
- plugin manifests remain the source of truth for plugin capabilities
- AI-assisted plugin authoring remains a first-class workflow

At the same time, it must stop treating plugins as isolated applications and instead formalize that they are extensions running inside a host-owned platform runtime.

## Goals / Non-Goals

**Goals:**

- establish a monorepo workspace structure where platform dependencies are installed once and shared
- define a host-plugin shared runtime contract for libraries such as `react`, `react-dom`, and `@a2ui/react`
- let plugin bundles continue to ship as `dist/index.esm.js` while externalizing shared runtime dependencies
- extend manifest metadata so the host can understand which dependencies are expected from the shared runtime
- reduce duplicated per-plugin build scaffolding by moving common configuration into shared presets or workspace-owned tooling
- provide a migration path for existing plugins without requiring an immediate redesign of all plugin code
- align plugin developer documentation and AI prompts with the new dependency and packaging model

**Non-Goals:**

- replacing the current dynamic import plugin model with a remote marketplace or package registry
- redesigning A2UI capability modeling or prompt injection semantics beyond what is needed for shared runtime support
- removing plugin-level private dependencies entirely
- changing the visible plugin authoring output format from `dist/index.esm.js`
- implementing a production deployment pipeline in this design

## Decisions

### 1. Adopt a root workspace with host-owned platform dependencies

The repository will gain a root workspace package configuration that manages shared frontend tooling and platform libraries across `frontend`, shared packages, and plugin packages.

Rationale:

- the duplication problem is primarily an installation and version-governance problem
- workspaces solve shared dependency installation without changing the plugin concept
- host-owned platform dependencies make the runtime ownership model explicit

Alternatives considered:

- keep per-plugin package management and only document conventions
  - rejected because it does not prevent drift or duplication
- eliminate plugin packages and compile plugin source only through the frontend app
  - rejected because it weakens plugin packaging boundaries and makes independent plugin build artifacts less explicit

### 2. Introduce a shared runtime contract instead of full plugin isolation

The system will define a new capability boundary called shared runtime: the host frontend guarantees the availability of a curated set of libraries, and plugins must treat those as external runtime dependencies rather than bundled internals.

Initial shared runtime set:

- `react`
- `react-dom`
- `@a2ui/react`

Candidate future additions when reused across multiple plugins:

- `three`
- `katex`
- `mermaid`

Rationale:

- plugins already execute inside the host application, so pretending they are runtime-isolated adds overhead without real isolation
- shared runtime externalization reduces repeated bundle weight and avoids multiple copies of core libraries
- a curated allowlist is safer than an open-ended “share anything” model

Alternatives considered:

- bundle every dependency inside each plugin
  - rejected because it preserves the current size and drift problem
- make every library host-provided from day one
  - rejected because some plugin-specific dependencies should remain private and local

### 3. Extend manifest semantics with shared dependency declarations

Plugin manifests will add a `sharedDependencies` field to declare which dependencies the plugin expects the host to provide. Backend validation and frontend loading will treat this as part of plugin compatibility metadata.

Example shape:

```json
{
  "sharedDependencies": ["react", "react-dom", "@a2ui/react"]
}
```

Rationale:

- plugin compatibility should be explicit, not inferred only from build conventions
- the host needs machine-readable metadata to validate plugin expectations
- manifest-level declaration keeps runtime contract next to capability metadata

Alternatives considered:

- infer shared dependencies only from bundler config
  - rejected because runtime expectations would not be visible to backend APIs or tooling
- store shared runtime configuration only in root workspace files
  - rejected because plugin artifacts would lose self-description

### 4. Preserve `dist/index.esm.js` as the plugin delivery artifact

The output contract for plugins remains `dist/index.esm.js`, but shared runtime dependencies must be externalized during build. Plugin bundles should contain domain logic and plugin-local code only.

Rationale:

- this preserves compatibility with the existing plugin loading path
- it minimizes disruption to backend static file serving and frontend dynamic import logic
- it allows migration without redefining what a plugin artifact is

Alternatives considered:

- switch to source-only plugins with no plugin build output
  - rejected for now because it is a larger architectural shift than needed
- move to a non-ESM bundle format
  - rejected because current frontend loading is already aligned with ESM

### 5. Move repeated plugin build configuration into shared tooling

Common plugin configuration such as TypeScript base config, Vite library mode defaults, external dependency rules, and template guidance should move into workspace-shared presets or helper packages. Individual plugins may keep small local overrides only when truly needed.

Likely shared assets:

- plugin tsconfig base
- plugin vite preset
- manifest template and schema guidance
- plugin runtime types and helper utilities

Rationale:

- current plugin `package.json`, `vite.config.ts`, and `tsconfig.json` files are nearly identical
- repeated scaffolding increases maintenance cost and confuses AI-generated plugin code
- a shared preset produces consistency without removing plugin boundaries

Alternatives considered:

- keep copying `_template` and manually update all plugin configs
  - rejected because this scales poorly and encourages divergence

### 6. Add a shared package for plugin runtime types and authoring helpers

Create a workspace-owned shared package, tentatively `packages/plugin-runtime`, to hold:

- plugin manifest types
- plugin registration contract helpers
- common props schema types
- A2UI-related authoring helpers
- shared guidance utilities for plugin templates

Rationale:

- shared code should live in a shared package rather than be duplicated into every plugin
- plugin authoring contracts become versioned and discoverable
- AI-generated plugin code can target a single canonical helper surface

Alternatives considered:

- keep runtime types only inside backend models
  - rejected because frontend/plugin authors also need a canonical contract
- place shared helpers directly in `frontend`
  - rejected because plugin authoring concerns should not be coupled to one app package

### 7. Migrate existing plugins incrementally

Existing plugins will be migrated in phases:

1. introduce workspace and shared presets
2. update manifest schema and validation to accept `sharedDependencies`
3. update frontend loader/runtime assumptions
4. migrate existing plugin configs to shared presets
5. move selected common libraries into host-provided shared runtime only when multiple plugins truly depend on them

Rationale:

- a staged migration reduces breakage risk
- current plugins can keep shipping while runtime expectations are tightened gradually
- some future shared runtime candidates, such as `three`, should only be promoted after usage proves commonality

Alternatives considered:

- rewrite all plugins to the new model in one pass
  - rejected because it raises risk and slows delivery

## Risks / Trade-offs

- [Shared runtime version mismatch] → Mitigation: keep a curated shared dependency allowlist and validate declared `sharedDependencies` against host-supported versions.
- [Existing plugins may assume fully local dependency graphs] → Mitigation: migrate plugins incrementally and keep compatibility checks in manifest validation and loader diagnostics.
- [Introducing a root workspace changes repository ergonomics] → Mitigation: document workspace commands clearly and provide plugin templates that hide most of the complexity.
- [Promoting a library to shared runtime too early can over-couple plugins to host decisions] → Mitigation: only promote libraries after repeated multi-plugin reuse and keep plugin-local dependencies allowed by default.
- [AI tooling may continue generating standalone-project patterns] → Mitigation: update plugin development docs, manifest prompts, and templates to explicitly forbid unnecessary per-plugin runtime duplication.
- [More manifest semantics increase validation complexity] → Mitigation: keep the new field minimal and machine-readable, and centralize schema validation in one shared contract.
